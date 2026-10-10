import { describe, expect, it } from 'vitest'
import type { ClientSummary, LedgerSession } from '@/core/ledger'
import type { Client } from '@/core/model'
import { filterClients, sortClients } from './clientList'

const summary = (name: string, dueCents: number, extra: Partial<Client> = {}): ClientSummary => ({
  client: { id: name.toLowerCase(), name, aliases: [], rates: [], ...extra },
  unpaid: [],
  due: dueCents > 0 ? [{} as LedgerSession] : [],
  dueMinutes: 0,
  dueCents,
  missingRate: 0,
  unpaidBeforePayFrom: 0,
})

describe('clientList', () => {
  const luca = summary('Luca', 3000)
  const marta = summary('Marta', 0, { aliases: ['Martà Rossi'] })
  const giulia = summary('Giulia', 9000, { doubtful: true })
  const pietro = summary('Pietro', 6000)
  const all = [giulia, pietro, luca, marta]
  const none = new Set<string>()

  it('searches names and aliases, ignoring case and accents', () => {
    expect(filterClients(all, { query: 'rossi', filter: 'all', inactiveIds: none })).toEqual([marta])
    expect(filterClients(all, { query: 'MARTA', filter: 'all', inactiveIds: none })).toEqual([marta])
  })

  it('filters by group, keeping doubtful clients apart from those who will pay', () => {
    expect(filterClients(all, { query: '', filter: 'owing', inactiveIds: none })).toEqual([pietro, luca])
    expect(filterClients(all, { query: '', filter: 'doubtful', inactiveIds: none })).toEqual([giulia])
    expect(filterClients(all, { query: '', filter: 'settled', inactiveIds: none })).toEqual([marta])
    expect(filterClients(all, { query: '', filter: 'inactive', inactiveIds: new Set(['luca']) })).toEqual([luca])
  })

  it('sorts by amount both ways, by name and by last session', () => {
    const names = (list: ClientSummary[]) => list.map((s) => s.client.name)
    expect(names(sortClients(all, 'due-desc', new Map()))).toEqual(['Giulia', 'Pietro', 'Luca', 'Marta'])
    expect(names(sortClients(all, 'due-asc', new Map()))).toEqual(['Marta', 'Luca', 'Pietro', 'Giulia'])
    expect(names(sortClients(all, 'name', new Map()))).toEqual(['Giulia', 'Luca', 'Marta', 'Pietro'])
    const last = new Map([
      ['luca', '2026-09-20'],
      ['marta', '2026-10-01'],
    ])
    expect(names(sortClients(all, 'recent', last))).toEqual(['Marta', 'Luca', 'Giulia', 'Pietro'])
  })
})
