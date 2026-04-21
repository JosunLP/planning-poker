/**
 * useSession Composable
 *
 * Manages the state of a Planning Poker session with real-time synchronization.
 * Uses WebSocket for multi-user communication.
 */

import type { ISession, ISessionState, PokerValue } from '~/types'
import type { ConnectionStatus } from '~/composables/useWebSocket'
import type {
  ParticipantJoinedPayload,
  ParticipantLeftPayload,
  SessionCreatedPayload,
  SessionErrorPayload,
  SessionJoinedPayload,
  SessionLeftPayload,
  SessionUpdatedPayload,
} from '~/types/websocket'

/**
 * Extended state with join code and connection status
 */
interface ExtendedSessionState extends ISessionState {
  joinCode: string | null
}

interface SessionRecoveryData {
  joinCode: string
  reconnectToken: string
  participantName: string
  asObserver: boolean
}

const SESSION_RECOVERY_STORAGE_KEY = 'planning-poker:session-recovery'

function isSessionRecoveryData(value: unknown): value is SessionRecoveryData {
  if (!value || typeof value !== 'object') return false

  const recovery = value as Record<string, unknown>

  return typeof recovery.joinCode === 'string'
    && typeof recovery.reconnectToken === 'string'
    && typeof recovery.participantName === 'string'
    && typeof recovery.asObserver === 'boolean'
}

function removeStoredSessionRecovery(): void {
  if (!import.meta.client) return

  try {
    localStorage.removeItem(SESSION_RECOVERY_STORAGE_KEY)
  }
  catch (error) {
    console.error('[useSession] Failed to clear recovery data from storage:', error)
  }
}

