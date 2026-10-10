import { useState } from 'react'
import { ClientDialog } from '@/components/ClientDialog'
import { ClientAddIcon, SortIcon } from '@/components/icons'
import { Picker } from '@/components/Picker'
import { Button } from '@/components/ui/button'
import { addAlias, excludeTitle } from '@/core/actions'
import { formatDuration, groupByTitle, type SessionGroup } from '@/core/session'
import type { LedgerSession } from '@/core/ledger'
import { byName } from '@/core/model'
import { formatDay, pluralize } from '@/lib/format'
import { useCalendar } from '@/state/calendar'
import { useData } from '@/state/data'

function GroupCard({ group, onCreate }: { group: SessionGroup<LedgerSession>; onCreate: () => void }) {
  const { data, apply } = useData()
  const first = group.sessions[0]
  const last = group.sessions[group.sessions.length - 1]
  const ambiguous = first.match?.kind === 'ambiguous' ? first.match.clientIds : []
  const names = ambiguous.map((id) => data.clients.find((c) => c.id === id)?.name).filter(Boolean)
  const now = new Date()
  const planned = group.sessions.filter((s) => s.start > now).length

  return (
    <li className="grid gap-3 rounded-lg border bg-card p-4">
      <div className="grid gap-0.5">
        <span className="font-medium">{group.label || '(senza titolo)'}</span>
        <span className="text-sm text-muted-foreground">
          {pluralize(group.sessions.length, 'evento', 'eventi')} · {formatDuration(group.totalMinutes)} ·{' '}
          {group.sessions.length === 1 ? formatDay(first.start) : `dal ${formatDay(first.start)} al ${formatDay(last.start)}`}
          {planned > 0 &&
            (planned === group.sessions.length
              ? ' · in programma'
              : ` · di cui ${planned} in programma`)}
        </span>
        {names.length > 0 && (
          <span className="text-sm text-destructive">Corrisponde a più clienti: {names.join(', ')}. Rendi diversi nomi e alias.</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onCreate}>
          <ClientAddIcon /> Nuovo cliente
        </Button>
        {data.clients.length > 0 && (
          <Picker
            size="sm"
            title={`“${group.label || '(senza titolo)'}” è…`}
            placeholder="È un cliente esistente…"
            onValueChange={(clientId) => apply((d) => addAlias(d, clientId, group.label))}
            choices={[...data.clients].sort(byName).map((c) => ({ value: c.id, label: c.name }))}
          />
        )}
        <Button size="sm" variant="ghost" onClick={() => apply((d) => excludeTitle(d, group.key))}>
          Non sono sessioni
        </Button>
      </div>
    </li>
  )
}

export function UnclassifiedPage() {
  const { unclassified, status } = useCalendar()
  const [creatingFor, setCreatingFor] = useState<string>()
  const groups = groupByTitle(unclassified)

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="font-heading text-2xl font-semibold">Da classificare</h1>
        <p className="text-muted-foreground">
          Eventi del calendario che non corrispondono a nessun cliente, raggruppati per titolo, compresi quelli in programma:
          un cliente nuovo lo crei prima ancora della prima sessione. Una scelta vale anche per i prossimi eventi con lo stesso
          titolo.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-lg border border-dashed p-8 text-center">
          <SortIcon className="size-10 text-muted-foreground" />
          <p className="font-medium">{status === 'loading' ? 'Leggo il calendario…' : 'Tutto classificato'}</p>
          {status !== 'loading' && (
            <p className="text-sm text-muted-foreground">Ogni evento del calendario ha il suo cliente, o è escluso.</p>
          )}
        </div>
      ) : (
        <ul className="grid gap-3">
          {groups.map((group) => (
            <GroupCard key={group.key} group={group} onCreate={() => setCreatingFor(group.label)} />
          ))}
        </ul>
      )}

      {creatingFor !== undefined && (
        <ClientDialog
          open
          onOpenChange={(open) => !open && setCreatingFor(undefined)}
          suggestedName={creatingFor}
          fromTitle={creatingFor}
        />
      )}
    </div>
  )
}
