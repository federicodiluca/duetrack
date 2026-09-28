import { describe, expect, it } from 'vitest'
import {
  ActionError,
  addAlias,
  addClient,
  addManualSession,
  assignSession,
  deleteClient,
  excludeSession,
  excludeTitle,
  recordPayment,
  removeManualSession,
  removeRate,
  setAmount,
  setOverride,
  setRate,
  setSessionNote,
  undoPayment,
  updateSettings,
} from './actions'
import { buildLedger, summarizeClient } from './ledger'
import { type Client, type DuetrackData, emptyData } from './model'
import { eventToSession } from './session'

const davide: Client = { id: 'davide', name: 'Davide', aliases: [], rates: [{ from: '2026-01-01', centsPerHour: 2000 }] }
const cecilia: Client = { id: 'cecilia', name: 'Cecilia', aliases: [], rates: [{ from: '2026-01-01', centsPerHour: 2500 }] }
const window = { from: new Date('2026-01-01T00:00:00Z'), to: new Date('2027-01-01T00:00:00Z') }

const events = ['2026-09-01', '2026-09-08', '2026-09-15'].map(
  (day, i) =>
    eventToSession({
      id: `e${i + 1}`,
      summary: 'Davide',
      start: { dateTime: `${day}T12:00:00Z` },
      end: { dateTime: `${day}T13:00:00Z` },
    })!,
)

function setup(): DuetrackData {
  return addClient(addClient(emptyData(), davide), cecilia)
}

const due = (data: DuetrackData) => summarizeClient(buildLedger(events, data, window), davide).due

describe('payments', () => {
  it('marks a block of sessions paid with a snapshot, and undoes it in one go', () => {
    let data = setup()
    data = recordPayment(data, { id: 'p1', clientId: 'davide', date: '2026-09-10' }, due(data).slice(0, 2))

    expect(data.payments[0].items).toEqual([
      { sessionId: 'cal:e1', start: '2026-09-01T12:00:00.000Z', durationMinutes: 60, amountCents: 2000 },
      { sessionId: 'cal:e2', start: '2026-09-08T12:00:00.000Z', durationMinutes: 60, amountCents: 2000 },
    ])
    expect(due(data).map((s) => s.id)).toEqual(['cal:e3'])

    data = undoPayment(data, 'p1')
    expect(due(data)).toHaveLength(3)
  })

  it('refuses sessions that are already paid or belong to someone else', () => {
    const data = recordPayment(setup(), { id: 'p1', clientId: 'davide', date: '2026-09-10' }, due(setup()).slice(0, 1))
    const ledger = buildLedger(events, data, window)
    expect(() => recordPayment(data, { id: 'p2', clientId: 'davide', date: '2026-09-11' }, ledger.sessions)).toThrow(ActionError)
    expect(() => recordPayment(data, { id: 'p2', clientId: 'cecilia', date: '2026-09-11' }, ledger.sessions.slice(1))).toThrow(
      ActionError,
    )
  })

  it('does not change the original object', () => {
    const data = setup()
    const frozen = structuredClone(data)
    recordPayment(data, { id: 'p1', clientId: 'davide', date: '2026-09-10' }, due(data))
    expect(data).toEqual(frozen)
  })
})

describe('overrides', () => {
  it('excludes and re-includes a session, dropping empty overrides', () => {
    let data = excludeSession(setup(), 'cal:e1')
    expect(due(data)).toHaveLength(2)
    data = excludeSession(data, 'cal:e1', false)
    expect(data.overrides).toEqual({})
    expect(due(data)).toHaveLength(3)
  })

  it('sets and clears a manual amount', () => {
    let data = setAmount(setup(), 'cal:e1', 1500)
    expect(due(data)[0].amountCents).toBe(1500)
    data = setAmount(data, 'cal:e1', undefined)
    expect(due(data)[0].amountCents).toBe(2000)
    expect(() => setAmount(data, 'cal:e1', 12.5)).toThrow(ActionError)
  })

  it('reassigns a session to another client', () => {
    const data = assignSession(setup(), 'cal:e1', 'cecilia')
    expect(due(data)).toHaveLength(2)
    expect(summarizeClient(buildLedger(events, data, window), cecilia).dueCents).toBe(2500)
  })
})

