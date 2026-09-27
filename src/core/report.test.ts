import { describe, expect, it } from 'vitest'
import { recordPayment, setAmount } from './actions'
import { buildLedger } from './ledger'
import { type Client, type DuetrackData, emptyData } from './model'
import { buildReport, comparablePeriods, effectiveRate, monthlyTotals, percentChange, previousPeriod } from './report'
import { eventToSession, type Session } from './session'

function session(eventId: string, summary: string, day: string, minutes = 60): Session {
  const start = new Date(`${day}T12:00:00Z`)
  const end = new Date(start.getTime() + minutes * 60_000)
  return eventToSession({ id: eventId, summary, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } })!
}

const luca: Client = { id: 'luca', name: 'Luca', aliases: [], rates: [{ from: '2026-01-01', centsPerHour: 2500 }] }
const marta: Client = {
  id: 'marta',
  name: 'Marta',
  aliases: [],
  // Aumento da settembre: le sessioni di agosto restano a 20 €/h.
  rates: [
    { from: '2026-01-01', centsPerHour: 2000 },
    { from: '2026-09-01', centsPerHour: 2200 },
  ],
}

const events = [
  session('l1', 'Luca', '2026-08-20', 90),
  session('m1', 'Marta', '2026-08-25'),
  session('m2', 'Marta', '2026-09-03'),
  session('l2', 'Luca', '2026-09-10'),
  session('x1', 'Dentista', '2026-09-12'),
  session('l3', 'Luca', '2026-10-02'),
]
const window = { from: new Date('2026-01-01T00:00:00Z'), to: new Date('2027-01-01T00:00:00Z') }

function base(): DuetrackData {
  return { ...emptyData(), clients: [luca, marta], settings: { ...emptyData().settings, trackFrom: '2026-08-01' } }
}

describe('buildReport', () => {
  it('totals the work done in the period, with the rate in force each day', () => {
    const report = buildReport(buildLedger(events, base(), window), base(), '2026-08-01', '2026-09-30')
    expect(report.total).toMatchObject({ sessions: 4, minutes: 270, cents: 3750 + 2000 + 2200 + 2500 })
    expect(report.rows.map((r) => [r.client.id, r.cents])).toEqual([
      ['luca', 6250],
      ['marta', 4200],
    ])
    expect(report.unclassified).toBe(1)
  })

  it('includes both ends of the period', () => {
    const report = buildReport(buildLedger(events, base(), window), base(), '2026-08-25', '2026-09-03')
    expect(report.sessions.map((s) => s.id)).toEqual(['cal:m1', 'cal:m2'])
  })

  it('filters by client', () => {
    const report = buildReport(buildLedger(events, base(), window), base(), '2026-01-01', '2026-12-31', new Set(['marta']))
    expect(report.rows.map((r) => r.client.id)).toEqual(['marta'])
    expect(report.total.sessions).toBe(2)
    expect(report.unclassified).toBe(1)
  })

  it('splits settled and outstanding, and counts what was received in the period', () => {
    let data = base()
    const ledger = buildLedger(events, data, window)
    data = recordPayment(data, { id: 'p1', clientId: 'luca', date: '2026-10-05' }, ledger.sessions.filter((s) => s.id === 'cal:l1'))
    const report = buildReport(buildLedger(events, data, window), data, '2026-08-01', '2026-09-30')
    expect(report.total.settledCents).toBe(3750)
    expect(report.total.outstandingCents).toBe(2000 + 2200 + 2500)
    // Pagamento di ottobre: salda una sessione di agosto ma non è un incasso di agosto-settembre.
    expect(report.receivedCents).toBe(0)
    expect(buildReport(buildLedger(events, data, window), data, '2026-10-01', '2026-10-31').receivedCents).toBe(3750)
  })

  it('counts sessions before the tracking start as settled', () => {
    const data = { ...base(), settings: { ...base().settings, trackFrom: '2026-09-01' } }
    const report = buildReport(buildLedger(events, data, window), data, '2026-08-01', '2026-09-30')
    expect(report.total.settledCents).toBe(3750 + 2000)
  })

  it('uses manual amounts and reports sessions without a rate', () => {
    let data = setAmount(base(), 'cal:m1', 1500)
    data = { ...data, clients: [luca, { ...marta, rates: [{ from: '2026-09-01', centsPerHour: 2200 }] }] }
    const report = buildReport(buildLedger(events, data, window), data, '2026-08-01', '2026-09-30')
    const martaRow = report.rows.find((r) => r.client.id === 'marta')!
    expect(martaRow).toMatchObject({ cents: 1500 + 2200, missingRate: 0 })

    const noRate = { ...base(), clients: [luca, { ...marta, rates: [{ from: '2026-09-01', centsPerHour: 2200 }] }] }
    const report2 = buildReport(buildLedger(events, noRate, window), noRate, '2026-08-01', '2026-09-30')
    expect(report2.rows.find((r) => r.client.id === 'marta')).toMatchObject({ sessions: 2, cents: 2200, missingRate: 1 })
  })
})

