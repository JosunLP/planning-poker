import { describe, expect, it } from 'bun:test'
import { Participant } from '../app/utils/Participant'

describe('Participant', () => {
  it('prevents observers from selecting cards', () => {
    const observer = new Participant('Observer', true)
    const success = observer.selectCard('5')
    expect(success).toBe(false)
    expect(observer.selectedValue).toBeNull()
  })

  it('toggles observer mode and resets selection', () => {
    const user = new Participant('User')
    user.selectCard('3')
    expect(user.selectedValue).toBe('3')

    user.toggleObserverMode()
    expect(user.isObserver).toBe(true)
    expect(user.selectedValue).toBeNull()

    user.toggleObserverMode()
    expect(user.isObserver).toBe(false)
  })
})
