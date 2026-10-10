import { ArrowLeft, ChevronRight } from 'lucide-react'
import { type ReactElement, type ReactNode, useRef, useState } from 'react'
import { Slot } from 'radix-ui'
import { type Choice, ChoiceList } from '@/components/Picker'
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
import { Sheet, SheetContent, SheetItem } from '@/components/ui/sheet'
import { useIsMobile } from '@/lib/useMediaQuery'

export type MenuEntry =
  | { label: ReactNode; icon?: ReactNode; onSelect: () => void; disabled?: boolean; destructive?: boolean }
  /** Una voce che apre un elenco in cui scegliere, come "Assegna a…". */
  | { label: ReactNode; icon?: ReactNode; choices: Choice[]; onChoose: (value: string) => void }
  | 'separator'

interface ActionMenuProps {
  /** Il pulsante che apre il menu. */
  trigger: ReactElement
  /** Titolo del pannello sul telefono. */
  title: string
  /** `false` e `undefined` si saltano, per le voci condizionali. */
  entries: (MenuEntry | false | undefined)[]
  align?: 'start' | 'end'
}

/**
 * Un menu di azioni: sul computer il DropdownMenu di Radix, sul telefono un pannello dal
 * basso. Lì un sottomenu laterale finirebbe fuori schermo o sotto il dito: l'elenco della
 * scelta prende invece il posto delle voci, con una freccia per tornare indietro.
 */
export function ActionMenu({ trigger, title, entries, align = 'end' }: ActionMenuProps) {
  const mobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [sub, setSub] = useState<number>()
  // Dopo un'azione il focus non torna al pulsante: spesso l'azione apre una finestra,
  // o fa sparire la riga del pulsante.
  const acted = useRef(false)
  const items = entries.filter((e): e is MenuEntry => Boolean(e))

  if (!mobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-auto">
          {items.map((entry, i) =>
            entry === 'separator' ? (
              <DropdownMenuSeparator key={i} />
            ) : 'choices' in entry ? (
              entry.choices.length > 0 && (
                <DropdownMenuSub key={i}>
                  <DropdownMenuSubTrigger>
                    {entry.icon} {entry.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                    {entry.choices.map((c) => (
                      <DropdownMenuItem key={c.value} onSelect={() => entry.onChoose(c.value)}>
                        {c.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
            ) : (
              <DropdownMenuItem
                key={i}
                onSelect={entry.onSelect}
                disabled={entry.disabled}
                variant={entry.destructive ? 'destructive' : 'default'}
              >
                {entry.icon} {entry.label}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  function run(action: () => void) {
    acted.current = true
    setOpen(false)
    action()
  }

  const subEntry = sub === undefined ? undefined : items[sub]
  const choosing = subEntry && subEntry !== 'separator' && 'choices' in subEntry ? subEntry : undefined

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          acted.current = false
          setSub(undefined)
        }
      }}
    >
      <Slot.Root aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {trigger}
      </Slot.Root>
      <SheetContent
        title={
          choosing ? (
            <span className="-ml-1 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSub(undefined)}
                aria-label="Indietro"
                className="grid size-9 place-items-center rounded-lg active:bg-accent"
              >
                <ArrowLeft className="size-5" />
              </button>
              {choosing.label}
            </span>
          ) : (
            title
          )
        }
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => acted.current && e.preventDefault()}
      >
        {choosing ? (
          <ChoiceList choices={choosing.choices} onChoose={(v) => run(() => choosing.onChoose(v))} />
        ) : (
          <div className="grid overflow-y-auto overscroll-contain px-2 pb-3">
            {items.map((entry, i) =>
              entry === 'separator' ? (
                <hr key={i} className="mx-3 my-1 border-border" />
              ) : 'choices' in entry ? (
                entry.choices.length > 0 && (
                  <SheetItem key={i} onClick={() => setSub(i)}>
                    {entry.icon}
                    <span className="flex-1">{entry.label}</span>
                    <ChevronRight className="text-muted-foreground" />
                  </SheetItem>
                )
              ) : (
                <SheetItem
                  key={i}
                  onClick={() => run(entry.onSelect)}
                  disabled={entry.disabled}
                  variant={entry.destructive ? 'destructive' : 'default'}
                >
                  {entry.icon}
                  {entry.label}
                </SheetItem>
              ),
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
