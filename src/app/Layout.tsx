import { Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'wouter'
import { Credits } from '@/components/Credits'
import { InstallButton } from '@/components/InstallButton'
import { CalendarSyncIcon, CoinStackIcon, ReportIcon, SortIcon } from '@/components/icons'
import { SyncIndicator } from '@/components/SyncIndicator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/format'
import { useCalendar } from '@/state/calendar'

const navLink = (isActive: boolean) =>
  cn(
    'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
    isActive && 'bg-secondary text-foreground',
  )

const navIcon = 'hidden size-4 sm:block'

export function Layout({ children }: { children: ReactNode }) {
  const { status, loadedAt, reload, unclassified: unclassifiedSessions } = useCalendar()
  const unclassified = new Set(unclassifiedSessions.map((s) => s.key)).size

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4">
      <header className="flex items-center justify-between gap-3 py-4">
        <Link to="/" className="flex items-center gap-2.5 font-heading text-lg font-semibold">
          <img src="/favicon.svg" alt="" className="size-7" />
          Duetrack
        </Link>
        <div className="flex items-center gap-1">
          <SyncIndicator />
          <InstallButton variant="ghost" size="sm" compact />
          <Button
            variant="ghost"
            size="sm"
            onClick={reload}
            disabled={status === 'loading'}
            title={loadedAt ? `Calendario letto alle ${formatTime(loadedAt)}: tocca per rileggerlo` : 'Rileggi il calendario'}
          >
            <CalendarSyncIcon className={cn(status === 'loading' && 'animate-pulse')} />
            <span className="max-sm:sr-only">{status === 'loading' ? 'Leggo…' : 'Aggiorna'}</span>
          </Button>
        </div>
      </header>

      {/* Sul telefono una riga sola che scorre di lato, invece di una voce sola a capo. */}
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-1.5 pb-4 [scrollbar-width:none] sm:-mx-2.5 sm:flex-wrap sm:px-0" aria-label="Sezioni">
        <Link to="/" className={navLink}>
          <CoinStackIcon className={navIcon} />
          Chi deve cosa
        </Link>
        <Link to="/da-classificare" className={navLink}>
          <SortIcon className={navIcon} />
          Da classificare
          {unclassified > 0 && (
            <span className="rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-foreground tabular-nums">{unclassified}</span>
          )}
        </Link>
        <Link to="/resoconto" className={navLink}>
          <ReportIcon className={navIcon} />
          Resoconto
        </Link>
        <Link to="/impostazioni" className={navLink}>
          <Settings className={navIcon} />
          Impostazioni
        </Link>
      </nav>

      <main className="flex-1 pb-10">
        {children}
      </main>

      <footer className="border-t py-6">
        <Credits />
      </footer>
    </div>
  )
}
