import { afterEach, describe, expect, it } from 'bun:test'
import type { Peer } from 'crossws'
import { sessionStore } from '../server/utils/sessionStore'

function createPeer(id: string): Peer {
  return {
    id,
    send() {},
  } as unknown as Peer
}

describe('SessionStore reconnect behavior', () => {
  afterEach(() => {
    sessionStore.resetForTests()
  })

  it('restores host privileges when the disconnected host rejoins', () => {
    const store = sessionStore
    const hostPeer = createPeer('host-peer')
    const guestPeer = createPeer('guest-peer')
    const rejoinPeer = createPeer('host-rejoin-peer')

    const { joinCode, participant: host } = store.createSession('Sprint', 'Alice', hostPeer)
    const guestJoin = store.joinSession(joinCode, 'Bob', false, guestPeer)

    expect(guestJoin).not.toBeNull()

    const disconnectResult = store.disconnectPeer(hostPeer)
    expect(disconnectResult?.session).not.toBeNull()
    expect(disconnectResult?.session?.hostId).toBe(guestJoin!.participant.id)

    const rejoinResult = store.joinSession(joinCode, 'Alice', false, rejoinPeer, host.id)

    expect(rejoinResult).not.toBeNull()
    expect(rejoinResult?.participant.id).toBe(host.id)
    expect(rejoinResult?.session.hostId).toBe(host.id)
    expect(rejoinResult?.session.participants).toHaveLength(2)
  })

  it('keeps a disconnected empty session available for rejoin', () => {
    const store = sessionStore
    const hostPeer = createPeer('solo-host-peer')
    const rejoinPeer = createPeer('solo-host-rejoin-peer')

    const { joinCode, session, participant } = store.createSession('Solo Sprint', 'Alice', hostPeer)

    const disconnectResult = store.disconnectPeer(hostPeer)
    expect(disconnectResult?.session?.participants).toHaveLength(0)

    const rejoinResult = store.joinSession(joinCode, 'Alice', false, rejoinPeer, participant.id)

    expect(rejoinResult).not.toBeNull()
    expect(rejoinResult?.session.id).toBe(session.id)
    expect(rejoinResult?.session.hostId).toBe(participant.id)
    expect(rejoinResult?.session.participants).toHaveLength(1)
  })
})
