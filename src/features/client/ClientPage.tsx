import { ArrowLeft, EllipsisVertical, ListChecks, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'wouter'
import { toast } from 'sonner'
import { ClientDialog } from '@/components/ClientDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  assignSession,
  deleteClient,
  excludeSession,
  recordPayment,
  removeManualSession,
  setOverride,
  setPayFrom,
  undoPayment,
} from '@/core/actions'
import { type LedgerSession, rateAt } from '@/core/ledger'
import { type SessionId, toIsoDate } from '@/core/model'
import { formatMoney } from '@/core/money'
import { formatDuration } from '@/core/session'
import { formatDay, formatIsoDate, formatTime, pluralize } from '@/lib/format'
import { newId } from '@/lib/id'
import { useCalendar } from '@/state/calendar'
import { useData } from '@/state/data'
import { AmountDialog, ManualSessionDialog, PayOldestDialog, RatesDialog } from './dialogs'
import { SessionRow } from './SessionRow'

type OpenDialog =
  | { kind: 'edit' }
  | { kind: 'rates' }
  | { kind: 'manual' }
  | { kind: 'pay-oldest' }
  | { kind: 'delete' }
  | { kind: 'amount'; session: LedgerSession }
  | { kind: 'confirm-pay'; sessions: LedgerSession[] }
  | { kind: 'undo'; paymentId: string }

const sum = (sessions: LedgerSession[]) => sessions.reduce((total, s) => total + (s.amountCents ?? 0), 0)

