/**
 * Session Klasse
 *
 * Verwaltet eine Planning Poker Session mit allen Teilnehmern.
 * Enthält die Kernlogik für das Abstimmungsmanagement.
 */

import type { ISession, ISessionConfig, IVotingResult, PokerValue, SessionStatus } from '~/types'
import { POKER_VALUES } from '~/types'
import { Participant } from './Participant'

/**
 * Standard-Konfiguration für eine Session
 */
const DEFAULT_CONFIG: ISessionConfig = {
  cardValues: POKER_VALUES,
  autoReveal: true,
  votingTimeout: 0,
  allowObservers: true,
}

/**
 * Klasse zur Verwaltung einer Planning Poker Session
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
  public participants: Participant[]
  public status: SessionStatus
  public cardsRevealed: boolean
  public readonly hostId: string
  public readonly createdAt: Date
  public updatedAt: Date

  private config: ISessionConfig
  private votingHistory: IVotingResult[]

  /**
   * Erstellt eine neue Session
   *
   * @param name - Name der Session
   * @param hostId - ID des Session-Erstellers
   * @param config - Optional: Benutzerdefinierte Konfiguration
   */
  constructor(name: string, hostId: string, config?: Partial<ISessionConfig>) {
    this.id = crypto.randomUUID()
    this.name = name.trim()
    this.hostId = hostId
    this.currentStory = null
    this.participants = []
    this.status = 'waiting'
    this.cardsRevealed = false
    this.createdAt = new Date()
    this.updatedAt = new Date()
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.votingHistory = []
  }

  /**
   * Fügt einen Teilnehmer zur Session hinzu
   *
   * @param participant - Der neue Teilnehmer
   * @returns true wenn erfolgreich hinzugefügt
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
   * Entfernt einen Teilnehmer aus der Session
   *
   * @param participantId - ID des zu entfernenden Teilnehmers
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
   * Sucht einen Teilnehmer nach ID
   */
  public getParticipantById(id: string): Participant | undefined {
    return this.participants.find(p => p.id === id)
  }

  /**
   * Startet eine neue Abstimmungsrunde
   *
   * @param story - Die zu schätzende Story
   */
  public startVoting(story: string): void {
    this.currentStory = story.trim()
    this.status = 'voting'
    this.cardsRevealed = false

    // Alle Votes zurücksetzen
    this.participants.forEach(p => p.resetSelection())
    this.touch()
  }

  /**
   * Deckt alle Karten auf
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
   * Setzt die Runde zurück für neue Abstimmung
   */
  public resetVoting(): void {
    this.cardsRevealed = false
    this.status = 'voting'
    this.participants.forEach(p => p.resetSelection())
    this.touch()
  }

  /**
   * Prüft ob alle Teilnehmer gewählt haben
   */
  public allVotesIn(): boolean {
    const voters = this.getVoters()
    return voters.length > 0 && voters.every(p => p.hasVoted())
  }

  /**
   * Gibt alle stimmberechtigten Teilnehmer zurück
   */
  public getVoters(): Participant[] {
    return this.participants.filter(p => !p.isObserver)
  }

  /**
   * Gibt alle Beobachter zurück
   */
  public getObservers(): Participant[] {
    return this.participants.filter(p => p.isObserver)
  }

  /**
   * Berechnet die Statistiken der aktuellen Abstimmung
   */
  private calculateResult(): IVotingResult {
    const votes = new Map<string, PokerValue>()
    const numericValues: number[] = []

    this.getVoters().forEach((p) => {
      if (p.selectedValue !== null) {
        votes.set(p.id, p.selectedValue)

        // Nur numerische Werte für Statistiken
        const numValue = Number.parseFloat(p.selectedValue)
        if (!Number.isNaN(numValue)) {
          numericValues.push(numValue)
        }
      }
    })

    // Durchschnitt berechnen
    const average = numericValues.length > 0
      ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
      : null

    // Median berechnen
    const median = this.calculateMedian(numericValues)

    // Modus (häufigster Wert) berechnen
    const mode = this.calculateMode([...votes.values()])

    // Konsens prüfen (alle gleich)
    const uniqueVotes = new Set(votes.values())
    const hasConsensus = uniqueVotes.size === 1 && votes.size > 1

    return {
      story: this.currentStory!,
      votes,
      average,
      median,
      mode,
      hasConsensus,
      timestamp: new Date(),
    }
  }

  /**
   * Berechnet den Median einer Zahlenliste
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
   * Berechnet den Modus (häufigster Wert)
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
   * Aktualisiert den Zeitstempel
   */
  private touch(): void {
    this.updatedAt = new Date()
  }

  /**
   * Gibt die verfügbaren Kartenwerte zurück
   */
  public getCardValues(): readonly PokerValue[] {
    return this.config.cardValues
  }

  /**
   * Gibt den Abstimmungsverlauf zurück
   */
  public getVotingHistory(): readonly IVotingResult[] {
    return this.votingHistory
  }

  /**
   * Serialisiert die Session für API/Storage
   */
  public toJSON(): ISession {
    return {
      id: this.id,
      name: this.name,
      currentStory: this.currentStory,
      participants: this.participants.map(p => p.toJSON()),
      status: this.status,
      cardsRevealed: this.cardsRevealed,
      hostId: this.hostId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  /**
   * Erstellt eine Session aus JSON-Daten
   */
  public static fromJSON(data: ISession, config?: Partial<ISessionConfig>): Session {
    const session = new Session(data.name, data.hostId, config)
    Object.assign(session, {
      id: data.id,
      currentStory: data.currentStory,
      status: data.status,
      cardsRevealed: data.cardsRevealed,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    })

    session.participants = data.participants.map(p => Participant.fromJSON(p))
    return session
  }
}
