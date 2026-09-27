import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { ExportIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buildLedger } from '@/core/ledger'
import { type IsoDate, toIsoDate } from '@/core/model'
import { formatMoney } from '@/core/money'
import { buildReport, isSettled, type ReportTotals } from '@/core/report'
import { formatDuration } from '@/core/session'
import { decimal, downloadFile, toCsv } from '@/lib/csv'
import { formatDay, formatIsoDate, formatTime, pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useData } from '@/state/data'
import { useCalendarRange } from '@/state/useCalendarRange'

interface Period {
  label: string
  from: IsoDate
  to: IsoDate
}

function presets(today = new Date()): Period[] {
  const y = today.getFullYear()
  const m = today.getMonth()
  const day = (year: number, month: number, date: number) => toIsoDate(new Date(year, month, date))
  return [
    { label: 'Questo mese', from: day(y, m, 1), to: day(y, m + 1, 0) },
    { label: 'Mese scorso', from: day(y, m - 1, 1), to: day(y, m, 0) },
    { label: 'Quest’anno', from: day(y, 0, 1), to: day(y, 11, 31) },
    { label: 'Anno scorso', from: day(y - 1, 0, 1), to: day(y - 1, 11, 31) },
  ]
}

function Figure({ label, value, detail, className }: { label: string; value: string; detail?: string; className?: string }) {
  return (
    <div className="grid content-start gap-0.5 rounded-lg border bg-card p-4">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={cn('font-heading text-2xl font-semibold tabular-nums', className)}>{value}</span>
      {detail && <span className="text-sm text-muted-foreground">{detail}</span>}
    </div>
  )
}

function hours(totals: ReportTotals) {
  return `${pluralize(totals.sessions, 'sessione', 'sessioni')} · ${formatDuration(totals.minutes)}`
}

export function ReportPage() {
  const { data } = useData()
  const periods = useMemo(() => presets(), [])
  const [from, setFrom] = useState(periods[0].from)
  const [to, setTo] = useState(periods[0].to)
  /** Clienti esclusi dal resoconto: vuoto = tutti inclusi, anche quelli creati dopo. */
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const validRange = from !== '' && to !== '' && from <= to
  const range = useCalendarRange(validRange ? from : undefined, validRange ? to : undefined)
  const ledger = useMemo(() => buildLedger(range.sessions, data, range.window), [range.sessions, range.window, data])
  const selected = useMemo(() => new Set(data.clients.filter((c) => !hidden.has(c.id)).map((c) => c.id)), [data.clients, hidden])
  const report = useMemo(() => buildReport(ledger, data, from, to, selected), [ledger, data, from, to, selected])
  const clients = new Map(data.clients.map((c) => [c.id, c]))
  const money = (cents: number) => formatMoney(cents, data.currency)

  function toggle(id: string, include: boolean) {
    setHidden((current) => {
      const next = new Set(current)
      if (include) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exportCsv() {
    const rows: (string | number)[][] = [['Data', 'Ora', 'Cliente', 'Ore', 'Importo (€)', 'Stato']]
    for (const s of report.sessions) {
      const client = clients.get(s.clientId!)!
      rows.push([
        formatIsoDate(s.date),
        formatTime(s.start),
        client.name,
        decimal(s.durationMinutes / 60),
        s.amountCents === undefined ? '' : decimal(s.amountCents / 100),
        isSettled(s, client) ? 'Saldata' : 'Da incassare',
      ])
    }
    downloadFile(`duetrack-${from}-${to}.csv`, toCsv(rows), 'text/csv;charset=utf-8')
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-1">
        <h1 className="font-heading text-2xl font-semibold">Resoconto</h1>
        <p className="text-muted-foreground">Quanto hai lavorato in un periodo, per tutti i clienti o solo per alcuni.</p>
      </div>

      <section className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <Button
              key={p.label}
              variant={p.from === from && p.to === to ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                setFrom(p.from)
                setTo(p.to)
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="grid gap-2">
            <Label htmlFor="report-from">Dal</Label>
            <Input id="report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-fit" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-to">Al</Label>
            <Input id="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-fit" />
          </div>
        </div>
        {!validRange && <p className="text-sm text-destructive">La data di inizio deve venire prima di quella di fine.</p>}

        {data.clients.length > 1 && (
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Clienti</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {data.clients.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={!hidden.has(c.id)} onCheckedChange={(on) => toggle(c.id, on === true)} />
                  {c.name}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" onClick={() => setHidden(new Set())}>
                Tutti
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setHidden(new Set(data.clients.map((c) => c.id)))}>
                Nessuno
              </Button>
            </div>
          </fieldset>
        )}
      </section>

      {range.status === 'error' && (
        <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
          Non riesco a leggere il calendario: {range.error}
        </p>
      )}

      <section className={cn('grid gap-4 transition-opacity', range.status === 'loading' && 'opacity-60')} aria-busy={range.status === 'loading'}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure label="Svolto" value={money(report.total.cents)} detail={hours(report.total)} />
          <Figure label="Di cui saldato" value={money(report.total.settledCents)} className="text-paid" />
          <Figure label="Di cui da incassare" value={money(report.total.outstandingCents)} />
        </div>
        <p className="text-sm text-muted-foreground">
          Incassato in questo periodo: <span className="font-medium text-foreground">{money(report.receivedCents)}</span>. Può
          essere diverso dal saldato: un pagamento di ottobre può saldare lezioni di settembre.
        </p>
        {report.total.missingRate > 0 && (
          <p className="text-sm text-destructive">
            {pluralize(report.total.missingRate, 'sessione senza tariffa esclusa', 'sessioni senza tariffa escluse')} dagli importi.
          </p>
        )}
        {report.unclassified > 0 && (
          <p className="text-sm text-muted-foreground">
            {pluralize(report.unclassified, 'evento del periodo non è', 'eventi del periodo non sono')} assegnati a un cliente:{' '}
            <Link to="/da-classificare" className="underline underline-offset-4">
              classificali
            </Link>{' '}
            per contarli.
          </p>
        )}

        {report.rows.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Cliente</th>
                  <th className="p-3 text-right font-medium">Sessioni</th>
                  <th className="p-3 text-right font-medium">Ore</th>
                  <th className="p-3 text-right font-medium">Svolto</th>
                  <th className="p-3 text-right font-medium">Da incassare</th>
                </tr>
              </thead>
              <tbody className="divide-y tabular-nums">
                {report.rows.map((row) => (
                  <tr key={row.client.id}>
                    <td className="p-3">
                      <Link to={`/clienti/${row.client.id}`} className="font-medium hover:underline">
                        {row.client.name}
                      </Link>
                    </td>
                    <td className="p-3 text-right">{row.sessions}</td>
                    <td className="p-3 text-right">{formatDuration(row.minutes)}</td>
                    <td className="p-3 text-right font-medium">{money(row.cents)}</td>
                    <td className="p-3 text-right">{row.outstandingCents > 0 ? money(row.outstandingCents) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {range.status === 'loading' ? 'Leggo il calendario…' : 'Nessuna sessione in questo periodo.'}
          </p>
        )}

        {report.sessions.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={exportCsv}>
              <ExportIcon /> Esporta le sessioni (CSV)
            </Button>
            <span className="text-sm text-muted-foreground">
              {formatDay(report.sessions[0].start)} – {formatDay(report.sessions[report.sessions.length - 1].start)}
            </span>
          </div>
        )}
      </section>
    </div>
  )
}
