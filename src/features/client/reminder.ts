import type { ClientSummary } from '@/core/ledger'
import { formatMoney } from '@/core/money'
import { formatDuration } from '@/core/session'

// Senza anno: nel promemoria le date sono sempre recenti, e il testo resta corto.
const day = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' })

/**
 * Il messaggio da mandare al cliente con le sessioni da saldare. È solo una base: l'utente
 * lo modifica prima di copiarlo o condividerlo.
 */
export function reminderText(summary: ClientSummary, currency: string, word = { one: 'lezione', many: 'lezioni' }): string {
  const { due, dueMinutes, dueCents } = summary
  const lines = due.map((s) => {
    const amount = s.amountCents === undefined ? '' : ` · ${formatMoney(s.amountCents, currency)}`
    return `- ${day.format(s.start)} · ${formatDuration(s.durationMinutes)}${amount}`
  })
  const count = `${due.length} ${due.length === 1 ? word.one : word.many}`
  return [
    `Ciao! Ti mando il riepilogo delle ${word.many} ancora da saldare:`,
    '',
    ...lines,
    '',
    `Totale: ${count}, ${formatDuration(dueMinutes)}, ${formatMoney(dueCents, currency)}.`,
    'Grazie!',
  ]
    .join('\n')
    .replace(/ /g, ' ')
}
