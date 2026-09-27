// Spike del passo 1: login Google, scelta del calendario, elenco delle sessioni lette
// raggruppate per titolo. Serve a verificare permessi e riconoscimento dei nomi su dati
// veri; la UI definitiva arriva al passo 3.

import { useState } from 'react'
import { CALENDAR_SCOPES, GOOGLE_CLIENT_ID } from '@/config'
import { eventToSession, formatDuration, groupByTitle, type Session, type SessionGroup } from '@/core/session'
import { type AccessToken, requestAccessToken } from '@/google/auth'
import { type CalendarInfo, listEvents, listOwnedCalendars } from '@/google/calendar'

const CALENDAR_KEY = 'duetrack.calendarId'

// localStorage può lanciare eccezioni (navigazione privata, storage bloccato): è solo
// una comodità, quindi in quel caso si fa a meno di ricordare la scelta.
function readSavedCalendar(): string {
  try {
    return localStorage.getItem(CALENDAR_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveCalendar(id: string) {
  try {
    localStorage.setItem(CALENDAR_KEY, id)
  } catch {
    // ignorato di proposito
  }
}

function monthsAgo(months: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date.toISOString().slice(0, 10)
}

const dateFormat = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

interface Result {
  eventCount: number
  skipped: number
  groups: SessionGroup[]
}

export default function App() {
  // Il token resta solo in memoria: non va in localStorage, dove uno script iniettato
  // (XSS) potrebbe leggerlo anche dopo la chiusura della pagina.
  const [token, setToken] = useState<AccessToken>()
  const [calendars, setCalendars] = useState<CalendarInfo[]>([])
  const [calendarId, setCalendarId] = useState(readSavedCalendar)
  const [from, setFrom] = useState(() => monthsAgo(3))
  const [result, setResult] = useState<Result>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  async function run(task: () => Promise<void>) {
    setError(undefined)
    setLoading(true)
    try {
      await task()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const signIn = () =>
    run(async () => {
      const newToken = await requestAccessToken(GOOGLE_CLIENT_ID, CALENDAR_SCOPES)
      setToken(newToken)
      const owned = await listOwnedCalendars(newToken.value)
      setCalendars(owned)
      if (!owned.some((c) => c.id === calendarId)) setCalendarId('')
    })

  const load = () =>
    run(async () => {
      if (!token) return
      saveCalendar(calendarId)
      const events = await listEvents(token.value, calendarId, new Date(from), new Date())
      const sessions = events.map(eventToSession).filter((s): s is Session => s !== null)
      setResult({ eventCount: events.length, skipped: events.length - sessions.length, groups: groupByTitle(sessions) })
    })

  return (
    <main>
      <h1>Duetrack</h1>
      <p>Spike: lettura del calendario.</p>

      {!token ? (
        <button onClick={signIn} disabled={loading}>
          Accedi con Google
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            load()
          }}
        >
          <label>
            Calendario{' '}
            <select value={calendarId} onChange={(e) => setCalendarId(e.target.value)} required>
              <option value="">Scegli…</option>
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.summary}
                  {c.primary ? ' (principale)' : ''}
                </option>
              ))}
            </select>
          </label>{' '}
          <label>
            Dal <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
          </label>{' '}
          <button disabled={loading}>Leggi eventi</button>
        </form>
      )}

      {loading && <p>Caricamento…</p>}
      {error && <p role="alert">Errore: {error}</p>}

      {result && (
        <section>
          <p>
            {result.eventCount} eventi letti, {result.eventCount - result.skipped} sessioni,{' '}
            {result.skipped} scartati (tutto il giorno, cancellati o di durata nulla).
          </p>
          {result.groups.map((group) => (
            <details key={group.key}>
              <summary>
                <strong>{group.label || '(senza titolo)'}</strong> · {group.sessions.length} sessioni ·{' '}
                {formatDuration(group.totalMinutes)} · chiave <code>{group.key || '∅'}</code>
              </summary>
              <ul>
                {group.sessions.map((s) => (
                  <li key={s.eventId}>
                    {dateFormat.format(s.start)} · {formatDuration(s.durationMinutes)}
                    {s.title !== group.label && <> · scritto «{s.title}»</>}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      )}
    </main>
  )
}
