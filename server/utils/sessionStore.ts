/**
 * Server-side Session Store
 *
 * Manages all active Planning Poker sessions.
 * Singleton pattern for consistent state.
 */

import type { Peer } from 'crossws'
import type { IParticipant, ISession, IStory, PokerValue } from '../../app/types/poker'
import { JOIN_CODE_CHARS, JOIN_CODE_LENGTH } from '../../app/types/poker'

/**
 * Session with associated WebSocket connections
 */
interface ManagedSession {
  session: ISession
  joinCode: string
  connections: Map<string, Peer>
  lastActivity: number
}

/**
 * Generates a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Generates a join code based on defined constants
 */
function generateJoinCode(): string {
  let code = ''
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_CHARS.charAt(Math.floor(Math.random() * JOIN_CODE_CHARS.length))
  }
  return code
}

/**
 * SessionStore Class
 * Manages all sessions server-side
 */
class SessionStore {
  private static instance: SessionStore
  private sessions: Map<string, ManagedSession> = new Map()
  private joinCodeIndex: Map<string, string> = new Map() // joinCode -> sessionId
  private participantToSession: Map<string, string> = new Map() // participantId -> sessionId
  private peerToParticipant: Map<Peer, string> = new Map() // peer -> participantId

  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  private constructor() {
    // Cleanup every 30 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000)
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore()
    }
    return SessionStore.instance
  }

  /**
   * Creates a new session
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
      currentStoryDescription: null,
      participants: [participant],
      status: 'waiting',
      cardsRevealed: false,
      hostId: participantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentStoryIndex: -1,
      storyQueue: [],
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
   * Generates a unique join code
   */
  private generateUniqueJoinCode(): string {
    let code = generateJoinCode()
    while (this.joinCodeIndex.has(code)) {
      code = generateJoinCode()
    }
    return code
  }

  /**
   * Joins a session
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
   * Leaves a session
   */
  leaveSession(peer: Peer): { sessionId: string; participantId: string; session: ISession | null } | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    // Remove participant
    managed.session.participants = managed.session.participants.filter(p => p.id !== participantId)
    managed.session.updatedAt = new Date()
    managed.connections.delete(participantId)
    managed.lastActivity = Date.now()

    this.participantToSession.delete(participantId)
    this.peerToParticipant.delete(peer)

    // Delete session if empty
    if (managed.session.participants.length === 0) {
      this.sessions.delete(sessionId)
      this.joinCodeIndex.delete(managed.joinCode)
      return { sessionId, participantId, session: null }
    }

    // Choose new host if host has left
    if (managed.session.hostId === participantId && managed.session.participants.length > 0) {
      const newHost = managed.session.participants[0]
      if (newHost) {
        managed.session.hostId = newHost.id
      }
    }

    return { sessionId, participantId, session: managed.session }
  }

  /**
   * Selects a card value
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
   * Reveals all cards
   */
  revealCards(peer: Peer): ISession | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    // Only host can reveal
    if (managed.session.hostId !== participantId) return null

    managed.session.cardsRevealed = true
    managed.session.status = 'revealed'
    managed.session.updatedAt = new Date()
    managed.lastActivity = Date.now()

    return managed.session
  }

  /**
   * Resets the voting
   */
  resetVoting(peer: Peer): ISession | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    // Only host can reset
    if (managed.session.hostId !== participantId) return null

    managed.session.cardsRevealed = false
    managed.session.status = 'waiting'
    managed.session.currentStory = null
    managed.session.currentStoryDescription = null
    managed.session.participants.forEach((p) => {
      p.selectedValue = null
    })
    managed.session.updatedAt = new Date()
    managed.lastActivity = Date.now()

    return managed.session
  }

  /**
   * Starts a new voting round
   */
  startVoting(peer: Peer, story: string, description?: string): ISession | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    // Only host can start
    if (managed.session.hostId !== participantId) return null

    managed.session.currentStory = story
    managed.session.currentStoryDescription = description || null
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
   * Adds a story to the queue
   */
  addStory(peer: Peer, title: string, description?: string): ISession | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    if (managed.session.hostId !== participantId) return null

    const story: IStory = {
      id: generateId(),
      title: title.trim(),
      description: description?.trim() || null,
      estimated: false,
      estimatedValue: null,
    }

    managed.session.storyQueue.push(story)
    managed.session.updatedAt = new Date()
    managed.lastActivity = Date.now()

    return managed.session
  }

  /**
   * Removes a story from the queue
   */
  removeStory(peer: Peer, storyId: string): ISession | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    if (managed.session.hostId !== participantId) return null

    const storyIndex = managed.session.storyQueue.findIndex(s => s.id === storyId)
    if (storyIndex === -1) return null

    managed.session.storyQueue.splice(storyIndex, 1)

    // Adjust currentStoryIndex if needed
    if (storyIndex < managed.session.currentStoryIndex) {
      managed.session.currentStoryIndex--
    } else if (storyIndex === managed.session.currentStoryIndex) {
      managed.session.currentStoryIndex = -1
      managed.session.currentStory = null
      managed.session.currentStoryDescription = null
      managed.session.status = 'waiting'
    }

    managed.session.updatedAt = new Date()
    managed.lastActivity = Date.now()

    return managed.session
  }

  /**
   * Updates a story
   */
  updateStory(peer: Peer, storyId: string, title: string, description?: string): ISession | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    if (managed.session.hostId !== participantId) return null

    const story = managed.session.storyQueue.find(s => s.id === storyId)
    if (!story) return null

    story.title = title.trim()
    story.description = description?.trim() || null

    // Update current story if it's the one being edited
    if (managed.session.storyQueue[managed.session.currentStoryIndex]?.id === storyId) {
      managed.session.currentStory = story.title
      managed.session.currentStoryDescription = story.description
    }

    managed.session.updatedAt = new Date()
    managed.lastActivity = Date.now()

    return managed.session
  }

  /**
   * Starts the next story in the queue
   */
  nextStory(peer: Peer): ISession | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null

    const sessionId = this.participantToSession.get(participantId)
    if (!sessionId) return null

    const managed = this.sessions.get(sessionId)
    if (!managed) return null

    if (managed.session.hostId !== participantId) return null

    // Mark current story as estimated if revealed
    if (managed.session.currentStoryIndex >= 0 && managed.session.cardsRevealed) {
      const currentStory = managed.session.storyQueue[managed.session.currentStoryIndex]
      if (currentStory) {
        currentStory.estimated = true
        // Calculate mode as estimated value
        const votes = managed.session.participants
          .filter(p => !p.isObserver && p.selectedValue !== null)
          .map(p => p.selectedValue!)
        if (votes.length > 0) {
          const frequency = new Map<PokerValue, number>()
          let maxFreq = 0
          let mode: PokerValue | null = null
          votes.forEach((value) => {
            const freq = (frequency.get(value) || 0) + 1
            frequency.set(value, freq)
            if (freq > maxFreq) {
              maxFreq = freq
              mode = value
            }
          })
          currentStory.estimatedValue = mode
        }
      }
    }

    // Find next unestimated story
    let nextIndex = managed.session.currentStoryIndex + 1
    while (nextIndex < managed.session.storyQueue.length) {
      if (!managed.session.storyQueue[nextIndex]?.estimated) {
        break
      }
      nextIndex++
    }

    if (nextIndex >= managed.session.storyQueue.length) {
      // No more stories
      return null
    }

    const nextStory = managed.session.storyQueue[nextIndex]
    if (!nextStory) return null

    managed.session.currentStoryIndex = nextIndex
    managed.session.currentStory = nextStory.title
    managed.session.currentStoryDescription = nextStory.description
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
   * Gets all connections of a session
   */
  getSessionConnections(sessionId: string): Map<string, Peer> | null {
    const managed = this.sessions.get(sessionId)
    return managed?.connections ?? null
  }

  /**
   * Gets session ID for a peer
   */
  getSessionIdForPeer(peer: Peer): string | null {
    const participantId = this.peerToParticipant.get(peer)
    if (!participantId) return null
    return this.participantToSession.get(participantId) ?? null
  }

  /**
   * Cleans up inactive sessions
   */
  private cleanup(): void {
    const now = Date.now()
    const maxInactivity = 60 * 60 * 1000 // 1 hour

    for (const [sessionId, managed] of this.sessions.entries()) {
      if (now - managed.lastActivity > maxInactivity) {
        // Delete session
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
   * Stops the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Export of the singleton instance
export const sessionStore = SessionStore.getInstance()
