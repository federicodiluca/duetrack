import { CalendarClock, CircleSlash, EllipsisVertical, NotebookPen, PenLine, Trash2, UserRound } from 'lucide-react'
import { CalendarAddIcon, CoinCheckIcon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { LedgerSession } from '@/core/ledger'
import type { Client } from '@/core/model'
import { formatMoney } from '@/core/money'
import { formatDuration } from '@/core/session'
import { formatDay, formatTime } from '@/lib/format'

export interface SessionActions {
  onPay: () => void
  onPayFrom: () => void
  onEditAmount: () => void
  onEditNote: () => void
  onExclude: () => void
  onAssign: (clientId: string) => void
  onDeleteManual?: () => void
}

interface SessionRowProps {
  session: LedgerSession
  currency: string
  selected: boolean
  onSelectedChange: (selected: boolean) => void
  otherClients: Client[]
  overridden: boolean
  actions: SessionActions
}

export function SessionRow({ session, currency, selected, onSelectedChange, otherClients, overridden, actions }: SessionRowProps) {
  const checkboxId = `select-${session.id}`

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <Checkbox id={checkboxId} checked={selected} onCheckedChange={(checked) => onSelectedChange(checked === true)} />
      <label htmlFor={checkboxId} className="grid flex-1 cursor-pointer gap-0.5">
        <span className="font-medium">
          {formatDay(session.start)} <span className="font-normal text-muted-foreground">{formatTime(session.start)}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {formatDuration(session.durationMinutes)}
          {session.source === 'manual' && (
            <Badge variant="outline">
              <CalendarAddIcon /> a mano
            </Badge>
          )}
        </span>
        {session.note && <span className="text-sm text-muted-foreground italic">{session.note}</span>}
      </label>
      <span className="flex items-center gap-1.5 font-semibold tabular-nums">
        {overridden && <PenLine className="size-3.5 text-muted-foreground" aria-label="Importo corretto a mano" />}
        {session.amountCents === undefined ? (
          <Badge variant="destructive">Senza tariffa</Badge>
        ) : (
          formatMoney(session.amountCents, currency)
        )}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Azioni sulla sessione">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={actions.onPay} disabled={session.amountCents === undefined}>
            <CoinCheckIcon /> Segna pagata solo questa
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={actions.onPayFrom}>
            <CalendarClock /> Pagare da questa data
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={actions.onEditAmount}>
            <PenLine /> Correggi importo
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={actions.onEditNote}>
            <NotebookPen /> {session.note ? 'Modifica nota' : 'Aggiungi nota'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {otherClients.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <UserRound /> Assegna a…
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {otherClients.map((c) => (
                  <DropdownMenuItem key={c.id} onSelect={() => actions.onAssign(c.id)}>
                    {c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {actions.onDeleteManual ? (
            <DropdownMenuItem variant="destructive" onSelect={actions.onDeleteManual}>
              <Trash2 /> Elimina sessione
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" onSelect={actions.onExclude}>
              <CircleSlash /> Non era una sessione
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
