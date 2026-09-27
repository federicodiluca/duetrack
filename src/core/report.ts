// Il resoconto di un periodo: quanto lavoro è stato svolto e quanto è già saldato.

import type { Ledger, LedgerSession } from './ledger'
import type { Client, DuetrackData, IsoDate } from './model'

export interface ReportTotals {
  sessions: number
  minutes: number
  /** Valore delle sessioni svolte nel periodo. */
  cents: number
  /** Di cui già saldato: pagato, o precedente alla data di partenza. */
  settledCents: number
  /** Di cui ancora da incassare. */
  outstandingCents: number
  /** Sessioni senza tariffa per la loro data: non contate negli importi. */
  missingRate: number
}

export interface ReportRow extends ReportTotals {
  client: Client
}

export interface Report {
  rows: ReportRow[]
  total: ReportTotals
  /** Incassato nel periodo: pagamenti con data nel periodo, qualunque sessione saldino. */
  receivedCents: number
  /** Eventi del periodo da classificare: non entrano nei conti finché non li assegni. */
  unclassified: number
  sessions: LedgerSession[]
}

const emptyTotals = (): ReportTotals => ({ sessions: 0, minutes: 0, cents: 0, settledCents: 0, outstandingCents: 0, missingRate: 0 })

/** Saldata: pagata, oppure precedente alla data di partenza e non richiamata da un "pagare da". */
export function isSettled(session: LedgerSession, client: Client): boolean {
  if (session.paymentId) return true
  return session.beforeTracking && !(client.payFrom !== undefined && session.date >= client.payFrom)
}

function add(totals: ReportTotals, session: LedgerSession, settled: boolean) {
  totals.sessions++
  totals.minutes += session.durationMinutes
  if (session.amountCents === undefined) {
    totals.missingRate++
    return
  }
  totals.cents += session.amountCents
  if (settled) totals.settledCents += session.amountCents
  else totals.outstandingCents += session.amountCents
}

/**
 * @param from primo giorno del periodo, compreso
 * @param to ultimo giorno del periodo, compreso
 * @param clientIds clienti da includere; assente = tutti
 */
export function buildReport(ledger: Ledger, data: DuetrackData, from: IsoDate, to: IsoDate, clientIds?: Set<string>): Report {
  const inPeriod = (date: IsoDate) => date >= from && date <= to
  const selected = data.clients.filter((c) => !clientIds || clientIds.has(c.id))
  const byId = new Map(selected.map((c) => [c.id, c]))

  const rows = new Map(selected.map((client) => [client.id, { client, ...emptyTotals() }]))
  const total = emptyTotals()
  const sessions: LedgerSession[] = []

  for (const session of ledger.sessions) {
    const client = session.clientId ? byId.get(session.clientId) : undefined
    if (!client || session.excluded || !inPeriod(session.date)) continue
    const settled = isSettled(session, client)
    add(rows.get(client.id)!, session, settled)
    add(total, session, settled)
    sessions.push(session)
  }

  const receivedCents = data.payments
    .filter((p) => byId.has(p.clientId) && inPeriod(p.date))
    .reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.amountCents, 0), 0)

  return {
    rows: [...rows.values()].filter((r) => r.sessions > 0).sort((a, b) => b.cents - a.cents),
    total,
    receivedCents,
    // Gli stessi che mostra "Da classificare": quelli prima della data di partenza no.
    unclassified: ledger.unclassified.filter((s) => inPeriod(s.date)).length,
    sessions,
  }
}
