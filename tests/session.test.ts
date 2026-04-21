import { describe, expect, it } from 'bun:test'
import { Participant } from '../app/utils/Participant'
import { Session } from '../app/utils/Session'

describe('Session voting flow', () => {
  it('calculates stats and mode correctly', () => {
    const session = new Session('Sprint 42', 'host-1')
    const alice = new Participant('Alice')
    const bob = new Participant('Bob')
    const charlie = new Participant('Charlie')

    session.addParticipant(alice)
    session.addParticipant(bob)
    session.addParticipant(charlie)

    session.startVoting('Story #1')
    alice.selectCard('3')
    bob.selectCard('5')
    charlie.selectCard('5')

    const result = session.revealCards()

    expect(result).not.toBeNull()
    if (!result) return

    expect(result.average).toBeCloseTo((3 + 5 + 5) / 3)
    expect(result.median).toBe(5)
    expect(result.mode).toBe('5')
    expect(result.hasConsensus).toBe(false)
  })

  it('detects consensus when all numeric votes match', () => {
    const session = new Session('Sprint 42', 'host-2')
    const anna = new Participant('Anna')
    const ben = new Participant('Ben')

    session.addParticipant(anna)
    session.addParticipant(ben)

    session.startVoting('Story #2')
    anna.selectCard('8')
    ben.selectCard('8')

    const result = session.revealCards()

    expect(result).not.toBeNull()
    if (!result) return

    expect(result.hasConsensus).toBe(true)
    expect(result.mode).toBe('8')
    expect(result.average).toBe(8)
    expect(result.median).toBe(8)
  })

  it('ignores observers for allVotesIn', () => {
    const session = new Session('Sprint 42', 'host-3')
    const voter = new Participant('Voter')
    const observer = new Participant('Observer', true)

    session.addParticipant(voter)
    session.addParticipant(observer)

    session.startVoting('Story #3')
    voter.selectCard('1')

    expect(session.allVotesIn()).toBe(true)
  })

  it('returns false for allVotesIn when no voters exist', () => {
    const session = new Session('Empty', 'host-4')
    expect(session.allVotesIn()).toBe(false)
  })

  it('resets voting state correctly', () => {
    const session = new Session('Resettable', 'host-5')
    const voter = new Participant('Voter')
    session.addParticipant(voter)

    session.startVoting('Story #4')
    voter.selectCard('3')
    session.revealCards()

    session.resetVoting()

    expect(session.cardsRevealed).toBe(false)
    expect(session.status).toBe('voting')
    expect(session.allVotesIn()).toBe(false)
  })

  it('does not reveal when not in voting state', () => {
    const session = new Session('Guarded Reveal', 'host-6')
    // reveal without starting
    expect(session.revealCards()).toBeNull()

    session.startVoting('Story #5')
    session.revealCards()
    // second reveal should be blocked because status is now "revealed"
    expect(session.revealCards()).toBeNull()
  })

  it('reveals automatically when enabled and everyone has voted', () => {
    const session = new Session('Automatic', 'host-7', { autoReveal: true })
    const alice = new Participant('Alice')
    const bob = new Participant('Bob')

    session.addParticipant(alice)
    session.addParticipant(bob)
    session.startVoting('Story #6')

    alice.selectCard('2')
    expect(session.revealCardsIfReady()).toBeNull()

    bob.selectCard('3')

    const result = session.revealCardsIfReady()

    expect(result).not.toBeNull()
    expect(session.cardsRevealed).toBe(true)
    expect(session.status).toBe('revealed')
  })

  it('does not reveal automatically when disabled', () => {
    const session = new Session('Manual', 'host-8', { autoReveal: false })
    const alice = new Participant('Alice')
    const bob = new Participant('Bob')

    session.addParticipant(alice)
    session.addParticipant(bob)
    session.startVoting('Story #7')
    alice.selectCard('2')
    bob.selectCard('3')

    expect(session.revealCardsIfReady()).toBeNull()
    expect(session.cardsRevealed).toBe(false)
    expect(session.status).toBe('voting')
  })

  it('updates config partially and refreshes updatedAt', async () => {
    const session = new Session('Configurable', 'host-9', { autoReveal: true })
    const previousUpdatedAt = session.updatedAt

    await Bun.sleep(5)
    session.updateConfig({ autoReveal: false })

    expect(session.config.autoReveal).toBe(false)
    expect(session.config.allowObservers).toBe(true)
    expect(session.updatedAt.getTime()).toBeGreaterThan(previousUpdatedAt.getTime())
  })

  it('serializes and hydrates via JSON', () => {
    const session = new Session('Serializable', 'host-10', { autoReveal: false })
    const voter = new Participant('Voter')
    session.addParticipant(voter)
    session.startVoting('Story #8', 'Desc')
    voter.selectCard('2')
    session.revealCards()

    const json = session.toJSON()
    const restored = Session.fromJSON(json)

    expect(restored.name).toBe('Serializable')
    expect(restored.hostId).toBe(session.hostId)
    expect(restored.status).toBe('revealed')
    expect(restored.cardsRevealed).toBe(true)
    expect(restored.currentStory).toBe('Story #8')
    expect(restored.getParticipantById(voter.id)?.name).toBe('Voter')
    expect(restored.config.autoReveal).toBe(false)
  })
})
