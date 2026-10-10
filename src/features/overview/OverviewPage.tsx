import { AlertTriangle, ChevronRight } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { ClientDialog } from '@/components/ClientDialog'
import { FilterChips } from '@/components/FilterChips'
import { ClientAddIcon } from '@/components/icons'
import { Picker } from '@/components/Picker'
import { SearchInput } from '@/components/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type InactiveClient, inactiveClients, lastSessionDates } from '@/core/activity'
import type { ClientSummary } from '@/core/ledger'
import { toIsoDate } from '@/core/model'
import { formatMoney } from '@/core/money'
import { formatDuration } from '@/core/session'
import { formatIsoDate, pluralize } from '@/lib/format'
import { useCalendar } from '@/state/calendar'
import { useData } from '@/state/data'
import { CLIENT_SORTS, type ClientFilter, type ClientSort, clientGroup, filterClients, sortClients } from './clientList'
import { UpcomingSection } from './UpcomingSection'

export function OverviewPage() {
  const { data } = useData()
  const { status, error, ledger, summaries, upcoming, unclassified: unclassifiedSessions } = useCalendar()
  const [, navigate] = useLocation()
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<ClientSort>('due-desc')
  const [filter, setFilter] = useState<ClientFilter>('all')

  const lastDates = useMemo(() => lastSessionDates(ledger), [ledger])
  const inactiveAfterDays = data.settings.inactiveAfterDays
  const inactive = useMemo(
    () => (inactiveAfterDays > 0 ? inactiveClients(data.clients, lastDates, toIsoDate(new Date()), inactiveAfterDays) : []),
    [data.clients, lastDates, inactiveAfterDays],
  )
  const inactiveById = useMemo(() => new Map(inactive.map((i) => [i.client.id, i])), [inactive])
  const inactiveIds = useMemo(() => new Set(inactiveById.keys()), [inactiveById])

  // Gruppi chiusi all'inizio: in vista resta chi deve pagare, il resto a un tocco.
  const [showSettled, setShowSettled] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  // I difficili da incassare stanno fuori dal totale: in alto si vede quello che arriverà davvero.
  const owing = summaries.filter((s) => s.due.length > 0 && !s.client.doubtful)
  const doubtful = summaries.filter((s) => s.due.length > 0 && s.client.doubtful)
  const totalCents = owing.reduce((sum, s) => sum + s.dueCents, 0)
  const doubtfulCents = doubtful.reduce((sum, s) => sum + s.dueCents, 0)
  const unclassified = unclassifiedSessions.length
  const unclassifiedTitles = new Set(unclassifiedSessions.map((s) => s.key)).size

  // Prima la ricerca, che vale per tutti i gruppi e per i numeri sui filtri; poi il filtro.
  const matching = useMemo(
    () => sortClients(filterClients(summaries, { query, filter: 'all', inactiveIds }), sort, lastDates),
    [summaries, query, inactiveIds, sort, lastDates],
  )
  const only = (group: ClientFilter) => filterClients(matching, { query: '', filter: group, inactiveIds })
  const visible = only(filter)

  const chips = [
    { value: 'all' as const, label: 'Tutti', count: matching.length },
    { value: 'owing' as const, label: 'Da pagare', count: only('owing').length },
    doubtful.length > 0 && { value: 'doubtful' as const, label: 'Difficili', count: only('doubtful').length },
    { value: 'settled' as const, label: 'Tutto pagato', count: only('settled').length },
    inactive.length > 0 && { value: 'inactive' as const, label: 'Non li vedi da un po’', count: only('inactive').length },
  ].filter((c) => c !== false)

  const visibleOwing = visible.filter((s) => clientGroup(s) === 'owing')
  const visibleDoubtful = visible.filter((s) => clientGroup(s) === 'doubtful')
  const visibleSettled = visible.filter((s) => clientGroup(s) === 'settled')
  const visibleInactive = inactive.filter((i) => matching.some((s) => s.client.id === i.client.id))
  // Chi cerca un cliente lo vuole vedere, anche se ha già pagato tutto.
  const settledOpen = showSettled || query !== ''

  const describeInactive = (i: InactiveClient) =>
    i.lastSession
      ? `ultima sessione ${formatIsoDate(i.lastSession)}, ${i.days} giorni fa`
      : data.settings.trackFrom
        ? `nessuna sessione dal ${formatIsoDate(data.settings.trackFrom)}`
        : 'nessuna sessione'

  return (
    <div className="grid gap-8">
      <section className="grid gap-1">
        <p className="text-sm font-medium text-muted-foreground">Da incassare</p>
        <p className="font-heading text-4xl font-semibold tabular-nums">{formatMoney(totalCents, data.currency)}</p>
        <p className="text-sm text-muted-foreground">
          {owing.length === 0
            ? 'Nessuno ti deve niente.'
            : `${pluralize(owing.length, 'cliente', 'clienti')} con sessioni da pagare`}
        </p>
        {doubtful.length > 0 && (
          <p className="text-sm text-muted-foreground">
            In più {formatMoney(doubtfulCents, data.currency)} difficili da incassare (
            {pluralize(doubtful.length, 'cliente', 'clienti')}).
          </p>
        )}
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

      {data.settings.upcomingWeeks > 0 && summaries.length > 0 && (
        <UpcomingSection upcoming={upcoming} clients={data.clients} weeks={data.settings.upcomingWeeks} />
      )}

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">Clienti</h2>
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <ClientAddIcon /> Nuovo cliente
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

        {summaries.length > 1 && (
          <div className="grid gap-3">
            <div className="flex gap-2">
              <SearchInput value={query} onChange={setQuery} placeholder="Cerca un cliente" className="min-w-0 flex-1" />
              <Picker
                title="Ordina i clienti"
                value={sort}
                onValueChange={(v) => setSort(v as ClientSort)}
                choices={(Object.keys(CLIENT_SORTS) as ClientSort[]).map((s) => ({ value: s, label: CLIENT_SORTS[s] }))}
                className="shrink-0"
              />
            </div>
            <FilterChips label="Mostra" chips={chips} value={filter} onChange={setFilter} />
          </div>
        )}

        {visible.length === 0 ? (
          summaries.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {query ? `Nessun cliente corrisponde a “${query}”.` : 'Nessun cliente in questo gruppo.'}
            </p>
          )
        ) : filter !== 'all' ? (
          // Un gruppo scelto con i filtri: una lista sola, già aperta.
          <ul className="divide-y rounded-lg border bg-card">
            {visible.map((s) => {
              const away = inactiveById.get(s.client.id)
              return (
                <ClientRow
                  key={s.client.id}
                  summary={s}
                  currency={data.currency}
                  detail={filter === 'inactive' && away ? describeInactive(away) : undefined}
                />
              )
            })}
          </ul>
        ) : (
          <div className="grid gap-4">
            {visibleOwing.length > 0 && (
              <ul className="divide-y rounded-lg border bg-card">
                {visibleOwing.map((s) => (
                  <ClientRow key={s.client.id} summary={s} currency={data.currency} />
                ))}
              </ul>
            )}

            {visibleDoubtful.length > 0 && (
              <div className="grid gap-2 rounded-lg border border-brand/60 bg-brand/10 p-2">
                <div className="flex items-center gap-2 px-1 pt-1 text-sm">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span className="font-medium">Difficili da incassare</span>
                  <span className="text-muted-foreground">· fuori dal totale</span>
                </div>
                <ul className="divide-y rounded-md border bg-card">
                  {visibleDoubtful.map((s) => (
                    <ClientRow key={s.client.id} summary={s} currency={data.currency} />
                  ))}
                </ul>
              </div>
            )}

            {visibleSettled.length > 0 && (
              <Disclosure
                label={`Tutto pagato · ${pluralize(visibleSettled.length, 'cliente', 'clienti')}`}
                open={settledOpen}
                onToggle={() => setShowSettled((v) => !v)}
              >
                <ul className="divide-y rounded-lg border bg-card">
                  {visibleSettled.map((s) => (
                    <ClientRow key={s.client.id} summary={s} currency={data.currency} />
                  ))}
                </ul>
              </Disclosure>
            )}
          </div>
        )}
      </section>

      {filter === 'all' && visibleInactive.length > 0 && (
        <Disclosure
          label={`Da un po’ non li vedi · ${pluralize(visibleInactive.length, 'cliente', 'clienti')}`}
          open={showInactive}
          onToggle={() => setShowInactive((v) => !v)}
        >
          <p className="text-sm text-muted-foreground">Nessuna sessione da almeno {inactiveAfterDays} giorni.</p>
          <ul className="divide-y rounded-lg border">
            {visibleInactive.map((i) => (
              <li key={i.client.id}>
                <Link
                  to={`/clienti/${i.client.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-0.5 p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="flex-1 font-medium">{i.client.name}</span>
                  <span className="text-muted-foreground">{describeInactive(i)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Disclosure>
      )}

      {creating && <ClientDialog open onOpenChange={setCreating} onSaved={(client) => navigate(`/clienti/${client.id}`)} />}
    </div>
  )
}

function ClientRow({ summary: s, currency, detail }: { summary: ClientSummary; currency: string; detail?: string }) {
  return (
    <li>
      <Link to={`/clienti/${s.client.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate font-medium">{s.client.name}</span>
          <span className="text-sm text-muted-foreground">
            {detail ??
              (s.due.length === 0
                ? 'Tutto pagato'
                : `${pluralize(s.due.length, 'sessione', 'sessioni')} · ${formatDuration(s.dueMinutes)}`)}
            {!detail && s.client.payFrom && ` · da ${formatIsoDate(s.client.payFrom)}`}
          </span>
        </div>
        {s.missingRate > 0 && <Badge variant="destructive">Tariffa mancante</Badge>}
        <span className={`font-semibold tabular-nums ${s.dueCents === 0 ? 'text-muted-foreground' : ''}`}>
          {formatMoney(s.dueCents, currency)}
        </span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>
    </li>
  )
}

/** Un gruppo che si apre e chiude con la freccetta. */
function Disclosure({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:py-2"
      >
        <ChevronRight className={`size-4 transition-transform ${open ? 'rotate-90' : ''}`} />
        {label}
      </button>
      {open && children}
    </div>
  )
}
