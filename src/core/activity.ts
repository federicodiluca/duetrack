// Da quanto tempo non vedi un cliente: per accorgersi di chi si è perso per strada.

import type { Ledger } from './ledger'
import type { Client, IsoDate } from './model'

/** L'ultima sessione (non esclusa) di ogni cliente, tra quelle lette. */
export function lastSessionDates(ledger: Ledger): Map<string, IsoDate> {
  const last = new Map<string, IsoDate>()
  for (const s of ledger.sessions) {
    if (!s.clientId || s.excluded) continue
    const current = last.get(s.clientId)
    if (!current || s.date > current) last.set(s.clientId, s.date)
  }
  return last
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  const utc = (iso: IsoDate) => {
    const [y, m, d] = iso.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(to) - utc(from)) / 86_400_000)
}

export interface InactiveClient {
  client: Client
  /** Assente se nel periodo letto non c'è nessuna sessione. */
  lastSession?: IsoDate
  days?: number
}

/** I clienti senza sessioni da almeno `afterDays` giorni, dal più recente: chi non ha sessioni nel periodo letto va in fondo. */
export function inactiveClients(
  clients: Client[],
  last: Map<string, IsoDate>,
  today: IsoDate,
  afterDays: number,
): InactiveClient[] {
  return clients
    .map((client) => {
      const lastSession = last.get(client.id)
      return { client, lastSession, days: lastSession ? daysBetween(lastSession, today) : undefined }
    })
    .filter((c) => c.days === undefined || c.days >= afterDays)
    .sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity))
}
