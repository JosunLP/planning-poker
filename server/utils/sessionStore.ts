/**
 * Server-seitiger Session Store
 *
 * Verwaltet alle aktiven Planning Poker Sessions.
 * Singleton-Pattern für konsistenten Zustand.
 */

import type { Peer } from 'crossws'
import type { IParticipant, ISession, PokerValue } from '../../app/types/poker'

/**
 * Session mit zugehörigen WebSocket-Verbindungen
 */
interface ManagedSession {
  session: ISession
  joinCode: string
  connections: Map<string, Peer>
  lastActivity: number
}

/**
 * Generiert eine eindeutige ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Generiert einen 6-stelligen Join-Code
 */
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * SessionStore Klasse
 * Verwaltet alle Sessions server-seitig
 */
class SessionStore {
  private static instance: SessionStore
  private sessions: Map<string, ManagedSession> = new Map()
  private joinCodeIndex: Map<string, string> = new Map() // joinCode -> sessionId
  private participantToSession: Map<string, string> = new Map() // participantId -> sessionId
  private peerToParticipant: Map<Peer, string> = new Map() // peer -> participantId

  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  private constructor() {
    // Cleanup alle 30 Sekunden
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000)
  }

  /**
   * Singleton-Instanz abrufen
   */
  static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore()
    }
    return SessionStore.instance
  }

  /**
   * Erstellt eine neue Session
   */
  createSession(name: string, hostName: string, peer: Peer): { session: ISession; joinCode: string; participant: IParticipant } {
    const sessionId = generateId()
    const joinCode = this.generateUniqueJoinCode()
    const participantId = generateId()

    const participant: IParticipant = {
      id: participantId,
      name: hostName,
      selectedValue: null,
      isObserver: false,
      joinedAt: new Date(),
    }

    const session: ISession = {
      id: sessionId,
      name,
      currentStory: null,
      participants: [participant],
      status: 'waiting',
      cardsRevealed: false,
      hostId: participantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const managedSession: ManagedSession = {
      session,
      joinCode,
      connections: new Map([[participantId, peer]]),
      lastActivity: Date.now(),
    }

    this.sessions.set(sessionId, managedSession)
    this.joinCodeIndex.set(joinCode, sessionId)
    this.participantToSession.set(participantId, sessionId)
    this.peerToParticipant.set(peer, participantId)

    return { session, joinCode, participant }
  }

  /**
   * Generiert einen eindeutigen Join-Code
   */
  private generateUniqueJoinCode(): string {
    let code = generateJoinCode()
    while (this.joinCodeIndex.has(code)) {
      code = generateJoinCode()
    }
    return code
  }

  /**
   * Tritt einer Session bei
   */
  joinSession(
    joinCode: string,
    participantName: string,
    asObserver: boolean,
    peer: Peer,
  ): { session: ISession; participant: IParticipant; joinCode: string } | null {
    const sessionId = this.joinCodeIndex.get(joinCode.toUpperCase())
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    const participantId = generateId()
    const participant: IParticipant = {
      id: participantId,
      name: participantName,
      selectedValue: null,
      isObserver: asObserver,
      joinedAt: new Date(),
    }

    managed.session.participants.push(participant)
    managed.session.updatedAt = new Date()
    managed.connections.set(participantId, peer)
    managed.lastActivity = Date.now()

    this.participantToSession.set(participantId, sessionId)
    this.peerToParticipant.set(peer, participantId)

    return { session: managed.session, participant, joinCode: managed.joinCode }
  }

  /**
   * Verlässt eine Session
   */
  leaveSession(peer: Peer): { sessionId: string; participantId: string; session: ISession | null } | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    // Teilnehmer entfernen
    managed.session.participants = managed.session.participants.filter(p => p.id !== participantId)
    managed.session.updatedAt = new Date()
    managed.connections.delete(participantId)
    managed.lastActivity = Date.now()

    this.participantToSession.delete(participantId)
    this.peerToParticipant.delete(peer)

    // Session löschen wenn leer
    if (managed.session.participants.length === 0) {
      this.sessions.delete(sessionId)
      this.joinCodeIndex.delete(managed.joinCode)
      return { sessionId, participantId, session: null }
    }

    // Neuen Host wählen wenn Host gegangen ist
    if (managed.session.hostId === participantId && managed.session.participants.length > 0) {
      const newHost = managed.session.participants[0]
      if (newHost) {
        managed.session.hostId = newHost.id
      }
    }

    return { sessionId, participantId, session: managed.session }
  }

  /**
   * Wählt einen Kartenwert
   */
  selectVote(peer: Peer, value: PokerValue): { session: ISession; participantId: string } | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    const participant = managed.session.participants.find(p => p.id === participantId)
    if (!participant || participant.isObserver) return null

    participant.selectedValue = value
    managed.session.updatedAt = new Date()
    managed.lastActivity = Date.now()

    return { session: managed.session, participantId }
  }

  /**
   * Deckt alle Karten auf
   */
  revealCards(peer: Peer): ISession | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    // Nur Host darf aufdecken
    if (managed.session.hostId !== participantId) return null

    managed.session.cardsRevealed = true
    managed.session.status = 'revealed'
    managed.session.updatedAt = new Date()
    managed.lastActivity = Date.now()

    return managed.session
  }

  /**
   * Setzt die Abstimmung zurück
   */
  resetVoting(peer: Peer): ISession | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    // Nur Host darf zurücksetzen
    if (managed.session.hostId !== participantId) return null

    managed.session.cardsRevealed = false
    managed.session.status = 'waiting'
    managed.session.currentStory = null
    managed.session.participants.forEach((p) => {
      p.selectedValue = null
    })
    managed.session.updatedAt = new Date()
    managed.lastActivity = Date.now()

    return managed.session
  }

  /**
   * Startet eine neue Abstimmungsrunde
   */
  startVoting(peer: Peer, story: string): ISession | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    // Nur Host darf starten
    if (managed.session.hostId !== participantId) return null

    managed.session.currentStory = story
    managed.session.status = 'voting'
    managed.session.cardsRevealed = false
    managed.session.participants.forEach((p) => {
      p.selectedValue = null
    })
    managed.session.updatedAt = new Date()
    managed.lastActivity = Date.now()

    return managed.session
  }

  /**
   * Holt alle Verbindungen einer Session
   */
  getSessionConnections(sessionId: string): Map<string, Peer> | null {
    const managed = this.sessions.get(sessionId)
    return managed?.connections ?? null
  }

  /**
   * Holt Session-ID für einen Peer
   */
  getSessionIdForPeer(peer: Peer): string | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null
    return this.participantToSession.get(participantId) ?? null
  }

  /**
   * Bereinigt inaktive Sessions
   */
  private cleanup(): void {
    const now = Date.now()
    const maxInactivity = 60 * 60 * 1000 // 1 Stunde

    for (const [sessionId, managed] of this.sessions.entries()) {
      if (now - managed.lastActivity > maxInactivity) {
        // Session löschen
        this.joinCodeIndex.delete(managed.joinCode)
        for (const participantId of managed.connections.keys()) {
          this.participantToSession.delete(participantId)
        }
        this.sessions.delete(sessionId)
        console.log(`[SessionStore] Cleaned up inactive session: ${sessionId}`)
      }
    }
  }

  /**
   * Stoppt den Cleanup-Interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Export der Singleton-Instanz
export const sessionStore = SessionStore.getInstance()
