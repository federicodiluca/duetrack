import { describe, expect, it } from 'vitest'
import { recordPayment } from './actions'
import { buildLedger, matchClient, oldestDue, rateAt, summarizeClient } from './ledger'
import { type Client, type DuetrackData, emptyData } from './model'
import { type Session, eventToSession } from './session'

// Orari a mezzogiorno UTC: la data locale è la stessa in qualunque fuso europeo o
// americano, così i test non dipendono dal fuso della macchina che li esegue.
function session(eventId: string, summary: string, day: string, minutes = 60): Session {
  const start = new Date(`${day}T12:00:00Z`)
  const end = new Date(start.getTime() + minutes * 60_000)
  return eventToSession({ id: eventId, summary, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } })!
}

const davide: Client = { id: 'davide', name: 'Davide', aliases: [], rates: [{ from: '2026-01-01', centsPerHour: 2000 }] }
const filippo: Client = { id: 'filippo', name: 'Filippo', aliases: [], rates: [{ from: '2026-01-01', centsPerHour: 2500 }] }
const filippoO: Client = { id: 'filippo-o', name: 'Filippo O.', aliases: ['Filo'], rates: [{ from: '2026-01-01', centsPerHour: 2500 }] }

function dataWith(...clients: Client[]): DuetrackData {
  return { ...emptyData(), clients }
}

const window = { from: new Date('2026-01-01T00:00:00Z'), to: new Date('2027-01-01T00:00:00Z') }

describe('matchClient', () => {
  const clients = [filippo, filippoO]

  it('matches name and aliases through the normalized key', () => {
    expect(matchClient('filippo o', clients)).toEqual({ kind: 'client', clientId: 'filippo-o' })
    expect(matchClient('filo', clients)).toEqual({ kind: 'client', clientId: 'filippo-o' })
    expect(matchClient('filippo', clients)).toEqual({ kind: 'client', clientId: 'filippo' })
  })

  it('reports unknown and ambiguous titles instead of guessing', () => {
    expect(matchClient('dentista', clients)).toEqual({ kind: 'none' })
    const clash = { ...filippoO, aliases: ['Filippo'] }
    expect(matchClient('filippo', [filippo, clash])).toEqual({ kind: 'ambiguous', clientIds: ['filippo', 'filippo-o'] })
  })
})

describe('rateAt', () => {
  const client: Client = {
    ...davide,
    rates: [
      { from: '2026-09-01', centsPerHour: 2500 },
      { from: '2026-01-01', centsPerHour: 2000 },
    ],
  }

  it('uses the latest rate that started on or before the date', () => {
    expect(rateAt(client, '2026-08-31')).toBe(2000)
    expect(rateAt(client, '2026-09-01')).toBe(2500)
    expect(rateAt(client, '2025-12-31')).toBeUndefined()
  })
})

describe('buildLedger', () => {
  it('assigns sessions by title and computes the amount', () => {
    const ledger = buildLedger([session('e1', '📚 Davide', '2026-09-24', 90)], dataWith(davide), window)
    expect(ledger.sessions[0]).toMatchObject({ id: 'cal:e1', clientId: 'davide', computedCents: 3000, amountCents: 3000 })
    expect(ledger.unclassified).toEqual([])
  })

  it('lists unknown titles as unclassified, unless excluded or assigned by hand', () => {
    const events = [session('e1', 'Dentista', '2026-09-24'), session('e2', 'Riunione', '2026-09-25'), session('e3', 'Dav', '2026-09-26')]
    const data: DuetrackData = {
      ...dataWith(davide),
      overrides: { 'cal:e2': { excluded: true }, 'cal:e3': { clientId: 'davide' } },
    }
    const ledger = buildLedger(events, data, window)
    expect(ledger.unclassified.map((s) => s.id)).toEqual(['cal:e1'])
    expect(ledger.sessions.find((s) => s.id === 'cal:e3')?.clientId).toBe('davide')
  })

  it('prefers the manual amount over the computed one', () => {
    const data: DuetrackData = { ...dataWith(davide), overrides: { 'cal:e1': { amountCents: 1500 } } }
    const [s] = buildLedger([session('e1', 'Davide', '2026-09-24')], data, window).sessions
    expect(s).toMatchObject({ computedCents: 2000, amountCents: 1500 })
  })

  it('includes manual sessions', () => {
    const data: DuetrackData = {
      ...dataWith(davide),
      manualSessions: [{ id: 'm1', clientId: 'davide', start: '2026-09-20T12:00:00Z', durationMinutes: 120 }],
    }
    const [s] = buildLedger([], data, window).sessions
    expect(s).toMatchObject({ id: 'man:m1', source: 'manual', clientId: 'davide', amountCents: 4000 })
  })

  it('flags paid events that disappeared or changed duration, only inside the loaded window', () => {
    const e1 = session('e1', 'Davide', '2026-09-01')
    const e2 = session('e2', 'Davide', '2026-09-08')
    const old = session('old', 'Davide', '2025-06-01')
    const client = { ...davide, rates: [{ from: '2025-01-01', centsPerHour: 2000 }] }
    let data = dataWith(client)
    const everything = buildLedger([old, e1, e2], data, { from: new Date('2025-01-01T00:00:00Z'), to: window.to })
    const [oldSession, ...recent] = everything.sessions
    data = recordPayment(data, { id: 'p0', clientId: 'davide', date: '2025-06-01' }, [oldSession])
    data = recordPayment(data, { id: 'p1', clientId: 'davide', date: '2026-09-10' }, recent)

    // e1 cancellato, e2 allungato a 90 minuti, "old" fuori dal periodo letto.
    const ledger = buildLedger([session('e2', 'Davide', '2026-09-08', 90)], data, window)
    expect(ledger.anomalies).toEqual([
      { kind: 'paid-session-missing', paymentId: 'p1', sessionId: 'cal:e1', start: e1.start.toISOString() },
      { kind: 'paid-session-changed', paymentId: 'p1', sessionId: 'cal:e2', paidMinutes: 60, currentMinutes: 90 },
    ])
  })
})

