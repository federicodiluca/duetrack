// Chiamate REST dirette all'API di Google Calendar v3: con fetch e un token non serve
// nessuna libreria client (googleapis è pensata per Node e pesa troppo per il browser).

import type { CalendarEvent } from '@/core/session'

const API = 'https://www.googleapis.com/calendar/v3'

export class GoogleApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function get<T>(token: string, path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(API + path)
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value)

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new GoogleApiError(response.status, body?.error?.message ?? response.statusText)
  }
  return response.json()
}

export interface CalendarInfo {
  id: string
  summary: string
  primary?: boolean
  backgroundColor?: string
}

/** I calendari di proprietà dell'utente: gli unici leggibili con lo scope *.owned.readonly. */
export async function listOwnedCalendars(token: string): Promise<CalendarInfo[]> {
  const data = await get<{ items: CalendarInfo[] }>(token, '/users/me/calendarList', { minAccessRole: 'owner' })
  return data.items
}

/** Tutti gli eventi di un calendario in un intervallo, con le ricorrenze espanse. */
export async function listEvents(token: string, calendarId: string, from: Date, to: Date): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = []
  let pageToken: string | undefined

  // L'API restituisce al massimo 2500 eventi per pagina: si seguono i nextPageToken.
  do {
    const page = await get<{ items: CalendarEvent[]; nextPageToken?: string }>(
      token,
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        // Espande gli eventi ricorrenti in singole occorrenze, ognuna con il suo id.
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '2500',
        // Chiede solo i campi usati: risposte più leggere.
        fields: 'items(id,summary,status,start,end),nextPageToken',
        ...(pageToken && { pageToken }),
      },
    )
    events.push(...page.items)
    pageToken = page.nextPageToken
  } while (pageToken)

  return events
}
