/**
 * useSession Composable
 *
 * Manages the state of a Planning Poker session with real-time synchronization.
 * Uses WebSocket for multi-user communication.
 */

import type { ISession, ISessionState, PokerValue } from '~/types'
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
    if (normalizedCode.length !== 6) {
      state.value = {
        ...state.value,
        error: 'The join code must be 6 characters long.',
      }
      return
    }

    if (!participantName.trim()) {
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

    send('session:join', {
      joinCode: normalizedCode,
      participantName: participantName.trim(),
      asObserver,
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
