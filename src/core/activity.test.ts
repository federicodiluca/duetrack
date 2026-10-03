import { describe, expect, it } from 'vitest'
import { daysBetween, inactiveClients, lastSessionDates } from './activity'
import { buildLedger } from './ledger'
import { type Client, emptyData } from './model'
import { eventToSession } from './session'

const client = (id: string): Client => ({ id, name: id, aliases: [], rates: [] })
const event = (id: string, summary: string, day: string) =>
  eventToSession({ id, summary, start: { dateTime: `${day}T12:00:00Z` }, end: { dateTime: `${day}T13:00:00Z` } })!

describe('activity', () => {
  const clients = [client('luca'), client('marta'), client('giulia')]
  const sessions = [event('1', 'luca', '2026-09-01'), event('2', 'luca', '2026-09-24'), event('3', 'marta', '2026-08-20')]
  const ledger = buildLedger(sessions, { ...emptyData(), clients }, { from: new Date(0), to: new Date('2027-01-01') })

  it('finds the last session of each client', () => {
    expect(Object.fromEntries(lastSessionDates(ledger))).toEqual({ luca: '2026-09-24', marta: '2026-08-20' })
  })

  it('lists clients not seen for a while, never-seen ones first', () => {
    const inactive = inactiveClients(clients, lastSessionDates(ledger), '2026-09-27', 21)
    expect(inactive.map((c) => [c.client.id, c.days])).toEqual([
      ['giulia', undefined],
      ['marta', 38],
    ])
  })

  it('counts calendar days, across DST changes', () => {
    expect(daysBetween('2026-10-20', '2026-11-03')).toBe(14)
  })
})
