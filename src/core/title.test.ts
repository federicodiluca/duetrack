import { describe, expect, it } from 'vitest'
import { displayTitle, titleKey, withoutWords } from './title'

describe('displayTitle', () => {
  it('removes emoji and extra spaces, keeps case and accents', () => {
    expect(displayTitle('📚  Niccolò G. ')).toBe('Niccolò G.')
  })

  it('removes composite emoji joined by ZWJ', () => {
    expect(displayTitle('👨‍🏫 Davide')).toBe('Davide')
  })
})

describe('titleKey', () => {
  it('matches regardless of emoji, case, accents and punctuation', () => {
    expect(titleKey('📚 Niccolò G.')).toBe('niccolo g')
    expect(titleKey('niccolo g')).toBe('niccolo g')
  })

  it('keeps homonyms apart', () => {
    expect(titleKey('Filippo')).not.toBe(titleKey('Filippo O.'))
  })

  it('returns an empty key for emoji-only titles', () => {
    expect(titleKey('📚')).toBe('')
  })
})

describe('withoutWords', () => {
  it('drops ignored words regardless of case and accents', () => {
    expect(withoutWords('📚 Ripetizioni Giacomo', ['ripetizioni'])).toBe('Giacomo')
    expect(withoutWords('RIPETIZIONI giovanni G.', ['Ripetizioni'])).toBe('giovanni G.')
  })

  it('leaves the title alone without ignored words', () => {
    expect(withoutWords('📚 Giacomo', [])).toBe('Giacomo')
  })
})
