// Ordine delle righe del resoconto: si sceglie toccando l'intestazione di una colonna.

import { effectiveRate, type ReportRow } from '@/core/report'

export type RowSortKey = 'name' | 'sessions' | 'minutes' | 'cents' | 'rate' | 'outstanding'
export type SortDir = 'asc' | 'desc'

export interface RowSort {
  key: RowSortKey
  dir: SortDir
}

/** Come arrivano dal resoconto: chi ha fruttato di più in cima. */
export const DEFAULT_ROW_SORT: RowSort = { key: 'cents', dir: 'desc' }

const numeric: Record<Exclude<RowSortKey, 'name'>, (row: ReportRow) => number> = {
  sessions: (r) => r.sessions,
  minutes: (r) => r.minutes,
  cents: (r) => r.cents,
  // Senza tariffa non c'è una media: in fondo, in entrambi i versi.
  rate: (r) => effectiveRate(r) ?? Number.NaN,
  outstanding: (r) => r.outstandingCents,
}

export function sortRows(rows: ReportRow[], { key, dir }: RowSort): ReportRow[] {
  const byName = (a: ReportRow, b: ReportRow) => a.client.name.localeCompare(b.client.name, 'it')
  if (key === 'name') return [...rows].sort((a, b) => (dir === 'asc' ? byName(a, b) : byName(b, a)))
  const value = numeric[key]
  return [...rows].sort((a, b) => {
    const [x, y] = [value(a), value(b)]
    if (Number.isNaN(x) || Number.isNaN(y)) return Number(Number.isNaN(x)) - Number(Number.isNaN(y)) || byName(a, b)
    return (dir === 'asc' ? x - y : y - x) || byName(a, b)
  })
}

/** Un tocco sulla stessa colonna inverte il verso; su un'altra parte dal verso più utile. */
export function nextRowSort(current: RowSort, key: RowSortKey): RowSort {
  if (current.key === key) return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
  return { key, dir: key === 'name' ? 'asc' : 'desc' }
}
