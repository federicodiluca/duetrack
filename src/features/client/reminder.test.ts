import { describe, expect, it } from 'vitest'
import { buildLedger, summarizeClient } from '@/core/ledger'
import { type Client, emptyData } from '@/core/model'
import { eventToSession } from '@/core/session'
import { reminderText } from './reminder'

describe('reminderText', () => {
  it('lists the due sessions with a total', () => {
    const luca: Client = { id: 'luca', name: 'Luca', aliases: [], rates: [{ from: '2026-01-01', centsPerHour: 2500 }] }
    const sessions = [
      eventToSession({ id: '1', summary: 'Luca', start: { dateTime: '2026-09-07T15:00:00Z' }, end: { dateTime: '2026-09-07T16:30:00Z' } })!,
      eventToSession({ id: '2', summary: 'Luca', start: { dateTime: '2026-09-10T15:00:00Z' }, end: { dateTime: '2026-09-10T16:00:00Z' } })!,
    ]
    const ledger = buildLedger(sessions, { ...emptyData(), clients: [luca] }, { from: new Date(0), to: new Date('2027-01-01') })
    expect(reminderText(summarizeClient(ledger, luca), 'EUR')).toBe(
      [
        'Ciao! Ti mando il riepilogo delle lezioni ancora da saldare:',
        '',
        '- lun 07/09 · 1h30 · 37,50 €',
        '- gio 10/09 · 1h · 25,00 €',
        '',
        'Totale: 2 lezioni, 2h30, 62,50 €.',
        'Grazie!',
      ].join('\n'),
    )
  })
})
