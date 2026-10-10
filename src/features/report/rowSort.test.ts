import { describe, expect, it } from 'vitest'
import type { ReportRow } from '@/core/report'
import { DEFAULT_ROW_SORT, nextRowSort, sortRows } from './rowSort'

const row = (name: string, cents: number, pricedMinutes: number, outstandingCents = 0): ReportRow => ({
  client: { id: name.toLowerCase(), name, aliases: [], rates: [] },
  sessions: 1,
  minutes: pricedMinutes,
  pricedMinutes,
  cents,
  settledCents: cents - outstandingCents,
  outstandingCents,
  missingRate: 0,
})

describe('rowSort', () => {
  const luca = row('Luca', 6000, 120, 3000) // 30 €/h
  const marta = row('Marta', 4000, 60) // 40 €/h
  const pietro = row('Pietro', 0, 0) // senza tariffa
  const rows = [marta, pietro, luca]
  const names = (list: ReportRow[]) => list.map((r) => r.client.name)

  it('sorts by amount, name and outstanding', () => {
    expect(names(sortRows(rows, DEFAULT_ROW_SORT))).toEqual(['Luca', 'Marta', 'Pietro'])
    expect(names(sortRows(rows, { key: 'name', dir: 'desc' }))).toEqual(['Pietro', 'Marta', 'Luca'])
    expect(names(sortRows(rows, { key: 'outstanding', dir: 'desc' }))).toEqual(['Luca', 'Marta', 'Pietro'])
  })

  it('keeps rows without an average rate last, both ways', () => {
    expect(names(sortRows(rows, { key: 'rate', dir: 'desc' }))).toEqual(['Marta', 'Luca', 'Pietro'])
    expect(names(sortRows(rows, { key: 'rate', dir: 'asc' }))).toEqual(['Luca', 'Marta', 'Pietro'])
  })

  it('flips the direction on the same column, starts sensibly on a new one', () => {
    expect(nextRowSort(DEFAULT_ROW_SORT, 'cents')).toEqual({ key: 'cents', dir: 'asc' })
    expect(nextRowSort(DEFAULT_ROW_SORT, 'name')).toEqual({ key: 'name', dir: 'asc' })
    expect(nextRowSort(DEFAULT_ROW_SORT, 'minutes')).toEqual({ key: 'minutes', dir: 'desc' })
  })
})
