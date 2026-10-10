import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { SearchInput } from '@/components/SearchInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, selectTriggerClass } from '@/components/ui/select'
import { Sheet, SheetContent, SheetItem } from '@/components/ui/sheet'
import { titleKey } from '@/core/title'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/useMediaQuery'

export interface Choice {
  value: string
  label: ReactNode
  /** Il testo su cui cercare, se `label` non è una stringa. */
  text?: string
}

/** Oltre questo numero di voci il pannello mostra la ricerca. */
const SEARCH_FROM = 8

const searchText = (choice: Choice) => choice.text ?? (typeof choice.label === 'string' ? choice.label : '')

/** L'elenco del pannello, con la ricerca se le voci sono tante. Lo usa anche ActionMenu. */
export function ChoiceList({ choices, value, onChoose }: { choices: Choice[]; value?: string; onChoose: (value: string) => void }) {
  const [query, setQuery] = useState('')
  const q = titleKey(query)
  const visible = q ? choices.filter((c) => titleKey(searchText(c)).includes(q)) : choices

  return (
    <>
      {choices.length > SEARCH_FROM && (
        <div className="shrink-0 px-4 pb-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Cerca" />
        </div>
      )}
      <div role="listbox" className="grid overflow-y-auto overscroll-contain px-2 pb-3">
        {visible.map((c) => (
          <SheetItem key={c.value} role="option" aria-selected={c.value === value} onClick={() => onChoose(c.value)}>
            <span className="flex flex-1 items-center gap-2">{c.label}</span>
            {c.value === value && <CheckIcon className="text-primary" />}
          </SheetItem>
        ))}
        {visible.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">Nessun risultato per “{query}”.</p>}
      </div>
    </>
  )
}

interface PickerProps {
  /** Senza valore il Picker fa da comando: mostra sempre il segnaposto. */
  value?: string
  onValueChange: (value: string) => void
  choices: Choice[]
  /** Titolo del pannello sul telefono, e nome accessibile se non c'è un'etichetta. */
  title: string
  placeholder?: string
  id?: string
  labelled?: boolean
  size?: 'sm' | 'default'
  disabled?: boolean
  className?: string
}

/**
 * Una tendina: sul computer è il Select di Radix, sul telefono un pannello dal basso con
 * voci alte 48 px. Le tendine piccole e strette sono scomode da toccare, e con tanti
 * clienti serve poter cercare.
 */
export function Picker({ value, onValueChange, choices, title, placeholder, id, labelled, size = 'default', disabled, className }: PickerProps) {
  const mobile = useIsMobile()
  const [open, setOpen] = useState(false)
  // Con un <Label htmlFor> il nome viene da lì; altrimenti lo dà il titolo.
  const ariaLabel = labelled ? undefined : title

  if (!mobile) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} size={size} className={className} aria-label={ariaLabel}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {choices.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const current = choices.find((c) => c.value === value)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        id={id}
        data-size={size}
        data-placeholder={current ? undefined : ''}
        // Come un select: il nome dice anche cosa è scelto.
        aria-label={ariaLabel && `${ariaLabel}: ${current ? searchText(current) : (placeholder ?? '')}`}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(selectTriggerClass, className)}
      >
        <span data-slot="select-value">{current ? current.label : placeholder}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </button>
      {/* Niente focus automatico: sulla ricerca aprirebbe la tastiera, che copre metà elenco. */}
      <SheetContent title={title} onOpenAutoFocus={(e) => e.preventDefault()}>
        <ChoiceList
          choices={choices}
          value={value}
          onChoose={(v) => {
            setOpen(false)
            if (v !== value) onValueChange(v)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
