/**
 * Session Class
 *
 * Manages a Planning Poker session with all participants.
 * Contains the core logic for voting management.
 */

import type { ISession, ISessionConfig, IStory, IVotingResult, PokerValue, SessionStatus } from '../types'
import { POKER_VALUES } from '../types'
import { Participant } from './Participant'

/**
 * Default configuration for a session
 */
const DEFAULT_CONFIG: ISessionConfig = {
  cardValues: POKER_VALUES,
  autoReveal: true,
  votingTimeout: 0,
  allowObservers: true,
}

/**
 * Class for managing a Planning Poker session
 *
 * @example
 * ```ts
 * const session = new Session('Sprint 42 Planning', hostId)
 * session.addParticipant(new Participant('Alice'))
 * session.startVoting('User Story #123')
 * ```
 */
export class Session implements ISession {
  public readonly id: string
  public name: string
  public currentStory: string | null
  public currentStoryDescription: string | null
  public participants: Participant[]
  public status: SessionStatus
  public cardsRevealed: boolean
  public readonly hostId: string
  public readonly createdAt: Date
  public updatedAt: Date
  public storyQueue: IStory[]
  public currentStoryIndex: number

  private config: ISessionConfig
  private votingHistory: IVotingResult[]

  /**
   * Creates a new session
   *
   * @param name - Name of the session
   * @param hostId - ID of the session creator
   * @param config - Optional: Custom configuration
   */
  constructor(name: string, hostId: string, config?: Partial<ISessionConfig>) {
    this.id = crypto.randomUUID()
    this.name = name.trim()
    this.hostId = hostId
    this.currentStory = null
    this.currentStoryDescription = null
    this.participants = []
    this.status = 'waiting'
    this.cardsRevealed = false
    this.createdAt = new Date()
    this.updatedAt = new Date()
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.votingHistory = []
    this.storyQueue = []
    this.currentStoryIndex = -1
  }

  /**
   * Adds a participant to the session
   *
   * @param participant - The new participant
   * @returns true if successfully added
   */
  public addParticipant(participant: Participant): boolean {
    if (this.getParticipantById(participant.id)) {
      return false
    }

    if (participant.isObserver && !this.config.allowObservers) {
      return false
    }

    this.participants.push(participant)
    this.touch()
    return true
  }

  /**
   * Removes a participant from the session
   *
   * @param participantId - ID of the participant to remove
   */
  public removeParticipant(participantId: string): boolean {
    const index = this.participants.findIndex(p => p.id === participantId)
    if (index === -1) {
      return false
    }

    this.participants.splice(index, 1)
    this.touch()
    return true
  }

  /**
   * Finds a participant by ID
   */
  public getParticipantById(id: string): Participant | undefined {
    return this.participants.find(p => p.id === id)
  }

  /**
   * Starts a new voting round
   *
   * @param story - The story to estimate
   * @param description - Optional: Description of the story
   */
  public startVoting(story: string, description?: string): void {
    this.currentStory = story.trim()
    this.currentStoryDescription = description?.trim() || null
    this.status = 'voting'
    this.cardsRevealed = false

    // Reset all votes
    this.participants.forEach(p => p.resetSelection())
    this.touch()
  }

  /**
   * Reveals all cards
   */
  public revealCards(): IVotingResult | null {
    if (this.status !== 'voting' || !this.currentStory) {
      return null
    }

    this.cardsRevealed = true
    this.status = 'revealed'

    const result = this.calculateResult()
    this.votingHistory.push(result)
    this.touch()

    return result
  }

  /**
   * Resets the round for a new vote
   */
  public resetVoting(): void {
    this.cardsRevealed = false
    this.status = 'voting'
    this.participants.forEach(p => p.resetSelection())
    this.touch()
  }

  /**
   * Checks if all participants have voted
   */
  public allVotesIn(): boolean {
    const voters = this.getVoters()
    return voters.length > 0 && voters.every(p => p.hasVoted())
  }

  /**
   * Returns all voting participants
   */
  public getVoters(): Participant[] {
    return this.participants.filter(p => !p.isObserver)
  }

  /**
   * Returns all observers
   */
  public getObservers(): Participant[] {
    return this.participants.filter(p => p.isObserver)
  }

  /**
   * Calculates the statistics of the current vote
   */
  private calculateResult(): IVotingResult {
    const votes = new Map<string, PokerValue>()
    const numericValues: number[] = []

    this.getVoters().forEach((p) => {
      if (p.selectedValue !== null) {
        votes.set(p.id, p.selectedValue)

        // Only numeric values for statistics
        const numValue = Number.parseFloat(p.selectedValue)
        if (!Number.isNaN(numValue)) {
          numericValues.push(numValue)
        }
      }
    })

    // Calculate average
    const average = numericValues.length > 0
      ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
      : null

    // Calculate median
    const median = this.calculateMedian(numericValues)

    // Calculate mode (most frequent value)
    const mode = this.calculateMode([...votes.values()])

    // Check consensus (all same)
    const uniqueVotes = new Set(votes.values())
    const hasConsensus = uniqueVotes.size === 1 && votes.size > 1

    return {
      story: this.currentStory!,
      storyDescription: this.currentStoryDescription,
      votes,
      average,
      median,
      mode,
      hasConsensus,
      timestamp: new Date(),
    }
  }

  /**
   * Calculates the median of a number list
   */
  private calculateMedian(values: number[]): number | null {
    if (values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)

    if (sorted.length % 2 !== 0) {
      return sorted[mid] ?? null
    }

    const left = sorted[mid - 1]
    const right = sorted[mid]
    if (left === undefined || right === undefined) return null
    return (left + right) / 2
  }

  /**
   * Calculates the mode (most frequent value)
   */
  private calculateMode(values: PokerValue[]): PokerValue | null {
    if (values.length === 0) return null

    const frequency = new Map<PokerValue, number>()
    let maxFreq = 0
    let mode: PokerValue | null = null

    values.forEach((value) => {
      const freq = (frequency.get(value) || 0) + 1
      frequency.set(value, freq)

      if (freq > maxFreq) {
        maxFreq = freq
        mode = value
      }
    })

    return mode
  }

  /**
   * Updates the timestamp
   */
  private touch(): void {
    this.updatedAt = new Date()
  }

  /**
   * Returns the available card values
   */
  public getCardValues(): readonly PokerValue[] {
    return this.config.cardValues
  }

  /**
   * Returns the voting history
   */
  public getVotingHistory(): readonly IVotingResult[] {
    return this.votingHistory
  }

  /**
   * Serializes the session for API/Storage
   */
  public toJSON(): ISession {
    return {
      id: this.id,
      name: this.name,
      currentStory: this.currentStory,
      currentStoryDescription: this.currentStoryDescription,
      participants: this.participants.map(p => p.toJSON()),
      status: this.status,
      cardsRevealed: this.cardsRevealed,
      hostId: this.hostId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      storyQueue: this.storyQueue,
      currentStoryIndex: this.currentStoryIndex,
    }
  }

  /**
   * Creates a session from JSON data
   */
  public static fromJSON(data: ISession, config?: Partial<ISessionConfig>): Session {
    const session = new Session(data.name, data.hostId, config)
    Object.assign(session, {
      id: data.id,
      currentStory: data.currentStory,
      currentStoryDescription: data.currentStoryDescription,
      status: data.status,
      cardsRevealed: data.cardsRevealed,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      storyQueue: data.storyQueue ?? [],
      currentStoryIndex: data.currentStoryIndex ?? -1,
    })

    session.participants = data.participants.map(p => Participant.fromJSON(p))
    return session
  }
}
