import { afterEach, describe, expect, it } from 'bun:test'
import type { Peer } from 'crossws'
import { sessionStore } from '../server/utils/sessionStore'

function createPeer(id: string): Peer {
  return {
    id,
    send(_message: string) {},
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

  it('assigns a new host when a preserved empty session gets a fresh join', () => {
    const store = sessionStore
    const hostPeer = createPeer('solo-host-peer')
    const freshJoinPeer = createPeer('fresh-join-peer')
    const hostRejoinPeer = createPeer('solo-host-rejoin-peer')

    const { joinCode, participant: originalHost, reconnectToken } = store.createSession('Solo Sprint', 'Alice', hostPeer)

    store.disconnectPeer(hostPeer)

    const freshJoin = store.joinSession(joinCode, 'Bob', false, freshJoinPeer)
    expect(freshJoin).not.toBeNull()
    expect(freshJoin?.session.hostId).toBe(freshJoin?.participant.id)
    expect(freshJoin?.session.participants).toHaveLength(1)

    const hostRejoin = store.joinSession(joinCode, 'Alice', false, hostRejoinPeer, reconnectToken)
    expect(hostRejoin).not.toBeNull()
    expect(hostRejoin?.participant.id).toBe(originalHost.id)
    expect(hostRejoin?.session.hostId).toBe(originalHost.id)
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

describe('SessionStore auto reveal', () => {
  const peersToCleanup: Peer[] = []

  afterEach(() => {
    while (peersToCleanup.length > 0) {
      const peer = peersToCleanup.pop()
      if (peer) {
        sessionStore.leaveSession(peer)
      }
    }
  })

  it('reveals automatically once every voter has voted', () => {
    const hostPeer = createPeer('host-auto')
    const voterPeer = createPeer('voter-auto')
    peersToCleanup.push(hostPeer, voterPeer)

    const { joinCode } = sessionStore.createSession('Sprint', 'Alice', hostPeer)
    sessionStore.joinSession(joinCode, 'Bob', false, voterPeer)

    const startedSession = sessionStore.startVoting(hostPeer, 'Story #1')
    expect(startedSession?.config.autoReveal).toBe(true)

    sessionStore.selectVote(hostPeer, '2')
    const updatedSession = sessionStore.selectVote(voterPeer, '3')

    expect(updatedSession?.session.cardsRevealed).toBe(true)
    expect(updatedSession?.session.status).toBe('revealed')
  })

  it('keeps manual reveal behavior when auto reveal is disabled', () => {
    const hostPeer = createPeer('host-manual')
    const voterPeer = createPeer('voter-manual')
    peersToCleanup.push(hostPeer, voterPeer)

    const { joinCode } = sessionStore.createSession('Sprint', 'Alice', hostPeer)
    sessionStore.joinSession(joinCode, 'Bob', false, voterPeer)
    sessionStore.updateAutoReveal(hostPeer, false)

    sessionStore.startVoting(hostPeer, 'Story #2')
    sessionStore.selectVote(hostPeer, '2')
    const updatedSession = sessionStore.selectVote(voterPeer, '3')

    expect(updatedSession?.session.config.autoReveal).toBe(false)
    expect(updatedSession?.session.cardsRevealed).toBe(false)
    expect(updatedSession?.session.status).toBe('voting')
  })

  it('does not auto reveal if the host disables it during voting', () => {
    const hostPeer = createPeer('host-toggle')
    const voterPeer = createPeer('voter-toggle')
    peersToCleanup.push(hostPeer, voterPeer)

    const { joinCode } = sessionStore.createSession('Sprint', 'Alice', hostPeer)
    sessionStore.joinSession(joinCode, 'Bob', false, voterPeer)

    sessionStore.startVoting(hostPeer, 'Story #3')
    sessionStore.selectVote(hostPeer, '2')
    sessionStore.updateAutoReveal(hostPeer, false)
    const updatedSession = sessionStore.selectVote(voterPeer, '3')

    expect(updatedSession?.session.config.autoReveal).toBe(false)
    expect(updatedSession?.session.cardsRevealed).toBe(false)
    expect(updatedSession?.session.status).toBe('voting')
  })

  it('reveals immediately when auto reveal is enabled after all votes are already in', () => {
    const hostPeer = createPeer('host-enable')
    const voterPeer = createPeer('voter-enable')
    peersToCleanup.push(hostPeer, voterPeer)

    const { joinCode } = sessionStore.createSession('Sprint', 'Alice', hostPeer)
    sessionStore.joinSession(joinCode, 'Bob', false, voterPeer)
    const disabledSession = sessionStore.updateAutoReveal(hostPeer, false)

    expect(disabledSession?.config.autoReveal).toBe(false)
    sessionStore.startVoting(hostPeer, 'Story #4')
    sessionStore.selectVote(hostPeer, '2')
    sessionStore.selectVote(voterPeer, '3')

    const updatedSession = sessionStore.updateAutoReveal(hostPeer, true)

    expect(updatedSession?.config.autoReveal).toBe(true)
    expect(updatedSession?.cardsRevealed).toBe(true)
    expect(updatedSession?.status).toBe('revealed')
  })

  it('only auto reveals while voting is active', () => {
    const hostPeer = createPeer('host-status')
    peersToCleanup.push(hostPeer)

    const { session } = sessionStore.createSession('Sprint', 'Alice', hostPeer)
    const updatedSession = sessionStore.selectVote(hostPeer, '2')

    expect(updatedSession?.session.cardsRevealed).toBe(false)
    expect(updatedSession?.session.status).toBe(session.status)
  })
})
