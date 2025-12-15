/**
 * SessionManager Class
 *
 * Singleton class for managing all active sessions.
 * Handles session lifecycle, cleanup, and access.
 */

import type { ISession, ISessionConfig } from '../types'
import { JOIN_CODE_CHARS, JOIN_CODE_LENGTH } from '../types'
import { Participant } from './Participant'
import { Session } from './Session'

/**
 * Configuration for session cleanup
 */
interface CleanupConfig {
  /** Interval for cleanup check in ms */
  checkInterval: number
  /** Maximum inactivity before session is deleted (ms) */
  maxInactivity: number
  /** Delete session when empty */
  deleteWhenEmpty: boolean
}

const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  checkInterval: 60_000, // Check every minute
  maxInactivity: 30 * 60_000, // 30 minutes of inactivity
  deleteWhenEmpty: true,
}

/**
 * SessionManager manages all active sessions
 *
 * @example
 * ```ts
 * const manager = SessionManager.getInstance()
 * const session = manager.createSession('Sprint Planning', 'Alice')
 * const joinCode = manager.getJoinCode(session.id)
 * ```
 */
export class SessionManager {
  private static instance: SessionManager | null = null
  private sessions: Map<string, Session> = new Map()
  private joinCodes: Map<string, string> = new Map() // joinCode -> sessionId
  private cleanupConfig: CleanupConfig
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null

  private constructor(config?: Partial<CleanupConfig>) {
    this.cleanupConfig = { ...DEFAULT_CLEANUP_CONFIG, ...config }
  }

  /**
   * Returns the singleton instance
   */
  public static getInstance(config?: Partial<CleanupConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config)
    }
    return SessionManager.instance
  }

  /**
   * Resets the instance (for tests)
   */
  public static resetInstance(): void {
    if (SessionManager.instance) {
      SessionManager.instance.stopCleanup()
      SessionManager.instance = null
    }
  }

  /**
   * Creates a new session
   *
   * @param name - Name of the session
   * @param hostName - Name of the host
   * @param config - Optional session configuration
   * @returns Object with session, host participant, and join code
   */
  public createSession(
    name: string,
    hostName: string,
    config?: Partial<ISessionConfig>
  ): { session: Session; host: Participant; joinCode: string } {
    const host = new Participant(hostName)
    const session = new Session(name, host.id, config)
    session.addParticipant(host)

    // Save session
    this.sessions.set(session.id, session)

    // Generate join code
    const joinCode = this.generateJoinCode()
    this.joinCodes.set(joinCode, session.id)

    // Start cleanup if not already active
    this.startCleanup()

    return { session, host, joinCode }
  }

  /**
   * Generates a short, readable join code
   */
  private generateJoinCode(): string {
    let code = ''
    for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
      code += JOIN_CODE_CHARS.charAt(Math.floor(Math.random() * JOIN_CODE_CHARS.length))
    }

    // Ensure code is unique
    if (this.joinCodes.has(code)) {
      return this.generateJoinCode()
    }

    return code
  }

  /**
   * Finds a session by join code
   *
   * @param joinCode - The 6-character join code
   */
  public getSessionByJoinCode(joinCode: string): Session | null {
    const normalizedCode = joinCode.toUpperCase().trim()
    const sessionId = this.joinCodes.get(normalizedCode)

    if (!sessionId) {
      return null
    }

    return this.sessions.get(sessionId) ?? null
  }

  /**
   * Finds a session by ID
   */
  public getSessionById(sessionId: string): Session | null {
    return this.sessions.get(sessionId) ?? null
  }

  /**
   * Returns the join code for a session
   */
  public getJoinCode(sessionId: string): string | null {
    for (const [code, id] of this.joinCodes.entries()) {
      if (id === sessionId) {
        return code
      }
    }
    return null
  }

  /**
   * Joins a session
   *
   * @param joinCode - The join code of the session
   * @param participantName - Name of the joining participant
   * @param asObserver - Join as observer
   * @returns Session and participant or null if not found
   */
  public joinSession(
    joinCode: string,
    participantName: string,
    asObserver = false
  ): { session: Session; participant: Participant } | null {
    const session = this.getSessionByJoinCode(joinCode)

    if (!session) {
      return null
    }

    const participant = new Participant(participantName, asObserver)
    const added = session.addParticipant(participant)

    if (!added) {
      return null
    }

    return { session, participant }
  }

  /**
   * Removes a participant from a session
   * Deletes the session if it becomes empty afterwards
   *
   * @param sessionId - ID of the session
   * @param participantId - ID of the participant
   */
  public leaveSession(sessionId: string, participantId: string): boolean {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return false
    }

    const removed = session.removeParticipant(participantId)

    if (removed && this.cleanupConfig.deleteWhenEmpty) {
      this.cleanupIfEmpty(sessionId)
    }

    return removed
  }

  /**
   * Deletes a session if it is empty
   */
  private cleanupIfEmpty(sessionId: string): void {
    const session = this.sessions.get(sessionId)

    if (session && session.participants.length === 0) {
      this.deleteSession(sessionId)
    }
  }

  /**
   * Deletes a session completely
   */
  public deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return false
    }

    // Remove join code
    for (const [code, id] of this.joinCodes.entries()) {
      if (id === sessionId) {
        this.joinCodes.delete(code)
        break
      }
    }

    // Remove session
    this.sessions.delete(sessionId)

    // Stop cleanup if no more sessions
    if (this.sessions.size === 0) {
      this.stopCleanup()
    }

    return true
  }

  /**
   * Starts the automatic cleanup process
   */
  public startCleanup(): void {
    if (this.cleanupIntervalId !== null) {
      return // Already active
    }

    this.cleanupIntervalId = setInterval(() => {
      this.performCleanup()
    }, this.cleanupConfig.checkInterval)
  }

  /**
   * Stops the automatic cleanup process
   */
  public stopCleanup(): void {
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId)
      this.cleanupIntervalId = null
    }
  }

  /**
   * Performs the cleanup
   * Removes empty and inactive sessions
   */
  private performCleanup(): void {
    const now = Date.now()

    for (const [sessionId, session] of this.sessions.entries()) {
      // Delete empty sessions
      if (this.cleanupConfig.deleteWhenEmpty && session.participants.length === 0) {
        this.deleteSession(sessionId)
        continue
      }

      // Delete inactive sessions
      const lastActivity = session.updatedAt.getTime()
      if (now - lastActivity > this.cleanupConfig.maxInactivity) {
        this.deleteSession(sessionId)
      }
    }
  }

  /**
   * Returns all active sessions
   */
  public getAllSessions(): Session[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Returns the number of active sessions
   */
  public getSessionCount(): number {
    return this.sessions.size
  }

  /**
   * Serializes all sessions
   */
  public toJSON(): { sessions: ISession[]; joinCodes: Record<string, string> } {
    const sessions = Array.from(this.sessions.values()).map(s => s.toJSON())
    const joinCodes: Record<string, string> = {}

    for (const [code, id] of this.joinCodes.entries()) {
      joinCodes[code] = id
    }

    return { sessions, joinCodes }
  }
}
