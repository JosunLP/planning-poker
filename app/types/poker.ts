/**
 * TypeScript Type Definitions for Planning Poker
 *
 * Central types for the entire application.
 * Follows the Interface-First approach for better type safety.
 */

/**
 * Standard Poker Card Values
 * Modified Fibonacci-based with additional options
 */
export const POKER_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '40', '100', '?', '☕'] as const

/**
 * Type for a poker card value
 */
export type PokerValue = typeof POKER_VALUES[number]

/**
 * Join-Code Constants
 */
export const JOIN_CODE_LENGTH = 6
export const JOIN_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Without confusable characters

/**
 * Checks if a value is a valid PokerValue
 *
 * @param value - Value to check
 */
export function isValidPokerValue(value: unknown): value is PokerValue {
  return typeof value === 'string' && (POKER_VALUES as readonly string[]).includes(value)
}

/**
 * Checks if a join code is validly formatted
 *
 * @param code - Code to check
 */
export function isValidJoinCode(code: string): boolean {
  if (code.length !== JOIN_CODE_LENGTH) return false
  return code.split('').every(char => JOIN_CODE_CHARS.includes(char))
}

/**
 * Formats a join code (uppercase, only allowed characters)
 *
 * @param code - Entered code
 */
export function formatJoinCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, JOIN_CODE_LENGTH)
}

/**
 * Represents a story to be estimated
 */
export interface IStory {
  /** Unique ID of the story */
  id: string
  /** Title of the story */
  title: string
  /** Description (Markdown) */
  description: string | null
  /** Already estimated? */
  estimated: boolean
  /** Estimated value (after voting) */
  estimatedValue: PokerValue | null
}

/**
 * Represents a participant in a session
 */
export interface IParticipant {
  /** Unique ID of the participant */
  id: string
  /** Display name */
  name: string
  /** Selected card value (null if not yet selected) */
  selectedValue: PokerValue | null
  /** Is the participant an observer? */
  isObserver: boolean
  /** Time of joining */
  joinedAt: Date
}

/**
 * Status of a Planning Poker Session
 */
export type SessionStatus = 'waiting' | 'voting' | 'revealed' | 'completed'

/**
 * Represents a Planning Poker Session
 */
export interface ISession {
  /** Unique session ID */
  id: string
  /** Name/title of the session */
  name: string
  /** Current story/task being estimated */
  currentStory: string | null
  /** Description of the current story (Markdown) */
  currentStoryDescription: string | null
  /** List of all participants */
  participants: IParticipant[]
  /** Current status of the session */
  status: SessionStatus
  /** Are the cards revealed? */
  cardsRevealed: boolean
  /** Session creator ID */
  hostId: string
  /** Creation time */
  createdAt: Date
  /** Last update */
  updatedAt: Date
  /** Index of the current story in the queue */
  currentStoryIndex: number
  /** Queue with prepared stories */
  storyQueue: IStory[]
}

/**
 * Result of a voting round
 */
export interface IVotingResult {
  /** Story that was estimated */
  story: string
  /** Description of the story */
  storyDescription: string | null
  /** All votes with participant ID */
  votes: Map<string, PokerValue>
  /** Average value (numeric only) */
  average: number | null
  /** Median value (numeric only) */
  median: number | null
  /** Most common value */
  mode: PokerValue | null
  /** Consensus reached? */
  hasConsensus: boolean
  /** Timestamp */
  timestamp: Date
}

/**
 * Configuration for a session
 */
export interface ISessionConfig {
  /** Available card values */
  cardValues: readonly PokerValue[]
  /** Automatically reveal when everyone has voted */
  autoReveal: boolean
  /** Timer for voting (in seconds, 0 = no timer) */
  votingTimeout: number
  /** Allow observers */
  allowObservers: boolean
}

/**
 * Event types for WebSocket communication
 */
export type SessionEventType =
  | 'participant:join'
  | 'participant:leave'
  | 'participant:vote'
  | 'session:reveal'
  | 'session:reset'
  | 'session:story:change'
  | 'session:status:change'

/**
 * Generic session event
 */
export interface ISessionEvent<T = unknown> {
  type: SessionEventType
  payload: T
  timestamp: Date
  participantId?: string
}

/**
 * State management for the session
 */
export interface ISessionState {
  session: ISession | null
  currentParticipant: IParticipant | null
  isHost: boolean
  isConnected: boolean
  error: string | null
}
