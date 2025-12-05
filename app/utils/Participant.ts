/**
 * Participant Klasse
 *
 * Repräsentiert einen Teilnehmer in einer Planning Poker Session.
 * Kapselt die Logik für Teilnehmer-Aktionen.
 */

import type { IParticipant, PokerValue } from '~/types'

/**
 * Klasse zur Verwaltung eines Session-Teilnehmers
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
   * Erstellt einen neuen Teilnehmer
   *
   * @param name - Anzeigename des Teilnehmers
   * @param isObserver - Optional: Als Beobachter beitreten
   * @param id - Optional: Eigene ID (sonst automatisch generiert)
   */
  constructor(name: string, isObserver = false, id?: string) {
    this.id = id ?? crypto.randomUUID()
    this.name = name.trim()
    this.selectedValue = null
    this.isObserver = isObserver
    this.joinedAt = new Date()
  }

  /**
   * Wählt eine Karte aus
   *
   * @param value - Der Kartenwert
   * @returns true wenn erfolgreich, false wenn Beobachter
   */
  public selectCard(value: PokerValue): boolean {
    if (this.isObserver) {
      return false
    }
    this.selectedValue = value
    return true
  }

  /**
   * Setzt die Kartenauswahl zurück
   */
  public resetSelection(): void {
    this.selectedValue = null
  }

  /**
   * Prüft ob der Teilnehmer bereits gewählt hat
   */
  public hasVoted(): boolean {
    return this.selectedValue !== null
  }

  /**
   * Wechselt zwischen Teilnehmer und Beobachter
   */
  public toggleObserverMode(): void {
    this.isObserver = !this.isObserver
    if (this.isObserver) {
      this.resetSelection()
    }
  }

  /**
   * Serialisiert den Teilnehmer für API/Storage
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
   * Erstellt einen Teilnehmer aus JSON-Daten
   *
   * @param data - Serialisierte Teilnehmerdaten
   */
  public static fromJSON(data: IParticipant): Participant {
    const participant = new Participant(data.name, data.isObserver, data.id)
    participant.selectedValue = data.selectedValue
    return participant
  }
}
