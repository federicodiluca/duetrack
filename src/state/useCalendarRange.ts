import { useEffect, useRef, useState } from 'react'
import type { IsoDate } from '@/core/model'
import { eventToSession, type Session } from '@/core/session'
import { DEMO, demoListEvents } from '@/demo'
import { listEvents } from '@/google/calendar'
import { GoogleApiError } from '@/google/http'
import { isoToDate } from '@/lib/format'
import { useAuth } from './auth'
import { useData } from './data'

export interface CalendarRange {
  status: 'loading' | 'ready' | 'error'
  error?: string
  sessions: Session[]
  /** L'intervallo effettivamente letto. */
  window: { from: Date; to: Date }
  loadedAt?: Date
}

type Result =
  | { request: string; sessions: Session[]; window: { from: Date; to: Date }; loadedAt: Date }
  | { request: string; error: string }

const EMPTY_WINDOW = { from: new Date(0), to: new Date(0) }

/**
 * Le sessioni del calendario scelto tra due giorni, estremi compresi. Mai oltre adesso:
 * una sessione in calendario per la settimana prossima non è ancora né fatta né dovuta.
 *
 * @param reloads cambiarlo fa rileggere il calendario
 */
export function useCalendarRange(from: IsoDate | undefined, to?: IsoDate, reloads = 0): CalendarRange {
  return useCalendarWindow(from && `${from}|${to}|${reloads}`, () => {
    const now = new Date()
    const end = to ? isoToDate(to) : now
    if (to) end.setDate(end.getDate() + 1) // fine dell'ultimo giorno
    return { from: isoToDate(from!), to: end < now ? end : now }
  })
}

/**
 * Le sessioni in programma da adesso alle prossime `weeks` settimane: si leggono a parte,
 * così non possono finire nel registro del dovuto. Con 0 settimane non legge niente.
 */
export function useUpcomingRange(weeks: number, reloads = 0): CalendarRange {
  return useCalendarWindow(weeks > 0 ? `upcoming|${weeks}|${reloads}` : undefined, () => {
    const from = new Date()
    const to = new Date(from)
    to.setDate(to.getDate() + weeks * 7)
    return { from, to }
  })
}

/**
 * Legge gli eventi della finestra data da `makeWindow`, che si calcola dentro l'effect
 * perché dipende dall'ora attuale. Rilegge quando cambia `key`; senza key non legge niente.
 */
function useCalendarWindow(key: string | undefined, makeWindow: () => { from: Date; to: Date }): CalendarRange {
  const { token, signOut } = useAuth()
  const { data } = useData()
  const { calendarId } = data.settings

  const [result, setResult] = useState<Result>()
  // Ultimi dati letti con successo: restano visibili mentre se ne leggono di nuovi.
  const [last, setLast] = useState<Extract<Result, { sessions: Session[] }>>()

  // "Sto caricando" non è uno stato da impostare a mano: è vero finché l'ultimo esito
  // arrivato non risponde alla richiesta attuale. Così nessun setState dentro l'effect.
  const request = `${calendarId}|${key}`
  const status: CalendarRange['status'] = result?.request !== request ? 'loading' : 'error' in result ? 'error' : 'ready'

  // makeWindow cambia a ogni render: conta solo quella dell'ultimo, letta quando cambia la richiesta.
  const makeWindowRef = useRef(makeWindow)
  useEffect(() => {
    makeWindowRef.current = makeWindow
  })

  useEffect(() => {
    if (!token || !calendarId || !key) return
    let cancelled = false
    const window = makeWindowRef.current()

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
  }, [token, calendarId, key, request, signOut])

  return {
    status,
    error: result && 'error' in result ? result.error : undefined,
    // Senza key (es. 0 settimane in programma) i dati letti prima non valgono più.
    sessions: key ? (last?.sessions ?? []) : [],
    window: last?.window ?? EMPTY_WINDOW,
    loadedAt: last?.loadedAt,
  }
}
