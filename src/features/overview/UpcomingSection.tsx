import { useState } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import type { LedgerSession } from '@/core/ledger'
import { type Client, toIsoDate } from '@/core/model'
import { formatDuration } from '@/core/session'
import { formatTime, pluralize } from '@/lib/format'
import { upcomingDayLabel } from './upcoming'

// Sta sopra l'elenco dei clienti: abbastanza per i prossimi giorni, senza spingerlo troppo in basso.
const SHOWN_AT_FIRST = 5

/** Le sessioni in programma, per giorno: si vedono, ma non contano nel "da incassare". */
export function UpcomingSection({ upcoming, clients, weeks }: { upcoming: LedgerSession[]; clients: Client[]; weeks: number }) {
  const [showAll, setShowAll] = useState(false)
  const names = new Map(clients.map((c) => [c.id, c.name]))
  const shown = showAll ? upcoming : upcoming.slice(0, SHOWN_AT_FIRST)

  const days = new Map<string, LedgerSession[]>()
  for (const session of shown) days.set(session.date, [...(days.get(session.date) ?? []), session])
  const today = toIsoDate(new Date())

  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="font-heading text-lg font-semibold">Prossime sessioni</h2>
        <p className="text-sm text-muted-foreground">
          In programma nelle prossime {pluralize(weeks, 'settimana', 'settimane')}: entrano nel conto quando sono fatte.
        </p>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna sessione in calendario.</p>
      ) : (
        <div className="grid gap-3 rounded-lg border border-dashed p-3">
          {[...days].map(([date, sessions]) => (
            <div key={date} className="grid gap-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{upcomingDayLabel(date, today)}</p>
              <ul className="grid gap-1">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-baseline gap-3 text-sm">
                    <span className="w-11 shrink-0 text-muted-foreground tabular-nums">{formatTime(s.start)}</span>
                    {s.clientId ? (
                      <Link to={`/clienti/${s.clientId}`} className="flex-1 font-medium hover:underline">
                        {names.get(s.clientId)}
                      </Link>
                    ) : (
                      <span className="flex-1">
                        {s.title || 'Senza titolo'} <span className="text-muted-foreground">· non riconosciuto</span>
                      </span>
                    )}
                    <span className="text-muted-foreground">{formatDuration(s.durationMinutes)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {upcoming.length > SHOWN_AT_FIRST && (
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Mostra meno' : `Mostra tutte (${upcoming.length})`}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