describe('previousPeriod', () => {
  it('goes back by whole months and years', () => {
    expect(previousPeriod('2026-09-01', '2026-09-30')).toEqual({ from: '2026-08-01', to: '2026-08-31' })
    expect(previousPeriod('2026-03-01', '2026-03-31')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(previousPeriod('2026-01-01', '2026-12-31')).toEqual({ from: '2025-01-01', to: '2025-12-31' })
  })

  it('goes back by the same number of days otherwise', () => {
    expect(previousPeriod('2026-09-10', '2026-09-16')).toEqual({ from: '2026-09-03', to: '2026-09-09' })
  })
})

describe('comparablePeriods', () => {
  it('compares the elapsed part of an unfinished period with the same stretch before', () => {
    expect(comparablePeriods('2026-01-01', '2026-12-31', '2026-09-27')).toEqual({
      current: { from: '2026-01-01', to: '2026-09-27' },
      previous: { from: '2025-01-01', to: '2025-09-27' },
    })
    expect(comparablePeriods('2026-09-01', '2026-09-30', '2026-09-27')).toEqual({
      current: { from: '2026-09-01', to: '2026-09-27' },
      previous: { from: '2026-08-01', to: '2026-08-27' },
    })
  })

  it('compares whole periods once they are over', () => {
    expect(comparablePeriods('2026-08-01', '2026-08-31', '2026-09-27')).toEqual({
      current: { from: '2026-08-01', to: '2026-08-31' },
      previous: { from: '2026-07-01', to: '2026-07-31' },
    })
  })
})

describe('percentChange', () => {
  it('rounds and handles an empty previous period', () => {
    expect(percentChange(1120, 1000)).toBe(12)
    expect(percentChange(900, 1000)).toBe(-10)
    expect(percentChange(500, 0)).toBeUndefined()
  })
})

describe('effectiveRate', () => {
  it('divides the amount by the hours worked', () => {
    expect(effectiveRate({ cents: 3750, pricedMinutes: 90 })).toBe(2500)
    expect(effectiveRate({ cents: 0, pricedMinutes: 0 })).toBeUndefined()
  })

  it('ignores the hours of sessions without a rate', () => {
    const noRate = { ...base(), clients: [luca, { ...marta, rates: [{ from: '2026-09-01', centsPerHour: 2200 }] }] }
    const report = buildReport(buildLedger(events, noRate, window), noRate, '2026-08-25', '2026-09-03', new Set(['marta']))
    // Una sessione senza tariffa (agosto) e una a 22 €/h (settembre): la media resta 22.
    expect(report.total).toMatchObject({ minutes: 120, pricedMinutes: 60, missingRate: 1 })
    expect(effectiveRate(report.total)).toBe(2200)
  })
})

describe('monthlyTotals', () => {
  it('groups by month and keeps empty months', () => {
    const report = buildReport(buildLedger(events, base(), window), base(), '2026-07-01', '2026-09-30')
    expect(monthlyTotals(report, '2026-07-01', '2026-09-30')).toEqual([
      { month: '2026-07', sessions: 0, minutes: 0, cents: 0 },
      { month: '2026-08', sessions: 2, minutes: 150, cents: 5750 },
      { month: '2026-09', sessions: 2, minutes: 120, cents: 4700 },
    ])
  })
})
