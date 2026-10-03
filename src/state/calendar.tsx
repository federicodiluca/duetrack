import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildLedger, buildUpcoming, type ClientSummary, type Ledger, type LedgerSession, summarizeClient } from '@/core/ledger'
import { useData } from './data'
import { useCalendarRange, useUpcomingRange } from './useCalendarRange'

interface CalendarContextValue {
  status: 'loading' | 'ready' | 'error'
  error?: string
  loadedAt?: Date
  reload: () => void
  ledger: Ledger
  /** Un riepilogo per cliente, chi deve di più per primo. */
  summaries: ClientSummary[]
  /** Le sessioni in programma, dalla prossima: fuori dal registro e dai conti. */
  upcoming: LedgerSession[]
}

// Riletture al ritorno sull'app: non più di una ogni cinque minuti.
const RELOAD_AFTER_MS = 5 * 60_000

const CalendarContext = createContext<CalendarContextValue | null>(null)

/** Il registro del dovuto: calendario da "traccia dal" a oggi, unito ai dati salvati. */
export function CalendarProvider({ children }: { children: ReactNode }) {
  const { data } = useData()
  const [reloads, setReloads] = useState(0)

  // Si legge dalla data più vecchia che serve: un "pagare da" precedente alla data di
  // partenza fa rileggere anche quel periodo. Le date sono IsoDate: si confrontano come testo.
  const readFrom = data.clients.reduce<string | undefined>(
    (earliest, c) => (c.payFrom && earliest && c.payFrom < earliest ? c.payFrom : earliest),
    data.settings.trackFrom,
  )
  const { status, error, sessions, window, loadedAt } = useCalendarRange(readFrom, undefined, reloads)

  const upcomingRange = useUpcomingRange(data.settings.upcomingWeeks, reloads)

  const reload = useCallback(() => setReloads((n) => n + 1), [])

  // Tornando sull'app dopo un po' si rilegge: le sessioni finite nel frattempo passano
  // dalle "prossime" al conto senza dover ricaricare la pagina.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !loadedAt) return
      if (Date.now() - loadedAt.getTime() > RELOAD_AFTER_MS) reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadedAt, reload])

  // Il registro si ricalcola a ogni modifica dei dati, senza rileggere il calendario.
  const ledger = useMemo(() => buildLedger(sessions, data, window), [sessions, data, window])
  const summaries = useMemo(
    () =>
      data.clients
        .map((client) => summarizeClient(ledger, client))
        .sort((a, b) => b.dueCents - a.dueCents || a.client.name.localeCompare(b.client.name, 'it')),
    [ledger, data.clients],
  )
  // Adesso è l'ora della lettura: tra una lettura e l'altra la lista non cambia.
  const upcoming = useMemo(
    () => buildUpcoming(upcomingRange.sessions, data, upcomingRange.window.from),
    [upcomingRange.sessions, upcomingRange.window, data],
  )

  return (
    <CalendarContext.Provider value={{ status, error, loadedAt, reload, ledger, summaries, upcoming }}>{children}</CalendarContext.Provider>
  )
}

export function useCalendar(): CalendarContextValue {
  const value = useContext(CalendarContext)
  if (!value) throw new Error('useCalendar va usato dentro CalendarProvider')
  return value
}
