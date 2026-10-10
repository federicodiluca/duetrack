// Filtro e ordine delle sessioni da pagare nella pagina del cliente.

import type { LedgerSession } from '@/core/ledger'

export type SessionOrder = 'oldest' | 'newest'
export type SessionKind = 'all' | 'noted' | 'no-rate'

export interface SessionFilter {
  /** "2026-10", oppure 'all'. */
  month: string
  kind: SessionKind
  order: SessionOrder
}

export const ALL_SESSIONS: SessionFilter = { month: 'all', kind: 'all', order: 'oldest' }

/** I mesi in cui ci sono sessioni, dal più vecchio, con quante sessioni ha ciascuno. */
export function sessionMonths(sessions: LedgerSession[]): { month: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const s of sessions) {
    const month = s.date.slice(0, 7)
    counts.set(month, (counts.get(month) ?? 0) + 1)
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }))
}

const kinds: Record<SessionKind, (s: LedgerSession) => boolean> = {
  all: () => true,
  noted: (s) => Boolean(s.note),
  'no-rate': (s) => s.amountCents === undefined,
}

export function sessionsOfKind(sessions: LedgerSession[], kind: SessionKind): LedgerSession[] {
  return sessions.filter(kinds[kind])
}

/** Le sessioni dovute arrivano dalla più vecchia: per l'ordine inverso basta rovesciarle. */
export function filterSessions(sessions: LedgerSession[], { month, kind, order }: SessionFilter): LedgerSession[] {
  const filtered = sessionsOfKind(sessions, kind).filter((s) => month === 'all' || s.date.startsWith(month))
  return order === 'newest' ? filtered.reverse() : filtered
}
