// API di Google Calendar v3, in sola lettura (ADR 0004).

import type { CalendarEvent } from '@/core/session'
import { googleFetch, withParams } from './http'

const API = 'https://www.googleapis.com/calendar/v3'

export interface CalendarInfo {
  id: string
  summary: string
  primary?: boolean
  backgroundColor?: string
}

/** I calendari di proprietà dell'utente: gli unici leggibili con lo scope *.owned.readonly. */
export async function listOwnedCalendars(token: string): Promise<CalendarInfo[]> {
  const response = await googleFetch(token, withParams(`${API}/users/me/calendarList`, { minAccessRole: 'owner' }))
  const data: { items: CalendarInfo[] } = await response.json()
  return data.items
}

/** Tutti gli eventi di un calendario in un intervallo, con le ricorrenze espanse. */
export async function listEvents(token: string, calendarId: string, from: Date, to: Date): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = []
  let pageToken: string | undefined

  // L'API restituisce al massimo 2500 eventi per pagina: si seguono i nextPageToken.
  do {
    const url = withParams(`${API}/calendars/${encodeURIComponent(calendarId)}/events`, {
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      // Espande gli eventi ricorrenti in singole occorrenze, ognuna con il suo id.
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '2500',
      // Chiede solo i campi usati: risposte più leggere.
      fields: 'items(id,summary,status,start,end),nextPageToken',
      pageToken,
    })
    const page: { items: CalendarEvent[]; nextPageToken?: string } = await (await googleFetch(token, url)).json()
    events.push(...page.items)
    pageToken = page.nextPageToken
  } while (pageToken)

  return events
}
