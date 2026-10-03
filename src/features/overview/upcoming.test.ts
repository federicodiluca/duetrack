import { describe, expect, it } from 'vitest'
import { upcomingDayLabel } from './upcoming'

describe('upcomingDayLabel', () => {
  it('names today and tomorrow, also across months', () => {
    expect(upcomingDayLabel('2026-09-30', '2026-09-30')).toBe('Oggi')
    expect(upcomingDayLabel('2026-10-01', '2026-09-30')).toBe('Domani')
  })

  it('falls back to the short day', () => {
    expect(upcomingDayLabel('2026-10-02', '2026-09-30')).not.toMatch(/Oggi|Domani/)
  })
})
