import { describe, expect, it } from 'vitest'
import { emptyData, normalizeData } from './model'

describe('normalizeData', () => {
  it('fills settings added after the data was saved', () => {
    const old = { ...emptyData(), settings: { calendarId: 'cal' } }
    expect(normalizeData(old).settings).toEqual({ calendarId: 'cal', ignoredWords: [], excludedTitles: [], upcomingWeeks: 2 })
  })

  it('rejects anything that is not Duetrack data', () => {
    for (const bad of [null, 'text', {}, { clients: [] }]) expect(() => normalizeData(bad)).toThrow()
  })

  it('rejects unknown schema versions', () => {
    expect(() => normalizeData({ ...emptyData(), schemaVersion: 99 })).toThrow(/versione 99/)
  })
})