describe('manual sessions', () => {
  it('adds a session and refuses to remove it while it is paid', () => {
    let data = addManualSession(setup(), { id: 'm1', clientId: 'davide', start: '2026-09-20T12:00:00Z', durationMinutes: 60 })
    expect(due(data)).toHaveLength(4)

    const manual = due(data).find((s) => s.id === 'man:m1')!
    data = recordPayment(data, { id: 'p1', clientId: 'davide', date: '2026-09-21' }, [manual])
    expect(() => removeManualSession(data, 'm1')).toThrow(ActionError)

    data = removeManualSession(undoPayment(data, 'p1'), 'm1')
    expect(due(data)).toHaveLength(3)
  })
})

describe('clients', () => {
  it('adds an alias and refuses one that belongs to someone else', () => {
    let data = addAlias(setup(), 'cecilia', 'Cate')
    expect(data.clients.find((c) => c.id === 'cecilia')?.aliases).toEqual(['Cate'])
    expect(addAlias(data, 'cecilia', 'cate')).toBe(data)
    expect(() => addAlias(data, 'davide', 'Cate')).toThrow(ActionError)
    data = addAlias(data, 'davide', 'Dav')
    expect(data.clients.find((c) => c.id === 'davide')?.aliases).toEqual(['Dav'])
  })

  it('keeps rates sorted and replaces a rate with the same start date', () => {
    let data = setRate(setup(), 'davide', { from: '2026-09-01', centsPerHour: 2500 })
    data = setRate(data, 'davide', { from: '2026-09-01', centsPerHour: 2200 })
    expect(data.clients.find((c) => c.id === 'davide')?.rates).toEqual([
      { from: '2026-01-01', centsPerHour: 2000 },
      { from: '2026-09-01', centsPerHour: 2200 },
    ])
    data = removeRate(data, 'davide', '2026-01-01')
    expect(data.clients.find((c) => c.id === 'davide')?.rates).toHaveLength(1)
  })

  it('deletes a client without history and releases its assignments', () => {
    let data = assignSession(setup(), 'cal:e1', 'cecilia')
    data = deleteClient(data, 'cecilia')
    expect(data.clients.map((c) => c.id)).toEqual(['davide'])
    expect(data.overrides).toEqual({})
  })

  it('refuses to delete a client with payments', () => {
    const data = recordPayment(setup(), { id: 'p1', clientId: 'davide', date: '2026-09-10' }, due(setup()).slice(0, 1))
    expect(() => deleteClient(data, 'davide')).toThrow(ActionError)
  })
})

describe('settings', () => {
  const titled = events.map((e) => ({ ...e, title: `Ripetizioni ${e.title}`, key: `ripetizioni ${e.key}` }))

  it('ignores words in titles when matching clients', () => {
    expect(due(setup())).toHaveLength(3)
    expect(summarizeClient(buildLedger(titled, setup(), window), davide).due).toHaveLength(0)
    const data = updateSettings(setup(), { ignoredWords: ['ripetizioni'] })
    expect(summarizeClient(buildLedger(titled, data, window), davide).due).toHaveLength(3)
  })

  it('excludes whole titles, with explicit per-session exceptions', () => {
    let data = excludeTitle(updateSettings(setup(), { ignoredWords: ['ripetizioni'] }), 'davide')
    let ledger = buildLedger(titled, data, window)
    expect(ledger.excluded).toHaveLength(3)
    expect(summarizeClient(ledger, davide).due).toHaveLength(0)

    data = setOverride(data, 'cal:e1', { excluded: false })
    ledger = buildLedger(titled, data, window)
    expect(summarizeClient(ledger, davide).due.map((s) => s.id)).toEqual(['cal:e1'])

    data = excludeTitle(data, 'davide', false)
    expect(data.settings.excludedTitles).toEqual([])
  })
})

describe('notes', () => {
  it('sets, shows and clears a note on a calendar session', () => {
    let data = setSessionNote(setup(), 'cal:e1', '  fatta online ')
    expect(due(data)[0].note).toBe('fatta online')
    data = setSessionNote(data, 'cal:e1', '   ')
    expect(data.overrides).toEqual({})
    expect(due(data)[0].note).toBeUndefined()
  })

  it('shows the note of a manual session, and lets a new note replace it', () => {
    let data = addManualSession(setup(), { id: 'm1', clientId: 'davide', start: '2026-09-20T12:00:00Z', durationMinutes: 60, note: 'recupero' })
    expect(due(data).find((s) => s.id === 'man:m1')?.note).toBe('recupero')
    data = setSessionNote(data, 'man:m1', 'recupero di giugno')
    expect(due(data).find((s) => s.id === 'man:m1')?.note).toBe('recupero di giugno')
  })
})
