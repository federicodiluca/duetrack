import { describe, expect, it } from 'vitest'
import type { LedgerSession } from '@/core/ledger'
import { ALL_SESSIONS, filterSessions, sessionMonths } from './sessionFilter'

const session = (id: string, date: string, extra: Partial<LedgerSession> = {}) =>
  ({ id, date, amountCents: 3000, ...extra }) as LedgerSession

describe('sessionFilter', () => {
  const due = [
    session('a', '2026-08-28'),
    session('b', '2026-09-03', { note: 'recupero' }),
    session('c', '2026-09-17', { amountCents: undefined }),
    session('d', '2026-10-01'),
  ]
  const ids = (list: LedgerSession[]) => list.map((s) => s.id)

  it('lists the months with sessions, oldest first', () => {
    expect(sessionMonths(due)).toEqual([
      { month: '2026-08', count: 1 },
      { month: '2026-09', count: 2 },
      { month: '2026-10', count: 1 },
    ])
  })

  it('keeps everything by default, from the oldest', () => {
    expect(ids(filterSessions(due, ALL_SESSIONS))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('filters by month and kind, and reverses the order on request', () => {
    expect(ids(filterSessions(due, { ...ALL_SESSIONS, month: '2026-09' }))).toEqual(['b', 'c'])
    expect(ids(filterSessions(due, { ...ALL_SESSIONS, kind: 'noted' }))).toEqual(['b'])
    expect(ids(filterSessions(due, { ...ALL_SESSIONS, kind: 'no-rate' }))).toEqual(['c'])
    expect(ids(filterSessions(due, { ...ALL_SESSIONS, order: 'newest' }))).toEqual(['d', 'c', 'b', 'a'])
  })

  it('does not reorder the list it receives', () => {
    filterSessions(due, { ...ALL_SESSIONS, order: 'newest' })
    expect(ids(due)).toEqual(['a', 'b', 'c', 'd'])
  })
})
