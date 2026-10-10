import { cn } from '@/lib/utils'

export interface Chip<T extends string> {
  value: T
  label: string
  count?: number
}

/**
 * Filtri a scelta singola, come pulsanti a pillola. Sul telefono la fila scorre di lato
 * invece di andare a capo: resta una riga sola sopra la lista.
 */
export function FilterChips<T extends string>({
  chips,
  value,
  onChange,
  label,
}: {
  chips: Chip<T>[]
  value: T
  onChange: (value: T) => void
  /** Nome del gruppo per i lettori di schermo. */
  label: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {chips.map((chip) => {
        const active = chip.value === value
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.value)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:h-9',
              active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {chip.label}
            {chip.count !== undefined && <span className={cn('tabular-nums', !active && 'text-muted-foreground/80')}>{chip.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
