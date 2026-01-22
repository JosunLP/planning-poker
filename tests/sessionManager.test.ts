import { afterEach, describe, expect, it } from 'bun:test'
import { JOIN_CODE_LENGTH } from '../app/types/poker'
import { SessionManager } from '../app/utils/SessionManager'

describe('SessionManager', () => {
  afterEach(() => {
    SessionManager.resetInstance()
  })

  it('creates a session and returns join code and host', () => {
    const manager = SessionManager.getInstance({ deleteWhenEmpty: true })
    const { session, host, joinCode } = manager.createSession('Sprint', 'Alice')

    expect(joinCode).toHaveLength(JOIN_CODE_LENGTH)
    expect(manager.getSessionByJoinCode(joinCode)?.id).toBe(session.id)
    expect(session.getParticipantById(host.id)).not.toBeUndefined()
    expect(manager.getSessionCount()).toBe(1)
  })

  it('allows joining and removes empty sessions on leave', () => {
    const manager = SessionManager.getInstance({ deleteWhenEmpty: true })
    const { session, host, joinCode } = manager.createSession('Sprint', 'Alice')

    const joinResult = manager.joinSession(joinCode, 'Bob')
    expect(joinResult?.participant.name).toBe('Bob')
    expect(session.participants.length).toBe(2)

    manager.leaveSession(session.id, host.id)
    manager.leaveSession(session.id, joinResult!.participant.id)

    // Session should be cleaned up because deleteWhenEmpty is true
    expect(manager.getSessionById(session.id)).toBeNull()
    expect(manager.getSessionCount()).toBe(0)
  })
})
