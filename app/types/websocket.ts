/**
 * WebSocket Message Types
 *
 * Defines all message types for real-time communication
 * between client and server.
 */

import type { IParticipant, ISession, PokerValue } from './poker'

/**
 * Client-to-Server Message Types
 */
export type ClientMessageType =
  | 'session:create'
  | 'session:join'
  | 'session:leave'
  | 'vote:select'
  | 'vote:reveal'
  | 'vote:reset'
  | 'voting:start'
  | 'story:add'
  | 'story:remove'
  | 'story:next'
  | 'story:update'
  | 'ping'

/**
 * Server-to-Client Message Types
 */
export type ServerMessageType =
  | 'session:created'
  | 'session:joined'
  | 'session:updated'
  | 'session:left'
  | 'session:error'
  | 'participant:joined'
  | 'participant:left'
  | 'participant:voted'
  | 'pong'

/**
 * Base structure for client messages
 */
export interface ClientMessage<T extends ClientMessageType = ClientMessageType, P = unknown> {
  type: T
  payload: P
  timestamp: number
}

/**
 * Base structure for server messages
 */
export interface ServerMessage<T extends ServerMessageType = ServerMessageType, P = unknown> {
  type: T
  payload: P
  timestamp: number
}

// ============================================
// Client Message Payloads
// ============================================

export interface CreateSessionPayload {
  sessionName: string
  participantName: string
}

export interface JoinSessionPayload {
  joinCode: string
  participantName: string
  asObserver: boolean
}

export interface LeaveSessionPayload {
  sessionId: string
}

export interface SelectVotePayload {
  sessionId: string
  value: PokerValue
}

export interface RevealVotesPayload {
  sessionId: string
}

export interface ResetVotingPayload {
  sessionId: string
}

export interface StartVotingPayload {
  sessionId: string
  story: string
  description?: string
}

export interface AddStoryPayload {
  sessionId: string
  title: string
  description?: string
}

export interface RemoveStoryPayload {
  sessionId: string
  storyId: string
}

export interface UpdateStoryPayload {
  sessionId: string
  storyId: string
  title: string
  description?: string
}

export interface NextStoryPayload {
  sessionId: string
}

// ============================================
// Server Message Payloads
// ============================================

export interface SessionCreatedPayload {
  session: ISession
  joinCode: string
  participant: IParticipant
}

export interface SessionJoinedPayload {
  session: ISession
  joinCode: string
  participant: IParticipant
}

export interface SessionUpdatedPayload {
  session: ISession
}

export interface SessionLeftPayload {
  success: boolean
}

export interface SessionErrorPayload {
  message: string
  code: string
}

export interface ParticipantJoinedPayload {
  participant: IParticipant
  sessionId: string
}

export interface ParticipantLeftPayload {
  participantId: string
  sessionId: string
}

export interface ParticipantVotedPayload {
  participantId: string
  sessionId: string
  /** Only visible when revealed or for own votes */
  value?: PokerValue
}

// ============================================
// Type Guards
// ============================================

/**
 * Checks if a message comes from the client
 */
export function isClientMessage(msg: unknown): msg is ClientMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    'payload' in msg &&
    'timestamp' in msg
  )
}

/**
 * Checks if a message comes from the server
 */
export function isServerMessage(msg: unknown): msg is ServerMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    'payload' in msg &&
    'timestamp' in msg
  )
}