describe('summarizeClient', () => {
  const events = [
    session('e1', 'Davide', '2026-05-20'),
    session('e2', 'Davide', '2026-05-26', 90),
    session('e3', 'Davide', '2026-06-02', 120),
    session('e4', 'Cecilia', '2026-06-03'),
  ]

  it('totals all unpaid sessions by default', () => {
    const summary = summarizeClient(buildLedger(events, dataWith(davide), window), davide)
    expect(summary).toMatchObject({ dueMinutes: 270, dueCents: 9000, missingRate: 0, unpaidBeforePayFrom: 0 })
    expect(summary.due.map((s) => s.id)).toEqual(['cal:e1', 'cal:e2', 'cal:e3'])
  })

  it('starts from payFrom when set, without forgetting older unpaid sessions', () => {
    const client = { ...davide, payFrom: '2026-05-26' }
    const summary = summarizeClient(buildLedger(events, dataWith(client), window), client)
    expect(summary.due.map((s) => s.id)).toEqual(['cal:e2', 'cal:e3'])
    expect(summary).toMatchObject({ dueMinutes: 210, dueCents: 7000, unpaidBeforePayFrom: 1 })
  })

  it('leaves out paid and excluded sessions', () => {
    let data: DuetrackData = { ...dataWith(davide), overrides: { 'cal:e3': { excluded: true } } }
    data = recordPayment(data, { id: 'p1', clientId: 'davide', date: '2026-05-21' }, buildLedger([events[0]], data, window).sessions)
    const summary = summarizeClient(buildLedger(events, data, window), davide)
    expect(summary.due.map((s) => s.id)).toEqual(['cal:e2'])
  })

  it('counts sessions without a rate instead of treating them as free', () => {
    const client = { ...davide, rates: [{ from: '2026-06-01', centsPerHour: 2000 }] }
    const summary = summarizeClient(buildLedger(events, dataWith(client), window), client)
    expect(summary).toMatchObject({ dueCents: 4000, missingRate: 2 })
  })

  it('treats sessions before the tracking start as settled, unless payFrom goes further back', () => {
    const data = { ...dataWith(davide), settings: { ...emptyData().settings, trackFrom: '2026-06-01' } }
    const ledger = buildLedger(events, data, window)
    expect(summarizeClient(ledger, davide).due.map((s) => s.id)).toEqual(['cal:e3'])
    // Cecilia non è un cliente, ma il suo evento è dopo la data di partenza: da classificare.
    expect(ledger.unclassified.map((s) => s.id)).toEqual(['cal:e4'])

    const client = { ...davide, payFrom: '2026-05-26' }
    const earlier = buildLedger(events, { ...data, clients: [client] }, window)
    expect(summarizeClient(earlier, client).due.map((s) => s.id)).toEqual(['cal:e2', 'cal:e3'])
  })

  it('picks the oldest N due sessions', () => {
    const summary = summarizeClient(buildLedger(events, dataWith(davide), window), davide)
    expect(oldestDue(summary, 2).map((s) => s.id)).toEqual(['cal:e1', 'cal:e2'])
    expect(oldestDue(summary, 10)).toHaveLength(3)
  })
})
