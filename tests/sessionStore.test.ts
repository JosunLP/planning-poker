import { afterEach, describe, expect, it } from 'bun:test'
import { sessionStore } from '../server/utils/sessionStore'

interface MockPeer {
  id: string
  send: (message: string) => void
}

function createPeer(id: string): MockPeer {
  return {
    id,
    send: () => {},
  }
}

describe('SessionStore auto reveal', () => {
  const peersToCleanup: MockPeer[] = []

  afterEach(() => {
    while (peersToCleanup.length > 0) {
      const peer = peersToCleanup.pop()
      if (peer) {
        sessionStore.leaveSession(peer as never)
      }
    }
  })

  it('reveals automatically once every voter has voted', () => {
    const hostPeer = createPeer('host-auto')
    const voterPeer = createPeer('voter-auto')
    peersToCleanup.push(hostPeer, voterPeer)

    const { joinCode } = sessionStore.createSession('Sprint', 'Alice', hostPeer as never)
    sessionStore.joinSession(joinCode, 'Bob', false, voterPeer as never)

    const startedSession = sessionStore.startVoting(hostPeer as never, 'Story #1')
    expect(startedSession?.config.autoReveal).toBe(true)

    sessionStore.selectVote(hostPeer as never, '2')
    const updatedSession = sessionStore.selectVote(voterPeer as never, '3')

    expect(updatedSession?.session.cardsRevealed).toBe(true)
    expect(updatedSession?.session.status).toBe('revealed')
  })

  it('keeps manual reveal behavior when auto reveal is disabled', () => {
    const hostPeer = createPeer('host-manual')
    const voterPeer = createPeer('voter-manual')
    peersToCleanup.push(hostPeer, voterPeer)

    const { joinCode } = sessionStore.createSession('Sprint', 'Alice', hostPeer as never)
    sessionStore.joinSession(joinCode, 'Bob', false, voterPeer as never)
    sessionStore.updateAutoReveal(hostPeer as never, false)

    sessionStore.startVoting(hostPeer as never, 'Story #2')
    sessionStore.selectVote(hostPeer as never, '2')
    const updatedSession = sessionStore.selectVote(voterPeer as never, '3')

    expect(updatedSession?.session.config.autoReveal).toBe(false)
    expect(updatedSession?.session.cardsRevealed).toBe(false)
    expect(updatedSession?.session.status).toBe('voting')
  })

  it('does not auto reveal if the host disables it during voting', () => {
    const hostPeer = createPeer('host-toggle')
    const voterPeer = createPeer('voter-toggle')
    peersToCleanup.push(hostPeer, voterPeer)

    const { joinCode } = sessionStore.createSession('Sprint', 'Alice', hostPeer as never)
    sessionStore.joinSession(joinCode, 'Bob', false, voterPeer as never)

    sessionStore.startVoting(hostPeer as never, 'Story #3')
    sessionStore.selectVote(hostPeer as never, '2')
    sessionStore.updateAutoReveal(hostPeer as never, false)
    const updatedSession = sessionStore.selectVote(voterPeer as never, '3')

    expect(updatedSession?.session.config.autoReveal).toBe(false)
    expect(updatedSession?.session.cardsRevealed).toBe(false)
    expect(updatedSession?.session.status).toBe('voting')
  })

  it('reveals immediately when auto reveal is enabled after all votes are already in', () => {
    const hostPeer = createPeer('host-enable')
    const voterPeer = createPeer('voter-enable')
    peersToCleanup.push(hostPeer, voterPeer)

    const { joinCode } = sessionStore.createSession('Sprint', 'Alice', hostPeer as never)
    sessionStore.joinSession(joinCode, 'Bob', false, voterPeer as never)
    const disabledSession = sessionStore.updateAutoReveal(hostPeer as never, false)

    expect(disabledSession?.config.autoReveal).toBe(false)
    sessionStore.startVoting(hostPeer as never, 'Story #4')
    sessionStore.selectVote(hostPeer as never, '2')
    sessionStore.selectVote(voterPeer as never, '3')

    const updatedSession = sessionStore.updateAutoReveal(hostPeer as never, true)

    expect(updatedSession?.config.autoReveal).toBe(true)
    expect(updatedSession?.cardsRevealed).toBe(true)
    expect(updatedSession?.status).toBe('revealed')
  })

  it('only auto reveals while voting is active', () => {
    const hostPeer = createPeer('host-status')
    peersToCleanup.push(hostPeer)

    const { session } = sessionStore.createSession('Sprint', 'Alice', hostPeer as never)
    const updatedSession = sessionStore.selectVote(hostPeer as never, '2')

    expect(updatedSession?.session.cardsRevealed).toBe(false)
    expect(updatedSession?.session.status).toBe(session.status)
  })
})
