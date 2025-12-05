/**
 * WebSocket Route for Planning Poker
 *
 * Handles all real-time communication between clients and server.
 * Uses crossws for WebSocket support in Nitro.
 */

import type { Peer } from 'crossws'
import type {
    AddStoryPayload,
    ClientMessage,
    CreateSessionPayload,
    JoinSessionPayload,
    NextStoryPayload,
    RemoveStoryPayload,
    SelectVotePayload,
    ServerMessage,
    StartVotingPayload,
    UpdateStoryPayload,
} from '../../app/types/websocket'
import { sessionStore } from '../utils/sessionStore'

/**
 * Sends a message to a peer
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
 * Sends a message to all peers in a session
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
 * Handles incoming WebSocket messages
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

      case 'story:add':
        handleAddStory(peer, message.payload as AddStoryPayload)
        break

      case 'story:remove':
        handleRemoveStory(peer, message.payload as RemoveStoryPayload)
        break

      case 'story:update':
        handleUpdateStory(peer, message.payload as UpdateStoryPayload)
        break

      case 'story:next':
        handleNextStory(peer, message.payload as NextStoryPayload)
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
      message: 'Invalid message',
      code: 'INVALID_MESSAGE',
    })
  }
}

/**
 * Creates a new session
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
 * Joins a session
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
      message: 'Session not found. Please check the join code.',
      code: 'SESSION_NOT_FOUND',
    })
    return
  }

  // Confirm to the joining peer
  sendMessage(peer, 'session:joined', {
    session: result.session,
    joinCode: result.joinCode,
    participant: result.participant,
  })

  // Notify all other participants
  broadcastToSession(result.session.id, 'participant:joined', {
    participant: result.participant,
    sessionId: result.session.id,
  }, peer)
}

/**
 * Leaves a session
 */
function handleLeaveSession(peer: Peer): void {
  const result = sessionStore.leaveSession(peer)

  if (!result) {
    sendMessage(peer, 'session:left', { success: false })
    return
  }

  sendMessage(peer, 'session:left', { success: true })

  // Notify other participants
  if (result.session) {
    broadcastToSession(result.sessionId, 'participant:left', {
      participantId: result.participantId,
      sessionId: result.sessionId,
    })

    // Send updated session to everyone
    broadcastToSession(result.sessionId, 'session:updated', {
      session: result.session,
    })
  }
}

/**
 * Selects a vote value
 */
function handleSelectVote(peer: Peer, payload: SelectVotePayload): void {
  const result = sessionStore.selectVote(peer, payload.value)

  if (!result) {
    sendMessage(peer, 'session:error', {
      message: 'Vote could not be saved.',
      code: 'VOTE_FAILED',
    })
    return
  }

  // Send updated session to everyone (including sender)
  const sessionId = sessionStore.getSessionIdForPeer(peer)
  if (sessionId) {
    // If cards are not revealed, only signal that someone has voted
    if (!result.session.cardsRevealed) {
      broadcastToSession(sessionId, 'participant:voted', {
        participantId: result.participantId,
        sessionId,
      })
    }

    // Send updated session to everyone
    broadcastToSession(sessionId, 'session:updated', {
      session: result.session,
    })
  }
}

/**
 * Reveals the cards
 */
function handleRevealVotes(peer: Peer): void {
  const session = sessionStore.revealCards(peer)

  if (!session) {
    sendMessage(peer, 'session:error', {
      message: 'Only the host can reveal the cards.',
      code: 'NOT_AUTHORIZED',
    })
    return
  }

  // Send updated session to everyone
  broadcastToSession(session.id, 'session:updated', {
    session,
  })
}

/**
 * Resets the voting
 */
function handleResetVoting(peer: Peer): void {
  const session = sessionStore.resetVoting(peer)

  if (!session) {
    sendMessage(peer, 'session:error', {
      message: 'Only the host can reset the voting.',
      code: 'NOT_AUTHORIZED',
    })
    return
  }

  // Send updated session to everyone
  broadcastToSession(session.id, 'session:updated', {
    session,
  })
}

/**
 * Starts a new voting round
 */
function handleStartVoting(peer: Peer, payload: StartVotingPayload): void {
  const session = sessionStore.startVoting(peer, payload.story, payload.description)

  if (!session) {
    sendMessage(peer, 'session:error', {
      message: 'Only the host can start voting.',
      code: 'NOT_AUTHORIZED',
    })
    return
  }

  // Send updated session to everyone
  broadcastToSession(session.id, 'session:updated', {
    session,
  })
}

/**
 * Adds a story to the queue
 */
function handleAddStory(peer: Peer, payload: AddStoryPayload): void {
  const session = sessionStore.addStory(peer, payload.title, payload.description)

  if (!session) {
    sendMessage(peer, 'session:error', {
      message: 'Only the host can add stories.',
      code: 'NOT_AUTHORIZED',
    })
    return
  }

  broadcastToSession(session.id, 'session:updated', { session })
}

/**
 * Removes a story from the queue
 */
function handleRemoveStory(peer: Peer, payload: RemoveStoryPayload): void {
  const session = sessionStore.removeStory(peer, payload.storyId)

  if (!session) {
    sendMessage(peer, 'session:error', {
      message: 'Only the host can remove stories.',
      code: 'NOT_AUTHORIZED',
    })
    return
  }

  broadcastToSession(session.id, 'session:updated', { session })
}

/**
 * Updates a story
 */
function handleUpdateStory(peer: Peer, payload: UpdateStoryPayload): void {
  const session = sessionStore.updateStory(peer, payload.storyId, payload.title, payload.description)

  if (!session) {
    sendMessage(peer, 'session:error', {
      message: 'Only the host can edit stories.',
      code: 'NOT_AUTHORIZED',
    })
    return
  }

  broadcastToSession(session.id, 'session:updated', { session })
}

/**
 * Starts the next story
 */
function handleNextStory(peer: Peer, _payload: NextStoryPayload): void {
  const session = sessionStore.nextStory(peer)

  if (!session) {
    sendMessage(peer, 'session:error', {
      message: 'No more stories available or not authorized.',
      code: 'NOT_AUTHORIZED',
    })
    return
  }

  broadcastToSession(session.id, 'session:updated', { session })
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
    // Automatically remove from session
    handleLeaveSession(peer)
  },

  error(peer, error) {
    console.error(`[WebSocket] Error for peer ${peer.id}:`, error)
  },
})
