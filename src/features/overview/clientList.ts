// Ricerca, filtro e ordinamento della lista clienti nella panoramica.

import type { ClientSummary } from '@/core/ledger'
import type { IsoDate } from '@/core/model'
import { titleKey } from '@/core/title'

export type ClientSort = 'due-desc' | 'due-asc' | 'name' | 'recent'
export type ClientFilter = 'all' | 'owing' | 'doubtful' | 'settled' | 'inactive'

export const CLIENT_SORTS: Record<ClientSort, string> = {
  'due-desc': 'Chi deve di più',
  'due-asc': 'Chi deve di meno',
  name: 'Nome',
  recent: 'Ultima sessione',
}

/** I gruppi della panoramica: chi deve pagare, chi è difficile da incassare, chi è in pari. */
export function clientGroup(s: ClientSummary): Exclude<ClientFilter, 'all' | 'inactive'> {
  if (s.due.length === 0) return 'settled'
  return s.client.doubtful ? 'doubtful' : 'owing'
}

/** Ricerca su nome e alias, senza badare a maiuscole e accenti. */
export function matchesQuery(s: ClientSummary, query: string): boolean {
  const q = titleKey(query)
  return !q || [s.client.name, ...s.client.aliases].some((n) => titleKey(n).includes(q))
}

export function sortClients(summaries: ClientSummary[], sort: ClientSort, lastDates: Map<string, IsoDate>): ClientSummary[] {
  const byName = (a: ClientSummary, b: ClientSummary) => a.client.name.localeCompare(b.client.name, 'it')
  const sorted = [...summaries]
  switch (sort) {
    case 'due-desc':
      return sorted.sort((a, b) => b.dueCents - a.dueCents || byName(a, b))
    case 'due-asc':
      return sorted.sort((a, b) => a.dueCents - b.dueCents || byName(a, b))
    case 'name':
      return sorted.sort(byName)
    case 'recent':
      // Chi non ha mai fatto sessioni va in fondo.
      return sorted.sort((a, b) => (lastDates.get(b.client.id) ?? '').localeCompare(lastDates.get(a.client.id) ?? '') || byName(a, b))
  }
}

export function filterClients(
  summaries: ClientSummary[],
  { query, filter, inactiveIds }: { query: string; filter: ClientFilter; inactiveIds: Set<string> },
): ClientSummary[] {
  return summaries.filter(
    (s) =>
      matchesQuery(s, query) &&
      (filter === 'all' || (filter === 'inactive' ? inactiveIds.has(s.client.id) : clientGroup(s) === filter)),
  )
}