function getStoredSessionRecovery(): SessionRecoveryData | null {
  if (!import.meta.client) return null

  try {
    const stored = localStorage.getItem(SESSION_RECOVERY_STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    if (!isSessionRecoveryData(parsed)) {
      removeStoredSessionRecovery()
      return null
    }

    return parsed
  }
  catch (error) {
    console.error('[useSession] Failed to load recovery data from storage:', error)
    removeStoredSessionRecovery()
    return null
  }
}

function storeSessionRecoveryData(recoveryData: SessionRecoveryData): void {
  if (!import.meta.client) return

  try {
    localStorage.setItem(SESSION_RECOVERY_STORAGE_KEY, JSON.stringify(recoveryData))
  }
  catch (error) {
    console.error('[useSession] Failed to save recovery data to storage:', error)
  }
}

function clearStoredSessionRecovery(joinCode?: string | null): void {
  if (!import.meta.client) return

  const stored = getStoredSessionRecovery()
  if (!stored) return

  if (!joinCode || stored.joinCode === joinCode) {
    removeStoredSessionRecovery()
  }
}

/**
 * Returns a stored reconnect token only when the rejoin request exactly matches
 * the original session identity, helping prevent accidental recovery mismatches.
 */
function getRecoveryReconnectToken(
  recovery: SessionRecoveryData | null,
  joinCode: string,
  participantName: string,
  asObserver: boolean,
): string | undefined {
  const normalizedParticipantName = participantName.trim()
  if (!recovery) {
    return undefined
  }

  const normalizedRecoveryName = recovery.participantName.trim()

  if (
    recovery.joinCode !== joinCode
    || normalizedRecoveryName !== normalizedParticipantName
    || recovery.asObserver !== asObserver
  ) {
    return undefined
  }

  return recovery.reconnectToken
}

function shouldAttemptReconnect(
  status: ConnectionStatus,
  previousStatus: ConnectionStatus | undefined,
  sessionState: ExtendedSessionState,
): boolean {
  return status === 'connected'
    && previousStatus === 'disconnected'
    && !!sessionState.joinCode
    && !!sessionState.currentParticipant
}

/**
 * Check if cards were just revealed (transition from voting to revealed)
 */
function wasCardsRevealed(oldSession: ISession | null, newSession: ISession): boolean {
  if (!oldSession) return false
  return oldSession.status === 'voting' && newSession.status === 'revealed' && newSession.cardsRevealed
}

/**
 * Composable for session management with WebSocket
 *
 * @example
 * ```ts
 * const { session, createSession, joinSession, selectCard, connectionStatus } = useSession()
 * ```
 */
export function useSession() {
  /**
   * WebSocket Composable
   */
  const { status: connectionStatus, send, on, connect } = useWebSocket({
    autoConnect: true,
    autoReconnect: true,
  })

  /**
   * Local stats composable for recording voting results
   */
  const { recordVotingResult } = useLocalStats()

  /**
   * Reactive session state
   */
  const state = useState<ExtendedSessionState>('session', () => ({
    session: null,
    currentParticipant: null,
    isHost: false,
    isConnected: false,
    error: null,
    joinCode: null,
  }))

  /**
   * Flag to ensure WebSocket handlers are registered only once per browser tab
   */
  const handlersRegistered = useState<boolean>('session-handlers-registered', () => false)
  const reconnectWatcherRegistered = useState<boolean>('session-reconnect-watcher-registered', () => false)

  /**
   * Wait for connection if not yet connected
   */
  async function ensureConnected(): Promise<boolean> {
    if (connectionStatus.value === 'connected') return true

    connect()

    // Wait max 5 seconds for connection
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000)
      const unwatch = watch(connectionStatus, (status) => {
        if (status === 'connected') {
          clearTimeout(timeout)
          unwatch()
          resolve(true)
        } else if (status === 'error') {
          clearTimeout(timeout)
          unwatch()
          resolve(false)
        }
      })
    })
  }

  /**
   * Register WebSocket event handlers (only once per browser tab)
   */
  if (import.meta.client && !handlersRegistered.value) {
    handlersRegistered.value = true
    // Session created
    on<SessionCreatedPayload>('session:created', (payload) => {
      storeSessionRecoveryData({
        joinCode: payload.joinCode,
        reconnectToken: payload.reconnectToken,
        participantName: payload.participant.name,
        asObserver: payload.participant.isObserver,
      })
      state.value = {
        session: payload.session,
        currentParticipant: payload.participant,
        isHost: true,
        isConnected: true,
        error: null,
        joinCode: payload.joinCode,
      }
    })

    // Session joined
    on<SessionJoinedPayload>('session:joined', (payload) => {
      storeSessionRecoveryData({
        joinCode: payload.joinCode,
        reconnectToken: payload.reconnectToken,
        participantName: payload.participant.name,
        asObserver: payload.participant.isObserver,
      })
      state.value = {
        session: payload.session,
        currentParticipant: payload.participant,
        isHost: payload.session.hostId === payload.participant.id,
        isConnected: true,
        error: null,
        joinCode: payload.joinCode,
      }
    })

    // Session updated
    on<SessionUpdatedPayload>('session:updated', (payload) => {
      if (!state.value.currentParticipant) return

      // Check if cards were just revealed - record stats
      if (wasCardsRevealed(state.value.session, payload.session) && state.value.joinCode) {
        const votersOnly = payload.session.participants.filter(p => !p.isObserver)
        recordVotingResult(payload.session, state.value.joinCode, votersOnly)
      }

      // Get current participant from updated list
      const updatedParticipant = payload.session.participants.find(
        p => p.id === state.value.currentParticipant?.id
      )

      state.value = {
        ...state.value,
        session: payload.session,
        currentParticipant: updatedParticipant ?? state.value.currentParticipant,
        isHost: payload.session.hostId === state.value.currentParticipant?.id,
      }
    })

    // Participant joined (others)
    on<ParticipantJoinedPayload>('participant:joined', (payload) => {
      if (!state.value.session) return

      // Check if participant already exists
      const exists = state.value.session.participants.some(p => p.id === payload.participant.id)
      if (exists) return

      state.value = {
        ...state.value,
        session: {
          ...state.value.session,
          participants: [...state.value.session.participants, payload.participant],
        },
      }
    })

    // Participant left
    on<ParticipantLeftPayload>('participant:left', (payload) => {
      if (!state.value.session) return

      state.value = {
        ...state.value,
        session: {
          ...state.value.session,
          participants: state.value.session.participants.filter(
            p => p.id !== payload.participantId
          ),
        },
      }
    })

    // Session left confirmed
    on<SessionLeftPayload>('session:left', (_payload) => {
      clearStoredSessionRecovery(state.value.joinCode)
      state.value = {
        session: null,
        currentParticipant: null,
        isHost: false,
        isConnected: false,
        error: null,
        joinCode: null,
      }
    })

    // Error
    on<SessionErrorPayload>('session:error', (payload) => {
      state.value = {
        ...state.value,
        error: payload.message,
      }
    })
  }

  if (import.meta.client && !reconnectWatcherRegistered.value) {
    reconnectWatcherRegistered.value = true
    watch(connectionStatus, (status, previousStatus) => {
      if (!shouldAttemptReconnect(status, previousStatus, state.value)) {
        return
      }

      const currentParticipant = state.value.currentParticipant
      const currentJoinCode = state.value.joinCode
      if (!currentParticipant || !currentJoinCode) {
        return
      }

      const reconnectToken = getRecoveryReconnectToken(
        getStoredSessionRecovery(),
        currentJoinCode,
        currentParticipant.name,
        currentParticipant.isObserver,
      )
      if (!reconnectToken) {
        return
      }

      send('session:join', {
        joinCode: currentJoinCode,
        participantName: currentParticipant.name,
        asObserver: currentParticipant.isObserver,
        reconnectToken,
      })
    })
  }

  // ============================================
  // Computed Properties
  // ============================================

  /**
   * Join code of the current session
   */
  const joinCode = computed(() => state.value.joinCode)

  /**
   * Current session
   */
  const session = computed(() => state.value.session)

  /**
   * Current participant
   */
  const currentParticipant = computed(() => state.value.currentParticipant)

  /**
   * Is the current user the host?
   */
  const isHost = computed(() => state.value.isHost)

  /**
   * All participants who can vote
   */
  const voters = computed(() =>
    state.value.session?.participants.filter(p => !p.isObserver) ?? []
  )

  /**
   * All observers
   */
  const observers = computed(() =>
    state.value.session?.participants.filter(p => p.isObserver) ?? []
  )

  /**
   * Have all participants voted?
   */
  const allVotesIn = computed(() => {
    if (!voters.value.length) return false
    return voters.value.every(p => p.selectedValue !== null)
  })

  /**
   * Number of votes cast
   */
  const votesCount = computed(() =>
    voters.value.filter(p => p.selectedValue !== null).length
  )

  /**
   * Error state
   */
  const error = computed(() => state.value.error)

  // ============================================
  // Actions
  // ============================================

  /**
   * Creates a new session
   *
   * @param sessionName - Name of the session
   * @param participantName - Name of the host
   */
  async function createSession(sessionName: string, participantName: string): Promise<void> {
    // Validation
    if (!sessionName.trim() || !participantName.trim()) {
      state.value = {
        ...state.value,
        error: 'Please fill in all fields.',
      }
      return
    }

    // Ensure WebSocket is connected
    const connected = await ensureConnected()
    if (!connected) {
      state.value = {
        ...state.value,
        error: 'Could not connect to the server.',
      }
      return
    }

    send('session:create', {
      sessionName: sessionName.trim(),
      participantName: participantName.trim(),
    })
  }

  /**
   * Joins an existing session
   *
   * @param code - Join code of the session
   * @param participantName - Name of the participant
   * @param asObserver - Join as observer
   */
  async function joinSession(code: string, participantName: string, asObserver = false): Promise<void> {
    // Validation
    const normalizedCode = code.toUpperCase().trim()
    const normalizedName = participantName.trim()
    if (normalizedCode.length !== 6) {
      state.value = {
        ...state.value,
        error: 'The join code must be 6 characters long.',
      }
      return
    }

    if (!normalizedName) {
      state.value = {
        ...state.value,
        error: 'Please enter your name.',
      }
      return
    }

    // Ensure WebSocket is connected
    const connected = await ensureConnected()
    if (!connected) {
      state.value = {
        ...state.value,
        error: 'Could not connect to the server.',
      }
      return
    }

    const recovery = getStoredSessionRecovery()
    const reconnectToken = getRecoveryReconnectToken(recovery, normalizedCode, normalizedName, asObserver)

    send('session:join', {
      joinCode: normalizedCode,
      participantName: normalizedName,
      asObserver,
      reconnectToken,
    })
  }

  /**
   * Selects a card
   *
   * @param value - The card value
   */
  function selectCard(value: PokerValue): void {
    if (!state.value.session || !state.value.currentParticipant) return
    if (state.value.currentParticipant.isObserver) return

    send('vote:select', {
      sessionId: state.value.session.id,
      value,
    })
  }

  /**
   * Reveals all cards (host only)
   */
  function revealCards(): void {
    if (!state.value.session || !state.value.isHost) return

    send('vote:reveal', {
      sessionId: state.value.session.id,
    })
  }

  /**
   * Updates the session configuration (host only)
   */
  function updateSessionConfig(autoReveal: boolean): void {
    if (!state.value.session || !state.value.isHost) return

    send('session:update-config', {
      sessionId: state.value.session.id,
      autoReveal,
    })
  }

  /**
   * Starts a new voting round (host only)
   *
   * @param story - The story to estimate
   * @param description - Optional description
   */
  function startVoting(story: string, description?: string): void {
    if (!state.value.session || !state.value.isHost) return

    send('voting:start', {
      sessionId: state.value.session.id,
      story,
      description,
    })
  }

  /**
   * Adds a story to the queue (host only)
   */
  function addStory(title: string, description?: string): void {
    if (!state.value.session || !state.value.isHost) return

    send('story:add', {
      sessionId: state.value.session.id,
      title,
      description,
    })
  }

  /**
   * Removes a story from the queue (host only)
   */
  function removeStory(storyId: string): void {
    if (!state.value.session || !state.value.isHost) return

    send('story:remove', {
      sessionId: state.value.session.id,
      storyId,
    })
  }

  /**
   * Updates a story (host only)
   */
  function updateStory(storyId: string, title: string, description?: string): void {
    if (!state.value.session || !state.value.isHost) return

    send('story:update', {
      sessionId: state.value.session.id,
      storyId,
      title,
      description,
    })
  }

  /**
   * Starts the next story (host only)
   * Also triggers story points sync if configured
   */
  function nextStory(): void {
    if (!state.value.session || !state.value.isHost) return

    send('story:next', {
      sessionId: state.value.session.id,
    })
  }

  /**
   * Resets the current round (host only)
   */
  function resetVoting(): void {
    if (!state.value.session || !state.value.isHost) return

    send('vote:reset', {
      sessionId: state.value.session.id,
    })
  }

  /**
   * Leaves the current session
   */
  function leaveSession(): void {
    if (!state.value.session) return

    clearStoredSessionRecovery(state.value.joinCode)
    send('session:leave', {
      sessionId: state.value.session.id,
    })
  }

  /**
   * Reset error
   */
  function clearError(): void {
    state.value = {
      ...state.value,
      error: null,
    }
  }

  return {
    // State
    session,
    currentParticipant,
    isHost,
    voters,
    observers,
    allVotesIn,
    votesCount,
    joinCode,
    error,
    connectionStatus,

    // Actions
    createSession,
    joinSession,
    selectCard,
    revealCards,
    updateSessionConfig,
    startVoting,
    addStory,
    removeStory,
    updateStory,
    nextStory,
    resetVoting,
    leaveSession,
    clearError,
  }
}
