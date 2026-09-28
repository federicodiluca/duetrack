import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { addClient, updateClient } from '@/core/actions'
import { type Client, SINCE_ALWAYS } from '@/core/model'
import { parseMoney } from '@/core/money'
import { newId } from '@/lib/id'
import { useData } from '@/state/data'

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Assente: si crea un nuovo cliente. */
  client?: Client
  /** Nome proposto per un nuovo cliente, es. il titolo di un evento da classificare. */
  suggestedName?: string
  onSaved?: (client: Client) => void
}

function splitAliases(text: string): string[] {
  return text
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
}

/** Crea o modifica nome e alias di un cliente; per un cliente nuovo chiede anche la tariffa. */
export function ClientDialog({ open, onOpenChange, client, suggestedName, onSaved }: ClientDialogProps) {
  const { apply } = useData()
  const [name, setName] = useState(client?.name ?? suggestedName ?? '')
  const [aliases, setAliases] = useState(client?.aliases.join(', ') ?? '')
  const [rate, setRate] = useState('')
  const [note, setNote] = useState(client?.note ?? '')
  const [error, setError] = useState<string>()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Il nome è obbligatorio')

    if (client) {
      const updated = { ...client, name: trimmed, aliases: splitAliases(aliases), note: note.trim() || undefined }
      if (apply((d) => updateClient(d, client.id, { name: updated.name, aliases: updated.aliases, note: updated.note }))) {
        onSaved?.(updated)
        onOpenChange(false)
      }
      return
    }

    const cents = parseMoney(rate)
    if (cents === undefined) return setError('Scrivi la tariffa oraria in euro, es. 25 o 22,50')
    const created: Client = {
      id: newId(),
      name: trimmed,
      aliases: splitAliases(aliases),
      rates: [{ from: SINCE_ALWAYS, centsPerHour: cents }],
      ...(note.trim() && { note: note.trim() }),
    }
    if (apply((d) => addClient(d, created))) {
      onSaved?.(created)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{client ? `Modifica ${client.name}` : 'Nuovo cliente'}</DialogTitle>
            <DialogDescription>
              Il nome deve corrispondere al titolo degli eventi in calendario. Se lo scrivi in più modi, aggiungili come alias.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="client-name">Nome</Label>
            <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-aliases">Alias (separati da virgola)</Label>
            <Input id="client-aliases" value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="es. Cate, Caterina B." />
          </div>
          {!client && (
            <div className="grid gap-2">
              <Label htmlFor="client-rate">Tariffa oraria (€)</Label>
              <Input id="client-rate" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="25" />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="client-note">Note (facoltative)</Label>
            <Textarea
              id="client-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="es. contatto del genitore, accordi sul pagamento"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit">{client ? 'Salva' : 'Crea cliente'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
