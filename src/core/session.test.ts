import { describe, expect, it } from 'vitest'
import { type CalendarEvent, eventToSession, formatDuration, groupByTitle } from './session'

function event(summary: string, start: string, end: string, extra: Partial<CalendarEvent> = {}): CalendarEvent {
  return { id: `${summary}-${start}`, summary, start: { dateTime: start }, end: { dateTime: end }, ...extra }
}

describe('eventToSession', () => {
  it('computes the duration in minutes', () => {
    const s = eventToSession(event('📚 Davide', '2026-09-24T15:00:00+02:00', '2026-09-24T16:30:00+02:00'))
    expect(s).toMatchObject({ title: 'Davide', key: 'davide', durationMinutes: 90 })
  })

  it('handles events whose start and end use different UTC offsets', () => {
    // La notte del cambio d'ora: 02:00+02:00 → 02:00+01:00 sono 60 minuti reali.
    const s = eventToSession(event('Davide', '2026-10-25T02:00:00+02:00', '2026-10-25T02:00:00+01:00'))
    expect(s?.durationMinutes).toBe(60)
  })

  it('skips all-day, cancelled and zero-length events', () => {
    const allDay: CalendarEvent = { id: 'a', summary: 'Ferie', start: { date: '2026-09-24' }, end: { date: '2026-09-25' } }
    expect(eventToSession(allDay)).toBeNull()
    expect(eventToSession(event('Davide', '2026-09-24T15:00:00Z', '2026-09-24T16:00:00Z', { status: 'cancelled' }))).toBeNull()
    expect(eventToSession(event('Davide', '2026-09-24T15:00:00Z', '2026-09-24T15:00:00Z'))).toBeNull()
  })
})

describe('groupByTitle', () => {
  it('groups by normalized title and sums the minutes', () => {
    const sessions = [
      event('📚 Davide', '2026-09-01T15:00:00Z', '2026-09-01T16:00:00Z'),
      event('davide', '2026-09-08T15:00:00Z', '2026-09-08T16:30:00Z'),
      event('Cecilia', '2026-09-02T15:00:00Z', '2026-09-02T16:00:00Z'),
    ].map((e) => eventToSession(e)!)

    const groups = groupByTitle(sessions)
    expect(groups.map((g) => [g.key, g.sessions.length, g.totalMinutes])).toEqual([
      ['davide', 2, 150],
      ['cecilia', 1, 60],
    ])
  })
})

describe('formatDuration', () => {
  it('formats hours and minutes compactly', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(90)).toBe('1h30')
    expect(formatDuration(125)).toBe('2h05')
    expect(formatDuration(45)).toBe('45min')
  })
})
