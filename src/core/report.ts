// Il resoconto di un periodo: quanto lavoro è stato svolto e quanto è già saldato.

import type { Ledger, LedgerSession } from './ledger'
import { type Client, type DuetrackData, type IsoDate, toIsoDate } from './model'

export interface ReportTotals {
  sessions: number
  minutes: number
  /** Minuti delle sole sessioni con un importo: la base della tariffa effettiva. */
  pricedMinutes: number
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

const emptyTotals = (): ReportTotals => ({ sessions: 0, minutes: 0, pricedMinutes: 0, cents: 0, settledCents: 0, outstandingCents: 0, missingRate: 0 })

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
  totals.pricedMinutes += session.durationMinutes
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

/** Tariffa oraria effettiva: importo diviso ore svolte. Rivela sconti e importi corretti a mano. */
export function effectiveRate(totals: Pick<ReportTotals, 'cents' | 'pricedMinutes'>): number | undefined {
  // Le ore delle sessioni senza tariffa non hanno un importo: non entrano nella media.
  if (totals.pricedMinutes === 0) return undefined
  return Math.round((totals.cents * 60) / totals.pricedMinutes)
}

function parseIso(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Il periodo di pari durata subito prima: per un mese intero è il mese precedente, per
 * un anno intero l'anno precedente, altrimenti lo stesso numero di giorni.
 */
export function previousPeriod(from: IsoDate, to: IsoDate): { from: IsoDate; to: IsoDate } {
  const start = parseIso(from)
  const end = parseIso(to)
  const nextDay = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)
  const wholeMonths = start.getDate() === 1 && nextDay.getDate() === 1
  if (wholeMonths) {
    const months = (nextDay.getFullYear() - start.getFullYear()) * 12 + nextDay.getMonth() - start.getMonth()
    return {
      from: toIsoDate(new Date(start.getFullYear(), start.getMonth() - months, 1)),
      to: toIsoDate(new Date(start.getFullYear(), start.getMonth(), 0)),
    }
  }
  const days = Math.round((nextDay.getTime() - start.getTime()) / 86_400_000)
  return {
    from: toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() - days)),
    to: toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1)),
  }
}

/**
 * I due tratti da confrontare. Se il periodo non è ancora finito (es. "quest'anno" a
 * settembre), si confronta la parte già trascorsa con lo stesso tratto del periodo prima:
 * gennaio-settembre contro gennaio-settembre, non contro un anno intero.
 */
export function comparablePeriods(
  from: IsoDate,
  to: IsoDate,
  today: IsoDate,
): { current: { from: IsoDate; to: IsoDate }; previous: { from: IsoDate; to: IsoDate } } {
  const previous = previousPeriod(from, to)
  if (to <= today || today < from) return { current: { from, to }, previous }
  const elapsed = Math.round((parseIso(today).getTime() - parseIso(from).getTime()) / 86_400_000)
  const start = parseIso(previous.from)
  const end = toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + elapsed))
  return { current: { from, to: today }, previous: { from: previous.from, to: end < previous.to ? end : previous.to } }
}

/** Variazione percentuale arrotondata; undefined se prima non c'era niente da confrontare. */
export function percentChange(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined
  return Math.round(((current - previous) / previous) * 100)
}

export interface MonthTotals {
  /** "YYYY-MM" */
  month: string
  minutes: number
  cents: number
  sessions: number
}

/** Ore e importo svolti mese per mese, compresi i mesi vuoti del periodo. */
export function monthlyTotals(report: Report, from: IsoDate, to: IsoDate): MonthTotals[] {
  const months: MonthTotals[] = []
  for (let d = parseIso(from.slice(0, 8) + '01'); toIsoDate(d) <= to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    months.push({ month: toIsoDate(d).slice(0, 7), minutes: 0, cents: 0, sessions: 0 })
  }
  const byMonth = new Map(months.map((m) => [m.month, m]))
  for (const s of report.sessions) {
    const month = byMonth.get(s.date.slice(0, 7))
    if (!month) continue
    month.sessions++
    month.minutes += s.durationMinutes
    month.cents += s.amountCents ?? 0
  }
  return months
}
