/**
 * WebSocket Route für Planning Poker
 *
 * Handhabt alle Echtzeit-Kommunikation zwischen Clients und Server.
 * Verwendet crossws für WebSocket-Unterstützung in Nitro.
 */

import type { Peer } from 'crossws'
import type {
    ClientMessage,
    CreateSessionPayload,
    JoinSessionPayload,
    SelectVotePayload,
    ServerMessage,
    StartVotingPayload,
} from '../../app/types/websocket'
import { sessionStore } from '../utils/sessionStore'

/**
 * Sendet eine Nachricht an einen Peer
 */
function sendMessage<T>(peer: Peer, type: string, payload: T): void {
  const message: ServerMessage = {
    type: type as ServerMessage['type'],
    payload,
    timestamp: Date.now(),
  }
  peer.send(JSON.stringify(message))
}

/**
 * Sendet eine Nachricht an alle Peers in einer Session
 */
function broadcastToSession(sessionId: string, type: string, payload: unknown, excludePeer?: Peer): void {
  const connections = sessionStore.getSessionConnections(sessionId)
  if (!connections) return

  const message: ServerMessage = {
    type: type as ServerMessage['type'],
    payload,
    timestamp: Date.now(),
  }
  const messageStr = JSON.stringify(message)

  for (const [, peer] of connections) {
    if (peer !== excludePeer) {
      peer.send(messageStr)
    }
  }
}

/**
 * Behandelt eingehende WebSocket-Nachrichten
 */
function handleMessage(peer: Peer, data: string): void {
  try {
    const message = JSON.parse(data) as ClientMessage

    switch (message.type) {
      case 'session:create':
        handleCreateSession(peer, message.payload as CreateSessionPayload)
        break

      case 'session:join':
        handleJoinSession(peer, message.payload as JoinSessionPayload)
        break

      case 'session:leave':
        handleLeaveSession(peer)
        break

      case 'vote:select':
        handleSelectVote(peer, message.payload as SelectVotePayload)
        break

      case 'vote:reveal':
        handleRevealVotes(peer)
        break

      case 'vote:reset':
        handleResetVoting(peer)
        break

      case 'voting:start':
        handleStartVoting(peer, message.payload as StartVotingPayload)
        break

      case 'ping':
        sendMessage(peer, 'pong', {})
        break

      default:
        console.warn('[WebSocket] Unknown message type:', message.type)
    }
  }
  catch (error) {
    console.error('[WebSocket] Error parsing message:', error)
    sendMessage(peer, 'session:error', {
      message: 'Ungültige Nachricht',
      code: 'INVALID_MESSAGE',
    })
  }
}

/**
 * Erstellt eine neue Session
 */
function handleCreateSession(peer: Peer, payload: CreateSessionPayload): void {
  const result = sessionStore.createSession(payload.sessionName, payload.participantName, peer)

  sendMessage(peer, 'session:created', {
    session: result.session,
    joinCode: result.joinCode,
    participant: result.participant,
  })
}

/**
 * Tritt einer Session bei
 */
function handleJoinSession(peer: Peer, payload: JoinSessionPayload): void {
  const result = sessionStore.joinSession(
    payload.joinCode,
    payload.participantName,
    payload.asObserver,
    peer,
  )

  if (!result) {
    sendMessage(peer, 'session:error', {
      message: 'Session nicht gefunden. Bitte prüfe den Join-Code.',
      code: 'SESSION_NOT_FOUND',
    })
    return
  }

  // Dem beitretenden Peer bestätigen
  sendMessage(peer, 'session:joined', {
    session: result.session,
    joinCode: result.joinCode,
    participant: result.participant,
  })

  // Alle anderen Teilnehmer informieren
  broadcastToSession(result.session.id, 'participant:joined', {
    participant: result.participant,
    sessionId: result.session.id,
  }, peer)
}

/**
 * Verlässt eine Session
 */
function handleLeaveSession(peer: Peer): void {
  const result = sessionStore.leaveSession(peer)

  if (!result) {
    sendMessage(peer, 'session:left', { success: false })
    return
  }

  sendMessage(peer, 'session:left', { success: true })

  // Andere Teilnehmer informieren
  if (result.session) {
    broadcastToSession(result.sessionId, 'participant:left', {
      participantId: result.participantId,
      sessionId: result.sessionId,
    })

    // Aktualisierte Session an alle senden
    broadcastToSession(result.sessionId, 'session:updated', {
      session: result.session,
    })
  }
}

/**
 * Wählt einen Vote-Wert
 */
function handleSelectVote(peer: Peer, payload: SelectVotePayload): void {
  const result = sessionStore.selectVote(peer, payload.value)

  if (!result) {
    sendMessage(peer, 'session:error', {
      message: 'Vote konnte nicht gespeichert werden.',
      code: 'VOTE_FAILED',
    })
    return
  }

  // Allen (inkl. Absender) die aktualisierte Session senden
  const sessionId = sessionStore.getSessionIdForPeer(peer)
  if (sessionId) {
    // Wenn Karten nicht aufgedeckt, nur signalisieren dass jemand gewählt hat
    if (!result.session.cardsRevealed) {
      broadcastToSession(sessionId, 'participant:voted', {
        participantId: result.participantId,
        sessionId,
      })
    }

    // Aktualisierte Session an alle senden
    broadcastToSession(sessionId, 'session:updated', {
      session: result.session,
    })
  }
}

/**
 * Deckt die Karten auf
 */
function handleRevealVotes(peer: Peer): void {
  const session = sessionStore.revealCards(peer)

  if (!session) {
    sendMessage(peer, 'session:error', {
      message: 'Nur der Host kann die Karten aufdecken.',
      code: 'NOT_AUTHORIZED',
    })
    return
  }

  // Aktualisierte Session an alle senden
  broadcastToSession(session.id, 'session:updated', {
    session,
  })
}

/**
 * Setzt die Abstimmung zurück
 */
function handleResetVoting(peer: Peer): void {
  const session = sessionStore.resetVoting(peer)

  if (!session) {
    sendMessage(peer, 'session:error', {
      message: 'Nur der Host kann die Abstimmung zurücksetzen.',
      code: 'NOT_AUTHORIZED',
    })
    return
  }

  // Aktualisierte Session an alle senden
  broadcastToSession(session.id, 'session:updated', {
    session,
  })
}

/**
 * Startet eine neue Voting-Runde
 */
function handleStartVoting(peer: Peer, payload: StartVotingPayload): void {
  const session = sessionStore.startVoting(peer, payload.story)

  if (!session) {
    sendMessage(peer, 'session:error', {
      message: 'Nur der Host kann die Abstimmung starten.',
      code: 'NOT_AUTHORIZED',
    })
    return
  }

  // Aktualisierte Session an alle senden
  broadcastToSession(session.id, 'session:updated', {
    session,
  })
}

/**
 * WebSocket Event Handler Definition
 */
export default defineWebSocketHandler({
  open(peer) {
    console.log(`[WebSocket] Client connected: ${peer.id}`)
  },

  message(peer, message) {
    const data = typeof message === 'string' ? message : message.text()
    handleMessage(peer, data)
  },

  close(peer) {
    console.log(`[WebSocket] Client disconnected: ${peer.id}`)
    // Automatisch aus Session entfernen
    handleLeaveSession(peer)
  },

  error(peer, error) {
    console.error(`[WebSocket] Error for peer ${peer.id}:`, error)
  },
})