export function ClientPage() {
  const { clientId } = useParams()
  const [, navigate] = useLocation()
  const { data, apply } = useData()
  const { ledger, summaries } = useCalendar()
  const [selected, setSelected] = useState<Set<SessionId>>(new Set())
  const [dialog, setDialog] = useState<OpenDialog>()

  const summary = summaries.find((s) => s.client.id === clientId)
  const payments = useMemo(
    () => data.payments.filter((p) => p.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date)),
    [data.payments, clientId],
  )

  if (!summary) {
    return (
      <p className="text-muted-foreground">
        Cliente non trovato. <Link to="/" className="underline underline-offset-4">Torna alla panoramica</Link>
      </p>
    )
  }

  const { client, due, dueCents, dueMinutes, unpaidBeforePayFrom } = summary
  const currentRate = rateAt(client, toIsoDate(new Date()))
  const otherClients = data.clients.filter((c) => c.id !== client.id)
  const excluded = ledger.excluded.filter((s) => s.clientId === client.id)
  const anomalies = ledger.anomalies.filter((a) => payments.some((p) => p.id === a.paymentId))
  const selectedSessions = due.filter((s) => selected.has(s.id))
  const allSelected = due.length > 0 && selectedSessions.length === due.length
  const close = () => setDialog(undefined)

  function pay(sessions: LedgerSession[]) {
    const id = newId()
    const done = apply((d) => recordPayment(d, { id, clientId: client.id, date: toIsoDate(new Date()) }, sessions))
    if (!done) return
    setSelected(new Set())
    close()
    toast.success(`${pluralize(sessions.length, 'sessione pagata', 'sessioni pagate')} · ${formatMoney(sum(sessions), data.currency)}`, {
      action: { label: 'Annulla', onClick: () => apply((d) => undoPayment(d, id)) },
    })
  }

  function toggle(id: SessionId, on: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function restore(session: LedgerSession) {
    // Esclusa a mano: si toglie la correzione. Esclusa per titolo: serve un'eccezione esplicita.
    apply((d) =>
      d.overrides[session.id]?.excluded ? excludeSession(d, session.id, false) : setOverride(d, session.id, { excluded: false }),
    )
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <Link to="/" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Tutti i clienti
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <h1 className="font-heading text-2xl font-semibold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              {currentRate === undefined ? 'Nessuna tariffa attuale' : `${formatMoney(currentRate, data.currency)}/h`}
              {client.aliases.length > 0 && ` · anche “${client.aliases.join('”, “')}”`}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Azioni sul cliente">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDialog({ kind: 'edit' })}>Modifica nome e alias</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog({ kind: 'rates' })}>Tariffe</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog({ kind: 'manual' })}>Aggiungi sessione a mano</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDialog({ kind: 'delete' })}>
                Elimina cliente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-1 rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Da pagare</p>
          <p className="font-heading text-3xl font-semibold tabular-nums">{formatMoney(dueCents, data.currency)}</p>
          <p className="text-sm text-muted-foreground">
            {pluralize(due.length, 'sessione', 'sessioni')} · {formatDuration(dueMinutes)}
          </p>
        </div>
      </div>

      <section className="grid gap-2">
        <Label htmlFor="pay-from">Pagare da</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="pay-from"
            type="date"
            value={client.payFrom ?? ''}
            onChange={(e) => apply((d) => setPayFrom(d, client.id, e.target.value || undefined))}
            className="w-fit"
          />
          {client.payFrom && (
            <Button variant="ghost" size="sm" onClick={() => apply((d) => setPayFrom(d, client.id, undefined))}>
              <X /> Mostra tutte
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {client.payFrom
            ? unpaidBeforePayFrom > 0
              ? `Nascoste ${pluralize(unpaidBeforePayFrom, 'sessione non pagata', 'sessioni non pagate')} prima del ${formatIsoDate(client.payFrom)}.`
              : `Mostro le sessioni dal ${formatIsoDate(client.payFrom)} in poi.`
            : 'Per chi paga dopo un periodo: imposta la data e vedi solo le sessioni da lì in poi.'}
          {client.payFrom && data.settings.trackFrom && client.payFrom < data.settings.trackFrom && (
            <>
              {' '}
              È prima della data di partenza ({formatIsoDate(data.settings.trackFrom)}): per {client.name} rileggo il calendario
              anche da lì.
            </>
          )}
        </p>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="bg-brand text-brand-foreground hover:bg-brand/85"
            disabled={selectedSessions.length === 0}
            onClick={() => setDialog({ kind: 'confirm-pay', sessions: selectedSessions })}
          >
            <ListChecks />
            {selectedSessions.length === 0
              ? 'Segna pagate'
              : `Segna pagate ${selectedSessions.length} · ${formatMoney(sum(selectedSessions), data.currency)}`}
          </Button>
          <Button variant="outline" disabled={due.length === 0} onClick={() => setDialog({ kind: 'pay-oldest' })}>
            Pagate N sessioni…
          </Button>
          <Button variant="ghost" onClick={() => setDialog({ kind: 'manual' })}>
            <Plus /> Sessione a mano
          </Button>
        </div>

        {due.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nessuna sessione da pagare.</p>
        ) : (
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 border-b px-3 py-2 text-sm text-muted-foreground">
              <Checkbox
                id="select-all"
                checked={allSelected ? true : selectedSessions.length > 0 ? 'indeterminate' : false}
                onCheckedChange={(checked) => setSelected(checked === true ? new Set(due.map((s) => s.id)) : new Set())}
              />
              <label htmlFor="select-all" className="cursor-pointer">
                Seleziona tutte
              </label>
            </div>
            <ul className="divide-y">
              {due.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  currency={data.currency}
                  selected={selected.has(session.id)}
                  onSelectedChange={(on) => toggle(session.id, on)}
                  otherClients={otherClients}
                  overridden={data.overrides[session.id]?.amountCents !== undefined}
                  actions={{
                    onPay: () => pay([session]),
                    onPayFrom: () => apply((d) => setPayFrom(d, client.id, session.date)),
                    onEditAmount: () => setDialog({ kind: 'amount', session }),
                    onExclude: () => apply((d) => excludeSession(d, session.id)),
                    onAssign: (id) => apply((d) => assignSession(d, session.id, id)),
                    onDeleteManual:
                      session.source === 'manual'
                        ? () => apply((d) => removeManualSession(d, session.id.slice('man:'.length)))
                        : undefined,
                  }}
                />
              ))}
            </ul>
          </div>
        )}
      </section>

      {anomalies.length > 0 && (
        <section className="grid gap-2 rounded-lg border border-destructive/40 p-4 text-sm">
          <h2 className="font-semibold">Da controllare</h2>
          <ul className="grid gap-1 text-muted-foreground">
            {anomalies.map((a) => (
              <li key={`${a.paymentId}-${a.sessionId}`}>
                {a.kind === 'paid-session-missing'
                  ? `La sessione del ${formatDay(new Date(a.start))} era pagata ma non c'è più in calendario.`
                  : `Una sessione pagata per ${formatDuration(a.paidMinutes)} ora dura ${formatDuration(a.currentMinutes)}.`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-3">
        <h2 className="font-heading text-lg font-semibold">Pagamenti</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun pagamento registrato.</p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {payments.map((payment) => {
              const total = payment.items.reduce((t, i) => t + i.amountCents, 0)
              const minutes = payment.items.reduce((t, i) => t + i.durationMinutes, 0)
              const starts = payment.items.map((i) => new Date(i.start)).sort((a, b) => a.getTime() - b.getTime())
              return (
                <li key={payment.id} className="flex items-center gap-3 p-3">
                  <div className="grid flex-1 gap-0.5">
                    <span className="font-medium">Il {formatIsoDate(payment.date)}</span>
                    <span className="text-sm text-muted-foreground">
                      {pluralize(payment.items.length, 'sessione', 'sessioni')} · {formatDuration(minutes)}
                      {starts.length > 1 && ` · dal ${formatDay(starts[0])} al ${formatDay(starts[starts.length - 1])}`}
                      {starts.length === 1 && ` · ${formatDay(starts[0])}`}
                    </span>
                  </div>
                  <span className="font-semibold text-paid tabular-nums">{formatMoney(total, data.currency)}</span>
                  <Button variant="ghost" size="sm" onClick={() => setDialog({ kind: 'undo', paymentId: payment.id })}>
                    Annulla
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {excluded.length > 0 && (
        <section className="grid gap-3">
          <h2 className="font-heading text-lg font-semibold">Escluse</h2>
          <ul className="divide-y rounded-lg border">
            {excluded.map((session) => (
              <li key={session.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="flex-1 text-muted-foreground">
                  {formatDay(session.start)} {formatTime(session.start)} · {formatDuration(session.durationMinutes)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => restore(session)}>
                  Ripristina
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dialog?.kind === 'edit' && <ClientDialog open onOpenChange={close} client={client} />}
      {dialog?.kind === 'rates' && <RatesDialog client={client} onOpenChange={close} />}
      {dialog?.kind === 'manual' && <ManualSessionDialog client={client} onOpenChange={close} />}
      {dialog?.kind === 'amount' && <AmountDialog session={dialog.session} onOpenChange={close} />}
      {dialog?.kind === 'pay-oldest' && <PayOldestDialog due={due} currency={data.currency} onPay={pay} onOpenChange={close} />}
      <ConfirmDialog
        open={dialog?.kind === 'confirm-pay'}
        onOpenChange={(open) => !open && close()}
        title="Segnare pagate?"
        description={
          dialog?.kind === 'confirm-pay' &&
          `${pluralize(dialog.sessions.length, 'sessione', 'sessioni')} di ${client.name}, ${formatMoney(sum(dialog.sessions), data.currency)}.`
        }
        confirmLabel="Segna pagate"
        onConfirm={() => dialog?.kind === 'confirm-pay' && pay(dialog.sessions)}
      />
      <ConfirmDialog
        open={dialog?.kind === 'undo'}
        onOpenChange={(open) => !open && close()}
        title="Annullare il pagamento?"
        description="Le sessioni di questo pagamento torneranno da pagare."
        confirmLabel="Annulla pagamento"
        destructive
        onConfirm={() => dialog?.kind === 'undo' && apply((d) => undoPayment(d, dialog.paymentId)) && close()}
      />
      <ConfirmDialog
        open={dialog?.kind === 'delete'}
        onOpenChange={(open) => !open && close()}
        title={`Eliminare ${client.name}?`}
        description="Le sue sessioni in calendario torneranno tra quelle da classificare. Un cliente con pagamenti registrati non si può eliminare."
        confirmLabel="Elimina"
        destructive
        onConfirm={() => {
          if (apply((d) => deleteClient(d, client.id))) navigate('/')
          else close()
        }}
      />
    </div>
  )
}
