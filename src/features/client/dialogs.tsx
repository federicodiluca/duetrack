import { Copy, Share2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addManualSession, removeRate, setAmount, setRate, setSessionNote } from '@/core/actions'
import { Textarea } from '@/components/ui/textarea'
import type { ClientSummary, LedgerSession } from '@/core/ledger'
import { type Client, SINCE_ALWAYS, toIsoDate } from '@/core/model'
import { centsToInput, formatMoney, parseMoney } from '@/core/money'
import { formatDuration } from '@/core/session'
import { formatDay, formatIsoDate } from '@/lib/format'
import { newId } from '@/lib/id'
import { useData } from '@/state/data'
import { reminderText } from './reminder'

interface DialogProps {
  onOpenChange: (open: boolean) => void
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}

/** Importo concordato per una sessione, al posto di durata × tariffa. */
export function AmountDialog({ session, onOpenChange }: DialogProps & { session: LedgerSession }) {
  const { data, apply } = useData()
  const [value, setValue] = useState(centsToInput(session.amountCents ?? 0))
  const [error, setError] = useState<string>()
  const overridden = data.overrides[session.id]?.amountCents !== undefined

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const cents = parseMoney(value)
    if (cents === undefined) return setError('Scrivi un importo in euro, es. 30 o 27,50')
    if (apply((d) => setAmount(d, session.id, cents))) onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Correggi importo</DialogTitle>
            <DialogDescription>
              {formatDay(session.start)}, {formatDuration(session.durationMinutes)}.{' '}
              {session.computedCents !== undefined
                ? `Calcolato dalla tariffa: ${formatMoney(session.computedCents, data.currency)}.`
                : 'Nessuna tariffa valida per questa data.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="amount">Importo (€)</Label>
            <Input id="amount" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </div>
          <FormError message={error} />
          <DialogFooter>
            {overridden && (
              <Button
                type="button"
                variant="outline"
                onClick={() => apply((d) => setAmount(d, session.id, undefined)) && onOpenChange(false)}
              >
                Usa l’importo calcolato
              </Button>
            )}
            <Button type="submit">Salva</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Nota su una sessione, es. "fatta online" o "recupero". */
export function NoteDialog({ session, onOpenChange }: DialogProps & { session: LedgerSession }) {
  const { apply } = useData()
  const [value, setValue] = useState(session.note ?? '')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (apply((d) => setSessionNote(d, session.id, value))) onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Nota sulla sessione</DialogTitle>
            <DialogDescription>
              {formatDay(session.start)}, {formatDuration(session.durationMinutes)}. Resta in Duetrack: il calendario non viene
              modificato.
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="session-note" className="sr-only">
            Nota
          </Label>
          <Textarea id="session-note" value={value} onChange={(e) => setValue(e.target.value)} placeholder="es. fatta online, recupero" autoFocus />
          <DialogFooter>
            {session.note && (
              <Button type="button" variant="outline" onClick={() => apply((d) => setSessionNote(d, session.id, '')) && onOpenChange(false)}>
                Togli la nota
              </Button>
            )}
            <Button type="submit">Salva</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** "Pagate N lezioni": salda le N sessioni più vecchie tra quelle mostrate. */
export function PayOldestDialog({
  due,
  currency,
  onPay,
  onOpenChange,
}: DialogProps & { due: LedgerSession[]; currency: string; onPay: (sessions: LedgerSession[]) => void }) {
  const [count, setCount] = useState('1')
  const n = Math.min(Math.max(0, Math.trunc(Number(count)) || 0), due.length)
  const picked = due.slice(0, n)
  const total = picked.reduce((sum, s) => sum + (s.amountCents ?? 0), 0)
  const minutes = picked.reduce((sum, s) => sum + s.durationMinutes, 0)

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (n > 0) onPay(picked)
          }}
          className="grid gap-4"
        >
          <DialogHeader>
            <DialogTitle>Pagate N sessioni</DialogTitle>
            <DialogDescription>Segna pagate le sessioni più vecchie, nell’ordine in cui le vedi.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="pay-count">Quante sessioni</Label>
            <Input
              id="pay-count"
              type="number"
              min={1}
              max={due.length}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-28"
              autoFocus
            />
          </div>
          {n > 0 && (
            <p className="text-sm text-muted-foreground">
              Dal {formatDay(picked[0].start)} al {formatDay(picked[n - 1].start)}: {formatDuration(minutes)},{' '}
              <span className="font-semibold text-foreground">{formatMoney(total, currency)}</span>
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={n === 0}>
              Segna pagate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const DURATIONS = [30, 45, 60, 75, 90, 105, 120, 150, 180]

/** Una sessione fatta ma non in calendario. */
export function ManualSessionDialog({ client, onOpenChange }: DialogProps & { client: Client }) {
  const { apply } = useData()
  const [date, setDate] = useState(toIsoDate(new Date()))
  const [time, setTime] = useState('15:00')
  const [duration, setDuration] = useState('60')
  const [note, setNote] = useState('')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const start = new Date(`${date}T${time}`)
    const session = {
      id: newId(),
      clientId: client.id,
      start: start.toISOString(),
      durationMinutes: Number(duration),
      ...(note.trim() && { note: note.trim() }),
    }
    if (apply((d) => addManualSession(d, session))) onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Sessione a mano</DialogTitle>
            <DialogDescription>Per una sessione con {client.name} che non è in calendario.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-4">
            <div className="grid gap-2">
              <Label htmlFor="manual-date">Giorno</Label>
              <Input id="manual-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-time">Ora</Label>
              <Input id="manual-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manual-duration">Durata</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="manual-duration" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {formatDuration(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="manual-note">Nota (facoltativa)</Label>
            <Input id="manual-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="es. recupero" />
          </div>
          <DialogFooter>
            <Button type="submit">Aggiungi</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Il promemoria di pagamento: testo pronto da copiare o condividere (dal telefono apre il
 * menu di condivisione, quindi anche WhatsApp). Si può modificare prima di mandarlo.
 */
export function ReminderDialog({ summary, currency, onOpenChange }: DialogProps & { summary: ClientSummary; currency: string }) {
  const [text, setText] = useState(() => reminderText(summary, currency))
  const canShare = typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Promemoria copiato')
      onOpenChange(false)
    } catch {
      toast.error('Non riesco a copiare: seleziona il testo e copialo a mano')
    }
  }

  async function share() {
    try {
      await navigator.share({ text })
      onOpenChange(false)
    } catch (e) {
      // Chiudere il menu di condivisione non è un errore.
      if (!(e instanceof DOMException && e.name === 'AbortError')) toast.error('Condivisione non riuscita')
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promemoria per {summary.client.name}</DialogTitle>
          <DialogDescription>Il riepilogo delle sessioni da saldare. Modificalo come preferisci prima di mandarlo.</DialogDescription>
        </DialogHeader>
        <Label htmlFor="reminder-text" className="sr-only">
          Testo del promemoria
        </Label>
        <Textarea id="reminder-text" value={text} onChange={(e) => setText(e.target.value)} className="max-h-80 font-mono text-sm" />
        <DialogFooter>
          {canShare && (
            <Button variant="outline" onClick={share}>
              <Share2 /> Condividi
            </Button>
          )}
          <Button onClick={copy}>
            <Copy /> Copia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Storico delle tariffe: ognuna vale dalla sua data fino alla successiva. */
export function RatesDialog({ client, onOpenChange }: DialogProps & { client: Client }) {
  const { data, apply } = useData()
  const [amount, setAmountText] = useState('')
  const [from, setFrom] = useState(toIsoDate(new Date()))
  const [error, setError] = useState<string>()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const cents = parseMoney(amount)
    if (cents === undefined) return setError('Scrivi la tariffa oraria in euro, es. 25')
    if (apply((d) => setRate(d, client.id, { from, centsPerHour: cents }))) {
      setAmountText('')
      setError(undefined)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tariffe di {client.name}</DialogTitle>
          <DialogDescription>
            Un aumento vale dalla sua data in poi: le sessioni precedenti mantengono la tariffa di allora.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y rounded-lg border">
          {client.rates.length === 0 && <li className="p-3 text-sm text-muted-foreground">Nessuna tariffa.</li>}
          {client.rates.map((rate) => (
            <li key={rate.from} className="flex items-center gap-3 p-3 text-sm">
              <span className="flex-1">{rate.from === SINCE_ALWAYS ? 'Da sempre' : `Dal ${formatIsoDate(rate.from)}`}</span>
              <span className="font-medium tabular-nums">{formatMoney(rate.centsPerHour, data.currency)}/h</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Elimina tariffa"
                onClick={() => apply((d) => removeRate(d, client.id, rate.from))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
        <form onSubmit={submit} className="grid gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-2">
              <Label htmlFor="rate-amount">Nuova tariffa (€/h)</Label>
              <Input id="rate-amount" inputMode="decimal" value={amount} onChange={(e) => setAmountText(e.target.value)} className="w-28" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate-from">Valida dal</Label>
              <Input id="rate-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
            </div>
            <Button type="submit" variant="outline">
              Aggiungi
            </Button>
          </div>
          <FormError message={error} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
