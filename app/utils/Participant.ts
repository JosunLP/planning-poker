/**
 * Participant Class
 *
 * Represents a participant in a Planning Poker session.
 * Encapsulates the logic for participant actions.
 */

import type { IParticipant, PokerValue } from '../types'

/**
 * Class for managing a session participant
 *
 * @example
 * ```ts
 * const participant = new Participant('John Doe')
 * participant.selectCard('5')
 * ```
 */
export class Participant implements IParticipant {
  public readonly id: string
  public name: string
  public selectedValue: PokerValue | null
  public isObserver: boolean
  public readonly joinedAt: Date

  /**
   * Creates a new participant
   *
   * @param name - Display name of the participant
   * @param isObserver - Optional: Join as an observer
   * @param id - Optional: Custom ID (otherwise auto-generated)
   */
  constructor(name: string, isObserver = false, id?: string) {
    this.id = id ?? crypto.randomUUID()
    this.name = name.trim()
    this.selectedValue = null
    this.isObserver = isObserver
    this.joinedAt = new Date()
  }

  /**
   * Selects a card
   *
   * @param value - The card value
   * @returns true if successful, false if observer
   */
  public selectCard(value: PokerValue): boolean {
    if (this.isObserver) {
      return false
    }
    this.selectedValue = value
    return true
  }

  /**
   * Resets the card selection
   */
  public resetSelection(): void {
    this.selectedValue = null
  }

  /**
   * Checks if the participant has already voted
   */
  public hasVoted(): boolean {
    return this.selectedValue !== null
  }

  /**
   * Toggles between participant and observer mode
   */
  public toggleObserverMode(): void {
    this.isObserver = !this.isObserver
    if (this.isObserver) {
      this.resetSelection()
    }
  }

  /**
   * Serializes the participant for API/Storage
   */
  public toJSON(): IParticipant {
    return {
      id: this.id,
      name: this.name,
      selectedValue: this.selectedValue,
      isObserver: this.isObserver,
      joinedAt: this.joinedAt,
    }
  }

  /**
   * Creates a participant from JSON data
   *
   * @param data - Serialized participant data
   */
  public static fromJSON(data: IParticipant): Participant {
    const participant = new Participant(data.name, data.isObserver, data.id)
    participant.selectedValue = data.selectedValue
    return participant
  }
}
