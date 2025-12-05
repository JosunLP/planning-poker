/**
 * useSession Composable
 *
 * Verwaltet den Zustand einer Planning Poker Session mit Echtzeit-Synchronisation.
 * Nutzt WebSocket für Multi-User-Kommunikation.
 */

import type { ISessionState, PokerValue } from '~/types'
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
 * Erweiterter State mit Join-Code und Verbindungsstatus
 */
interface ExtendedSessionState extends ISessionState {
  joinCode: string | null
}

/**
 * Composable für Session-Management mit WebSocket
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
   * Reaktiver Zustand der Session
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
   * WebSocket Event Handler registrieren
   */
  if (import.meta.client) {
    // Session erstellt
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

    // Session beigetreten
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

    // Session aktualisiert
    on<SessionUpdatedPayload>('session:updated', (payload) => {
      if (!state.value.currentParticipant) return

      // Aktuellen Teilnehmer aus der aktualisierten Liste holen
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

    // Teilnehmer beigetreten (andere)
    on<ParticipantJoinedPayload>('participant:joined', (payload) => {
      if (!state.value.session) return

      // Prüfen ob Teilnehmer bereits existiert
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

    // Teilnehmer verlassen
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

    // Session verlassen bestätigt
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

    // Fehler
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
   * Join-Code der aktuellen Session
   */
  const joinCode = computed(() => state.value.joinCode)

  /**
   * Aktuelle Session
   */
  const session = computed(() => state.value.session)

  /**
   * Aktueller Teilnehmer
   */
  const currentParticipant = computed(() => state.value.currentParticipant)

  /**
   * Ist der aktuelle Nutzer der Host?
   */
  const isHost = computed(() => state.value.isHost)

  /**
   * Alle Teilnehmer die abstimmen können
   */
  const voters = computed(() =>
    state.value.session?.participants.filter(p => !p.isObserver) ?? []
  )

  /**
   * Alle Beobachter
   */
  const observers = computed(() =>
    state.value.session?.participants.filter(p => p.isObserver) ?? []
  )

  /**
   * Haben alle Teilnehmer gewählt?
   */
  const allVotesIn = computed(() => {
    if (!voters.value.length) return false
    return voters.value.every(p => p.selectedValue !== null)
  })

  /**
   * Anzahl der abgegebenen Stimmen
   */
  const votesCount = computed(() =>
    voters.value.filter(p => p.selectedValue !== null).length
  )

  /**
   * Fehler-State
   */
  const error = computed(() => state.value.error)

  // ============================================
  // Actions
  // ============================================

  /**
   * Erstellt eine neue Session
   *
   * @param sessionName - Name der Session
   * @param participantName - Name des Hosts
   */
  function createSession(sessionName: string, participantName: string): void {
    // Sicherstellen dass WebSocket verbunden ist
    if (connectionStatus.value !== 'connected') {
      connect()
    }

    send('session:create', {
      sessionName,
      participantName,
    })
  }

  /**
   * Tritt einer bestehenden Session bei
   *
   * @param code - Join-Code der Session
   * @param participantName - Name des Teilnehmers
   * @param asObserver - Als Beobachter beitreten
   */
  function joinSession(code: string, participantName: string, asObserver = false): void {
    // Sicherstellen dass WebSocket verbunden ist
    if (connectionStatus.value !== 'connected') {
      connect()
    }

    send('session:join', {
      joinCode: code.toUpperCase().trim(),
      participantName,
      asObserver,
    })
  }

  /**
   * Wählt eine Karte aus
   *
   * @param value - Der Kartenwert
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
   * Deckt alle Karten auf (nur Host)
   */
  function revealCards(): void {
    if (!state.value.session || !state.value.isHost) return

    send('vote:reveal', {
      sessionId: state.value.session.id,
    })
  }

  /**
   * Startet eine neue Abstimmungsrunde (nur Host)
   *
   * @param story - Die zu schätzende Story
   */
  function startVoting(story: string): void {
    if (!state.value.session || !state.value.isHost) return

    send('voting:start', {
      sessionId: state.value.session.id,
      story,
    })
  }

  /**
   * Setzt die aktuelle Runde zurück (nur Host)
   */
  function resetVoting(): void {
    if (!state.value.session || !state.value.isHost) return

    send('vote:reset', {
      sessionId: state.value.session.id,
    })
  }

  /**
   * Verlässt die aktuelle Session
   */
  function leaveSession(): void {
    if (!state.value.session) return

    send('session:leave', {
      sessionId: state.value.session.id,
    })
  }

  /**
   * Fehler zurücksetzen
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
    resetVoting,
    leaveSession,
    clearError,
  }
}
