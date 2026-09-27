import { displayTitle, titleKey } from './title'

/** Il sottoinsieme di un evento di Google Calendar che serve a Duetrack. */
export interface CalendarEvent {
  id: string
  summary?: string
  status?: string
  // Gli eventi con orario hanno dateTime; quelli "tutto il giorno" solo date.
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

export interface Session {
  eventId: string
  title: string
  key: string
  start: Date
  durationMinutes: number
}

/**
 * Trasforma un evento in una sessione, o null se non può esserlo: eventi
 * cancellati, "tutto il giorno" (non hanno una durata in ore) o di durata nulla.
 */
export function eventToSession(event: CalendarEvent): Session | null {
  if (event.status === 'cancelled') return null
  if (!event.start.dateTime || !event.end.dateTime) return null

  const start = new Date(event.start.dateTime)
  const end = new Date(event.end.dateTime)
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60_000)
  if (durationMinutes <= 0) return null

  const title = event.summary ?? ''
  return { eventId: event.id, title: displayTitle(title), key: titleKey(title), start, durationMinutes }
}

export interface SessionGroup<T extends GroupableSession = Session> {
  key: string
  label: string
  sessions: T[]
  totalMinutes: number
}

type GroupableSession = Pick<Session, 'key' | 'title' | 'durationMinutes'>

/** Raggruppa le sessioni per titolo normalizzato, i gruppi più numerosi per primi. */
export function groupByTitle<T extends GroupableSession>(sessions: T[]): SessionGroup<T>[] {
  const groups = new Map<string, SessionGroup<T>>()
  for (const session of sessions) {
    const group = groups.get(session.key) ?? { key: session.key, label: session.title, sessions: [], totalMinutes: 0 }
    group.sessions.push(session)
    group.totalMinutes += session.durationMinutes
    groups.set(session.key, group)
  }
  return [...groups.values()].sort((a, b) => b.sessions.length - a.sessions.length)
}

/** 90 → "1h30", 60 → "1h", 45 → "45min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}
