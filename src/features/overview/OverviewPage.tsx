import { AlertTriangle, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { ClientDialog } from '@/components/ClientDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/core/money'
import { formatDuration } from '@/core/session'
import { formatIsoDate, pluralize } from '@/lib/format'
import { useCalendar } from '@/state/calendar'
import { useData } from '@/state/data'

export function OverviewPage() {
  const { data } = useData()
  const { status, error, ledger, summaries } = useCalendar()
  const [, navigate] = useLocation()
  const [creating, setCreating] = useState(false)

  const owing = summaries.filter((s) => s.due.length > 0)
  const settled = summaries.filter((s) => s.due.length === 0)
  const totalCents = owing.reduce((sum, s) => sum + s.dueCents, 0)
  const unclassified = ledger.unclassified.length
  const unclassifiedTitles = new Set(ledger.unclassified.map((s) => s.key)).size

  return (
    <div className="grid gap-8">
      <section className="grid gap-1">
        <p className="text-sm font-medium text-muted-foreground">Da incassare</p>
        <p className="font-heading text-4xl font-semibold tabular-nums">{formatMoney(totalCents, data.currency)}</p>
        <p className="text-sm text-muted-foreground">
          {owing.length === 0 ? 'Nessuno ti deve niente.' : `${pluralize(owing.length, 'cliente', 'clienti')} con sessioni da pagare`}
        </p>
      </section>

      {status === 'error' && (
        <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
          Non riesco a leggere il calendario: {error}
        </p>
      )}

      {unclassified > 0 && (
        <Link
          to="/da-classificare"
          className="flex items-center gap-3 rounded-lg border border-brand/60 bg-brand/10 p-3 text-sm transition-colors hover:bg-brand/20"
        >
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1">
            {pluralize(unclassifiedTitles, 'titolo non riconosciuto', 'titoli non riconosciuti')} (
            {pluralize(unclassified, 'evento', 'eventi')}): assegnali a un cliente o escludili.
          </span>
          <ChevronRight className="size-4" />
        </Link>
      )}

      {ledger.anomalies.length > 0 && (
        <p className="rounded-lg border border-destructive/40 p-3 text-sm">
          {pluralize(ledger.anomalies.length, 'sessione già pagata è stata', 'sessioni già pagate sono state')} cancellate o
          modificate in calendario dopo il pagamento. Le trovi segnalate nella pagina del cliente.
        </p>
      )}

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">Clienti</h2>
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <Plus /> Nuovo cliente
          </Button>
        </div>

        {summaries.length === 0 && status !== 'loading' && (
          <p className="text-sm text-muted-foreground">
            Nessun cliente ancora. Li crei da{' '}
            <Link to="/da-classificare" className="underline underline-offset-4">
              Da classificare
            </Link>
            : ogni titolo del calendario diventa un cliente con un tocco.
          </p>
        )}

        <ul className="divide-y rounded-lg border bg-card">
          {[...owing, ...settled].map((s) => (
            <li key={s.client.id}>
              <Link to={`/clienti/${s.client.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50">
                <div className="grid flex-1 gap-0.5">
                  <span className="font-medium">{s.client.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {s.due.length === 0
                      ? 'Tutto pagato'
                      : `${pluralize(s.due.length, 'sessione', 'sessioni')} · ${formatDuration(s.dueMinutes)}`}
                    {s.client.payFrom && ` · da ${formatIsoDate(s.client.payFrom)}`}
                  </span>
                </div>
                {s.missingRate > 0 && <Badge variant="destructive">Tariffa mancante</Badge>}
                <span className={`font-semibold tabular-nums ${s.dueCents === 0 ? 'text-muted-foreground' : ''}`}>
                  {formatMoney(s.dueCents, data.currency)}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {creating && (
        <ClientDialog open onOpenChange={setCreating} onSaved={(client) => navigate(`/clienti/${client.id}`)} />
      )}
    </div>
  )
}
