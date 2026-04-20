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
})
