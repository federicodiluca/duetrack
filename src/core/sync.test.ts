import { describe, expect, it } from 'vitest'
import { addClient, recordPayment } from './actions'
import { type Client, emptyData } from './model'
import { type Change, type LocalSyncState, isEmptyData, planSync, replayChanges } from './sync'

const clean: LocalSyncState = { dirty: false, baseVersion: '5', pendingChanges: 0, localIsEmpty: false }

describe('planSync', () => {
  it('creates the file when Drive has none', () => {
    expect(planSync(clean, null)).toBe('create')
  })

  it('does nothing or pushes when Drive is still at our version', () => {
    expect(planSync(clean, '5')).toBe('noop')
    expect(planSync({ ...clean, dirty: true, pendingChanges: 1 }, '5')).toBe('push')
  })

  it('adopts Drive when it moved on and nothing changed here', () => {
    expect(planSync(clean, '7')).toBe('adopt')
  })

  it('adopts Drive on a new device with nothing to lose', () => {
    expect(planSync({ dirty: true, pendingChanges: 2, localIsEmpty: true }, '7')).toBe('adopt')
  })

  it('replays known local changes when both sides moved on', () => {
    expect(planSync({ ...clean, dirty: true, pendingChanges: 2 }, '7')).toBe('replay')
  })

  it('asks the user when local changes cannot be replayed', () => {
    // Modifiche rimaste da una sessione precedente: non sappiamo più quali fossero.
    expect(planSync({ ...clean, dirty: true, pendingChanges: 0 }, '7')).toBe('conflict')
    // Dati locali usati prima della sincronizzazione, e un file già presente su Drive.
    expect(planSync({ dirty: true, pendingChanges: 3, localIsEmpty: false }, '7')).toBe('conflict')
  })
})

describe('replayChanges', () => {
  const luca: Client = { id: 'luca', name: 'Luca', aliases: [], rates: [] }
  const marta: Client = { id: 'marta', name: 'Marta', aliases: [], rates: [] }

  it('applies local changes on top of the remote data', () => {
    const remote = addClient(emptyData(), luca)
    const { data, rejected } = replayChanges(remote, [(d) => addClient(d, marta)])
    expect(data.clients.map((c) => c.id)).toEqual(['luca', 'marta'])
    expect(rejected).toBe(0)
  })

  it('drops changes that no longer apply, and keeps the rest', () => {
    // Luca creato su entrambi i dispositivi: il secondo addClient non ha più senso.
    const remote = addClient(emptyData(), luca)
    const changes: Change[] = [(d) => addClient(d, luca), (d) => addClient(d, marta)]
    const { data, rejected } = replayChanges(remote, changes)
    expect(data.clients.map((c) => c.id)).toEqual(['luca', 'marta'])
    expect(rejected).toBe(1)
  })

  it('does not swallow programming errors', () => {
    const broken: Change = () => {
      throw new TypeError('bug')
    }
    expect(() => replayChanges(emptyData(), [broken])).toThrow(TypeError)
  })
})

describe('isEmptyData', () => {
  it('is true only for data with nothing worth keeping', () => {
    expect(isEmptyData(emptyData())).toBe(true)
    expect(isEmptyData(addClient(emptyData(), { id: 'a', name: 'A', aliases: [], rates: [] }))).toBe(false)
    // Le impostazioni da sole non contano: un dispositivo nuovo le ha già compilate.
    expect(isEmptyData({ ...emptyData(), settings: { ...emptyData().settings, calendarId: 'x' } })).toBe(true)
  })

  it('counts payments', () => {
    const client: Client = { id: 'a', name: 'A', aliases: [], rates: [{ from: '0000-01-01', centsPerHour: 100 }] }
    const data = addClient(emptyData(), client)
    const withPayment = recordPayment(data, { id: 'p', clientId: 'a', date: '2026-01-01' }, [
      {
        id: 'cal:e',
        source: 'calendar',
        title: 'A',
        key: 'a',
        start: new Date('2026-01-01T12:00:00Z'),
        date: '2026-01-01',
        durationMinutes: 60,
        clientId: 'a',
        excluded: false,
        beforeTracking: false,
        amountCents: 100,
      },
    ])
    expect(isEmptyData({ ...withPayment, clients: [] })).toBe(false)
  })
})
