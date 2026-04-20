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

    const { joinCode, participant: host, reconnectToken } = store.createSession('Sprint', 'Alice', hostPeer)
    const guestJoin = store.joinSession(joinCode, 'Bob', false, guestPeer)

    expect(guestJoin).not.toBeNull()

    const disconnectResult = store.disconnectPeer(hostPeer)
    expect(disconnectResult?.session).not.toBeNull()
    expect(disconnectResult?.session?.hostId).toBe(guestJoin!.participant.id)

    const rejoinResult = store.joinSession(joinCode, 'Alice', false, rejoinPeer, reconnectToken)

    expect(rejoinResult).not.toBeNull()
    expect(rejoinResult?.participant.id).toBe(host.id)
    expect(rejoinResult?.session.hostId).toBe(host.id)
    expect(rejoinResult?.session.participants).toHaveLength(2)
    expect(rejoinResult?.reconnectToken).not.toBe(reconnectToken)
  })

  it('keeps a disconnected empty session available for rejoin', () => {
    const store = sessionStore
    const hostPeer = createPeer('solo-host-peer')
    const rejoinPeer = createPeer('solo-host-rejoin-peer')

    const { joinCode, session, participant, reconnectToken } = store.createSession('Solo Sprint', 'Alice', hostPeer)

    const disconnectResult = store.disconnectPeer(hostPeer)
    expect(disconnectResult?.session?.participants).toHaveLength(0)

    const rejoinResult = store.joinSession(joinCode, 'Alice', false, rejoinPeer, reconnectToken)

    expect(rejoinResult).not.toBeNull()
    expect(rejoinResult?.session.id).toBe(session.id)
    expect(rejoinResult?.session.hostId).toBe(participant.id)
    expect(rejoinResult?.session.participants).toHaveLength(1)
  })

  it('does not restore a disconnected host with an invalid reconnect token', () => {
    const store = sessionStore
    const hostPeer = createPeer('host-peer')
    const guestPeer = createPeer('guest-peer')
    const attackerPeer = createPeer('attacker-peer')

    const { joinCode, participant: host } = store.createSession('Sprint', 'Alice', hostPeer)
    const guestJoin = store.joinSession(joinCode, 'Bob', false, guestPeer)

    expect(guestJoin).not.toBeNull()

    store.disconnectPeer(hostPeer)

    const attackerJoin = store.joinSession(joinCode, 'Mallory', false, attackerPeer, 'invalid-token')

    expect(attackerJoin).not.toBeNull()
    expect(attackerJoin?.participant.id).not.toBe(host.id)
    expect(attackerJoin?.session.hostId).toBe(guestJoin!.participant.id)
    expect(attackerJoin?.session.participants).toHaveLength(2)
  })

  it('rotates reconnect tokens after a successful rejoin', () => {
    const store = sessionStore
    const hostPeer = createPeer('host-peer')
    const firstRejoinPeer = createPeer('first-rejoin-peer')
    const secondRejoinPeer = createPeer('second-rejoin-peer')

    const { joinCode, participant, reconnectToken } = store.createSession('Sprint', 'Alice', hostPeer)

    store.disconnectPeer(hostPeer)

    const firstRejoin = store.joinSession(joinCode, 'Alice', false, firstRejoinPeer, reconnectToken)

    expect(firstRejoin).not.toBeNull()
    expect(firstRejoin?.participant.id).toBe(participant.id)
    expect(firstRejoin?.reconnectToken).not.toBe(reconnectToken)

    store.disconnectPeer(firstRejoinPeer)

    const staleTokenRejoin = store.joinSession(joinCode, 'Alice', false, createPeer('stale-token-peer'), reconnectToken)
    expect(staleTokenRejoin?.participant.id).not.toBe(participant.id)

    const secondRejoin = store.joinSession(joinCode, 'Alice', false, secondRejoinPeer, firstRejoin!.reconnectToken)
    expect(secondRejoin).not.toBeNull()
    expect(secondRejoin?.participant.id).toBe(participant.id)
  })
})
