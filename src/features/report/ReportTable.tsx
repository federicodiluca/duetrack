import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'wouter'
import { Picker } from '@/components/Picker'
import { formatMoney } from '@/core/money'
import { effectiveRate, type ReportRow } from '@/core/report'
import { formatDuration } from '@/core/session'
import { pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DEFAULT_ROW_SORT, nextRowSort, type RowSort, type RowSortKey, sortRows } from './rowSort'

const LABELS: Record<RowSortKey, string> = {
  name: 'Cliente',
  sessions: 'Sessioni',
  minutes: 'Ore',
  cents: 'Svolto',
  rate: '€/h medi',
  outstanding: 'Da incassare',
}

/** Le righe del resoconto: una tabella ordinabile sul computer, una scheda per cliente sul telefono. */
export function ReportTable({ rows, currency }: { rows: ReportRow[]; currency: string }) {
  const [sort, setSort] = useState<RowSort>(DEFAULT_ROW_SORT)
  const sorted = sortRows(rows, sort)
  const money = (cents: number) => formatMoney(cents, currency)
  const rate = (row: ReportRow) => {
    const r = effectiveRate(row)
    return r === undefined ? '—' : money(r)
  }

  // Una funzione e non un componente: definito qui dentro, React lo rimonterebbe a ogni render.
  function header(column: RowSortKey) {
    const active = sort.key === column
    const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
    return (
      <th
        key={column}
        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
        className={cn('p-0 font-medium', column === 'name' ? 'text-left' : 'text-right')}
      >
        <button
          type="button"
          onClick={() => setSort((s) => nextRowSort(s, column))}
          className={cn(
            'inline-flex w-full items-center gap-1 p-3 transition-colors hover:text-foreground',
            column !== 'name' && 'justify-end',
            active && 'text-foreground',
          )}
        >
          {LABELS[column]}
          <Icon className={cn('size-3.5', !active && 'opacity-40')} aria-hidden />
        </button>
      </th>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border bg-card sm:block">
        <table className="w-full text-sm">
          <thead className="border-b text-muted-foreground">
            <tr>
              {(['name', 'sessions', 'minutes', 'cents', 'rate', 'outstanding'] as const).map(header)}
            </tr>
          </thead>
          <tbody className="divide-y tabular-nums">
            {sorted.map((row) => (
              <tr key={row.client.id}>
                <td className="p-3">
                  <Link to={`/clienti/${row.client.id}`} className="font-medium hover:underline">
                    {row.client.name}
                  </Link>
                </td>
                <td className="p-3 text-right">{row.sessions}</td>
                <td className="p-3 text-right">{formatDuration(row.minutes)}</td>
                <td className="p-3 text-right font-medium">{money(row.cents)}</td>
                <td className="p-3 text-right">{rate(row)}</td>
                <td className="p-3 text-right">{row.outstandingCents > 0 ? money(row.outstandingCents) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sul telefono sei colonne non ci stanno: ogni cliente è una scheda, e l'ordine si sceglie a parte. */}
      <div className="grid gap-3 sm:hidden">
        {rows.length > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Ordina per
            <Picker
              title="Ordina per"
              value={sort.key}
              onValueChange={(key) => setSort({ key: key as RowSortKey, dir: key === 'name' ? 'asc' : 'desc' })}
              choices={(['cents', 'outstanding', 'minutes', 'sessions', 'rate', 'name'] as const).map((k) => ({
                value: k,
                label: LABELS[k],
              }))}
            />
          </div>
        )}
        <ul className="divide-y rounded-lg border bg-card">
          {sorted.map((row) => (
            <li key={row.client.id}>
              <Link to={`/clienti/${row.client.id}`} className="grid gap-1 p-3 tabular-nums active:bg-muted/50">
                <span className="flex items-center gap-2">
                  <span className="flex-1 truncate font-medium">{row.client.name}</span>
                  <span className="font-semibold">{money(row.cents)}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </span>
                <span className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                  <span>{pluralize(row.sessions, 'sessione', 'sessioni')}</span>
                  <span>{formatDuration(row.minutes)}</span>
                  {effectiveRate(row) !== undefined && <span>{rate(row)}/h</span>}
                  {row.outstandingCents > 0 && <span className="text-foreground">{money(row.outstandingCents)} da incassare</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
