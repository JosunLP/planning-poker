/**
 * WebSocket Nachrichtentypen
 *
 * Definiert alle Nachrichtentypen für die Echtzeit-Kommunikation
 * zwischen Client und Server.
 */

import type { IParticipant, ISession, PokerValue } from './poker'

/**
 * Client-zu-Server Nachrichtentypen
 */
export type ClientMessageType =
  | 'session:create'
  | 'session:join'
  | 'session:leave'
  | 'vote:select'
  | 'vote:reveal'
  | 'vote:reset'
  | 'voting:start'
  | 'ping'

/**
 * Server-zu-Client Nachrichtentypen
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
 * Basis-Struktur für Client-Nachrichten
 */
export interface ClientMessage<T extends ClientMessageType = ClientMessageType, P = unknown> {
  type: T
  payload: P
  timestamp: number
}

/**
 * Basis-Struktur für Server-Nachrichten
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
  /** Nur sichtbar wenn revealed oder für eigene Votes */
  value?: PokerValue
}

// ============================================
// Type Guards
// ============================================

/**
 * Prüft ob eine Nachricht vom Client kommt
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
 * Prüft ob eine Nachricht vom Server kommt
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
