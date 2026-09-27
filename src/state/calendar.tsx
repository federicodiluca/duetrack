import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { buildLedger, type ClientSummary, type Ledger, summarizeClient } from '@/core/ledger'
import { useData } from './data'
import { useCalendarRange } from './useCalendarRange'

interface CalendarContextValue {
  status: 'loading' | 'ready' | 'error'
  error?: string
  loadedAt?: Date
  reload: () => void
  ledger: Ledger
  /** Un riepilogo per cliente, chi deve di più per primo. */
  summaries: ClientSummary[]
}

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

  const reload = useCallback(() => setReloads((n) => n + 1), [])

  // Il registro si ricalcola a ogni modifica dei dati, senza rileggere il calendario.
  const ledger = useMemo(() => buildLedger(sessions, data, window), [sessions, data, window])
  const summaries = useMemo(
    () =>
      data.clients
        .map((client) => summarizeClient(ledger, client))
        .sort((a, b) => b.dueCents - a.dueCents || a.client.name.localeCompare(b.client.name, 'it')),
    [ledger, data.clients],
  )

  return (
    <CalendarContext.Provider value={{ status, error, loadedAt, reload, ledger, summaries }}>{children}</CalendarContext.Provider>
  )
}

export function useCalendar(): CalendarContextValue {
  const value = useContext(CalendarContext)
  if (!value) throw new Error('useCalendar va usato dentro CalendarProvider')
  return value
}
