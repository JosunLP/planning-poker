/**
 * SessionManager Klasse
 *
 * Singleton-Klasse zur Verwaltung aller aktiven Sessions.
 * Kümmert sich um Session-Lifecycle, Cleanup und Zugriff.
 */

import type { ISession, ISessionConfig } from '~/types'
import { Participant } from './Participant'
import { Session } from './Session'

/**
 * Konfiguration für Session-Cleanup
 */
interface CleanupConfig {
  /** Intervall für Cleanup-Prüfung in ms */
  checkInterval: number
  /** Maximale Inaktivität bevor Session gelöscht wird (ms) */
  maxInactivity: number
  /** Session löschen wenn leer */
  deleteWhenEmpty: boolean
}

const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  checkInterval: 60_000, // Jede Minute prüfen
  maxInactivity: 30 * 60_000, // 30 Minuten Inaktivität
  deleteWhenEmpty: true,
}

/**
 * SessionManager verwaltet alle aktiven Sessions
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
   * Gibt die Singleton-Instanz zurück
   */
  public static getInstance(config?: Partial<CleanupConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config)
    }
    return SessionManager.instance
  }

  /**
   * Setzt die Instanz zurück (für Tests)
   */
  public static resetInstance(): void {
    if (SessionManager.instance) {
      SessionManager.instance.stopCleanup()
      SessionManager.instance = null
    }
  }

  /**
   * Erstellt eine neue Session
   *
   * @param name - Name der Session
   * @param hostName - Name des Hosts
   * @param config - Optionale Session-Konfiguration
   * @returns Objekt mit Session, Host-Teilnehmer und Join-Code
   */
  public createSession(
    name: string,
    hostName: string,
    config?: Partial<ISessionConfig>
  ): { session: Session; host: Participant; joinCode: string } {
    const host = new Participant(hostName)
    const session = new Session(name, host.id, config)
    session.addParticipant(host)

    // Session speichern
    this.sessions.set(session.id, session)

    // Join-Code generieren
    const joinCode = this.generateJoinCode()
    this.joinCodes.set(joinCode, session.id)

    // Cleanup starten falls noch nicht aktiv
    this.startCleanup()

    return { session, host, joinCode }
  }

  /**
   * Generiert einen kurzen, lesbaren Join-Code
   */
  private generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Ohne verwechselbare Zeichen
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Sicherstellen, dass Code einzigartig ist
    if (this.joinCodes.has(code)) {
      return this.generateJoinCode()
    }

    return code
  }

  /**
   * Findet eine Session anhand des Join-Codes
   *
   * @param joinCode - Der 6-stellige Join-Code
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
   * Findet eine Session anhand der ID
   */
  public getSessionById(sessionId: string): Session | null {
    return this.sessions.get(sessionId) ?? null
  }

  /**
   * Gibt den Join-Code für eine Session zurück
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
   * Tritt einer Session bei
   *
   * @param joinCode - Der Join-Code der Session
   * @param participantName - Name des beitretenden Teilnehmers
   * @param asObserver - Als Beobachter beitreten
   * @returns Session und Teilnehmer oder null wenn nicht gefunden
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
   * Entfernt einen Teilnehmer aus einer Session
   * Löscht die Session wenn sie danach leer ist
   *
   * @param sessionId - ID der Session
   * @param participantId - ID des Teilnehmers
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
   * Löscht eine Session wenn sie leer ist
   */
  private cleanupIfEmpty(sessionId: string): void {
    const session = this.sessions.get(sessionId)

    if (session && session.participants.length === 0) {
      this.deleteSession(sessionId)
    }
  }

  /**
   * Löscht eine Session komplett
   */
  public deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return false
    }

    // Join-Code entfernen
    for (const [code, id] of this.joinCodes.entries()) {
      if (id === sessionId) {
        this.joinCodes.delete(code)
        break
      }
    }

    // Session entfernen
    this.sessions.delete(sessionId)

    // Cleanup stoppen wenn keine Sessions mehr
    if (this.sessions.size === 0) {
      this.stopCleanup()
    }

    return true
  }

  /**
   * Startet den automatischen Cleanup-Prozess
   */
  public startCleanup(): void {
    if (this.cleanupIntervalId !== null) {
      return // Bereits aktiv
    }

    this.cleanupIntervalId = setInterval(() => {
      this.performCleanup()
    }, this.cleanupConfig.checkInterval)
  }

  /**
   * Stoppt den automatischen Cleanup-Prozess
   */
  public stopCleanup(): void {
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId)
      this.cleanupIntervalId = null
    }
  }

  /**
   * Führt den Cleanup durch
   * Entfernt leere und inaktive Sessions
   */
  private performCleanup(): void {
    const now = Date.now()

    for (const [sessionId, session] of this.sessions.entries()) {
      // Leere Sessions löschen
      if (this.cleanupConfig.deleteWhenEmpty && session.participants.length === 0) {
        this.deleteSession(sessionId)
        continue
      }

      // Inaktive Sessions löschen
      const lastActivity = session.updatedAt.getTime()
      if (now - lastActivity > this.cleanupConfig.maxInactivity) {
        this.deleteSession(sessionId)
      }
    }
  }

  /**
   * Gibt alle aktiven Sessions zurück
   */
  public getAllSessions(): Session[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Gibt die Anzahl aktiver Sessions zurück
   */
  public getSessionCount(): number {
    return this.sessions.size
  }

  /**
   * Serialisiert alle Sessions
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
