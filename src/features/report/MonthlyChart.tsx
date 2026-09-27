import { useState } from 'react'
import { formatMoney } from '@/core/money'
import type { MonthTotals } from '@/core/report'
import { formatDuration } from '@/core/session'
import { cn } from '@/lib/utils'

const monthName = new Intl.DateTimeFormat('it-IT', { month: 'short' })
const monthLong = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' })

function toDate(month: string) {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

/** Tre linee di griglia su valori "tondi": 0, metà e il massimo arrotondato per eccesso. */
function niceMax(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value)!
  return step * magnitude
}

/**
 * Importo svolto mese per mese. Una sola serie, quindi niente legenda: il titolo la nomina.
 * Barre sottili con l'estremo arrotondato, griglia tenue, valore esatto al passaggio del
 * mouse o al tocco, e una tabella nascosta per chi usa uno screen reader.
 */
export function MonthlyChart({ months, currency }: { months: MonthTotals[]; currency: string }) {
  const [active, setActive] = useState<number>()
  const max = niceMax(Math.max(...months.map((m) => m.cents)))
  const money = (cents: number) => formatMoney(cents, currency)
  const shown = active === undefined ? undefined : months[active]

  return (
    <figure className="grid gap-3 rounded-lg border bg-card p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">Svolto mese per mese</span>
        <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {shown
            ? `${monthLong.format(toDate(shown.month))}: ${money(shown.cents)} · ${formatDuration(shown.minutes)}`
            : 'Tocca una barra per il dettaglio'}
        </span>
      </figcaption>

      <div className="relative h-44" aria-hidden="true">
        {[1, 0.5].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-dashed border-border" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -top-2.5 right-0 bg-card pl-1 text-[11px] text-muted-foreground tabular-nums">
              {money(max * f).replace(',00', '')}
            </span>
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 border-t border-border" />
        <div className="absolute inset-0 right-12 flex items-end gap-0.5">
          {months.map((m, i) => (
            <button
              key={m.month}
              type="button"
              tabIndex={-1}
              className="group flex h-full flex-1 items-end"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(undefined)}
              onClick={() => setActive(active === i ? undefined : i)}
            >
              <span
                className={cn(
                  'mx-auto w-full max-w-10 rounded-t-[4px] bg-primary transition-opacity',
                  active !== undefined && active !== i && 'opacity-40',
                )}
                style={{ height: `${(m.cents / max) * 100}%`, minHeight: m.cents > 0 ? 2 : 0 }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-0.5 pr-12 text-center text-[11px] text-muted-foreground" aria-hidden="true">
        {months.map((m, i) => (
          <span key={m.month} className={cn('flex-1', active === i && 'font-medium text-foreground')}>
            {months.length > 14 && i % 2 === 1 ? null : (
              <>
                {/* Sul telefono dodici etichette da tre lettere non ci stanno: basta l'iniziale. */}
                <span className="sm:hidden">{monthName.format(toDate(m.month)).charAt(0).toUpperCase()}</span>
                <span className="hidden sm:inline">{monthName.format(toDate(m.month))}</span>
              </>
            )}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Svolto mese per mese</caption>
        <thead>
          <tr>
            <th>Mese</th>
            <th>Ore</th>
            <th>Importo</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <td>{monthLong.format(toDate(m.month))}</td>
              <td>{formatDuration(m.minutes)}</td>
              <td>{money(m.cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
