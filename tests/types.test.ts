import { describe, expect, it } from 'bun:test'
import {
    JOIN_CODE_CHARS,
    JOIN_CODE_LENGTH,
    POKER_VALUES,
    formatJoinCode,
    isValidJoinCode,
    isValidPokerValue,
} from '../app/types/poker'

describe('poker type helpers', () => {
  it('validates poker values', () => {
    expect(isValidPokerValue('5')).toBe(true)
    expect(isValidPokerValue('?')).toBe(true)
    expect(isValidPokerValue('☕')).toBe(true)
    expect(isValidPokerValue('7')).toBe(false)
  })

  it('formats join codes safely', () => {
    const formatted = formatJoinCode('ab-cd1!z')
    expect(formatted).toHaveLength(JOIN_CODE_LENGTH)
    expect(formatted).toBe('ABCD1Z'.slice(0, JOIN_CODE_LENGTH))
  })

  it('checks join code validity', () => {
    expect(isValidJoinCode('ABC234')).toBe(true)
    // invalid because of disallowed characters or length
    expect(isValidJoinCode('ABC12I')).toBe(false)
    expect(isValidJoinCode('TOO-LONG')).toBe(false)
  })

  it('exposes canonical poker values list', () => {
    expect(POKER_VALUES.includes('?')).toBe(true)
    expect(POKER_VALUES.includes('☕')).toBe(true)
    expect(POKER_VALUES).toContain('13')
  })

  it('join code alphabet excludes confusable chars', () => {
    expect(JOIN_CODE_CHARS.includes('O')).toBe(false)
    expect(JOIN_CODE_CHARS.includes('I')).toBe(false)
    expect(JOIN_CODE_CHARS.includes('1')).toBe(false)
  })
})
