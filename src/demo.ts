// Modalità demo (`npm run demo`): calendario e login finti, dati salvati a parte.
// Serve a provare l'interfaccia senza un account Google e a fare screenshot su dati
// inventati. Nella build normale DEMO è false e Vite elimina i rami che la usano.

import type { CalendarEvent } from '@/core/session'
import type { CalendarInfo } from '@/google/calendar'

export const DEMO = import.meta.env.MODE === 'demo'

export const demoCalendars: CalendarInfo[] = [{ id: 'demo', summary: 'Ripetizioni', backgroundColor: '#fbbf24' }]

// Settimana tipo: giorno (0 = domenica), ora, durata in minuti, titolo dell'evento e,
// facoltativo, l'ultimo giorno (per avere anche un cliente che ha smesso di venire).
const WEEK: [number, string, number, string, string?][] = [
  [2, '18:00', 60, 'Ripetizioni Pietro', '2026-08-18'],
  [1, '15:00', 60, '📚 Ripetizioni Marta'],
  [1, '17:00', 90, '📚 Ripetizioni Luca'],
  [2, '16:00', 60, '📚 Ripetizioni Giulia'],
  [3, '15:00', 60, '📚 Ripetizioni Marta'],
  [3, '18:00', 120, '📚 Ripetizioni Tommaso'],
  [4, '16:30', 90, '📚 Ripetizioni Luca'],
  [5, '15:00', 60, 'Ripetizioni Giulia B.'],
]

// Eventi occasionali, per provare "Da classificare" ed esclusioni.
const ONE_OFF: [number, string, number, string][] = [
  [9, '10:00', 60, 'Dentista'],
  [16, '18:30', 45, 'Colloquio genitori Marta'],
]

function at(day: Date, time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number)
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m)
  return { start: start.toISOString(), end: new Date(start.getTime() + minutes * 60_000).toISOString() }
}

/** Eventi deterministici nell'intervallo richiesto, come li restituirebbe Google. */
export async function demoListEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = []
  for (let day = new Date(from); day < to; day.setDate(day.getDate() + 1)) {
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    const slots = [
      ...WEEK.filter(([weekday, , , , until]) => weekday === day.getDay() && (!until || iso <= until)),
      ...ONE_OFF.filter(([date]) => date === day.getDate()),
    ]
    for (const [, time, minutes, summary] of slots) {
      const { start, end } = at(day, time, minutes)
      if (new Date(end) > to) continue
      events.push({ id: `demo-${start}-${summary}`, summary, start: { dateTime: start }, end: { dateTime: end } })
    }
  }
  return events
}
