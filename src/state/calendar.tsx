import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildLedger, type ClientSummary, type Ledger, summarizeClient } from '@/core/ledger'
import { eventToSession, type Session } from '@/core/session'
import { DEMO, demoListEvents } from '@/demo'
import { listEvents } from '@/google/calendar'
import { GoogleApiError } from '@/google/http'
import { isoToDate } from '@/lib/format'
import { useAuth } from './auth'
import { useData } from './data'

interface CalendarContextValue {
  status: 'loading' | 'ready' | 'error'
  error?: string
  loadedAt?: Date
  reload: () => void
  ledger: Ledger
  /** Un riepilogo per cliente, chi deve di più per primo. */
  summaries: ClientSummary[]
}

/** L'esito di una lettura, con la richiesta a cui risponde. */
type Result =
  | { request: string; sessions: Session[]; window: { from: Date; to: Date }; loadedAt: Date }
  | { request: string; error: string }

const EMPTY_WINDOW = { from: new Date(0), to: new Date(0) }

const CalendarContext = createContext<CalendarContextValue | null>(null)

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { token, signOut } = useAuth()
  const { data } = useData()
  const { calendarId, trackFrom } = data.settings
  // Si legge dalla data più vecchia che serve: un "pagare da" precedente alla data di
  // partenza fa rileggere anche quel periodo. Le date sono IsoDate: si confrontano come testo.
  const readFrom = data.clients.reduce<string | undefined>(
    (earliest, c) => (c.payFrom && earliest && c.payFrom < earliest ? c.payFrom : earliest),
    trackFrom,
  )

  const [reloads, setReloads] = useState(0)
  const [result, setResult] = useState<Result>()
  // Ultimi dati letti con successo: restano visibili mentre se ne leggono di nuovi.
  const [last, setLast] = useState<Extract<Result, { sessions: Session[] }>>()

  // "Sto caricando" non è uno stato da impostare a mano: è vero finché l'ultimo esito
  // arrivato non risponde alla richiesta attuale. Così nessun setState dentro l'effect.
  const request = `${calendarId}|${readFrom}|${reloads}`
  const status: CalendarContextValue['status'] = result?.request !== request ? 'loading' : 'error' in result ? 'error' : 'ready'

  useEffect(() => {
    if (!token || !calendarId || !readFrom) return
    let cancelled = false
    // Fino a adesso: una lezione in calendario per la settimana prossima non è ancora dovuta.
    const window = { from: isoToDate(readFrom), to: new Date() }
    const events = DEMO ? demoListEvents(window.from, window.to) : listEvents(token, calendarId, window.from, window.to)
    events
      .then((events) => {
        if (cancelled) return
        const loaded = {
          request,
          sessions: events.map(eventToSession).filter((s): s is Session => s !== null),
          window,
          loadedAt: new Date(),
        }
        setResult(loaded)
        setLast(loaded)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        if (e instanceof GoogleApiError && e.status === 401) {
          // Token scaduto o revocato: si torna alla schermata di accesso.
          signOut()
          return
        }
        setResult({ request, error: e instanceof Error ? e.message : String(e) })
      })
    return () => {
      cancelled = true
    }
  }, [token, calendarId, readFrom, request, signOut])

  const reload = useCallback(() => setReloads((n) => n + 1), [])

  // Il registro si ricalcola a ogni modifica dei dati, senza rileggere il calendario.
  const ledger = useMemo(() => buildLedger(last?.sessions ?? [], data, last?.window ?? EMPTY_WINDOW), [last, data])
  const summaries = useMemo(
    () =>
      data.clients
        .map((client) => summarizeClient(ledger, client))
        .sort((a, b) => b.dueCents - a.dueCents || a.client.name.localeCompare(b.client.name, 'it')),
    [ledger, data.clients],
  )

  const value: CalendarContextValue = {
    status,
    error: result && 'error' in result ? result.error : undefined,
    loadedAt: last?.loadedAt,
    reload,
    ledger,
    summaries,
  }

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}

export function useCalendar(): CalendarContextValue {
  const value = useContext(CalendarContext)
  if (!value) throw new Error('useCalendar va usato dentro CalendarProvider')
  return value
}
