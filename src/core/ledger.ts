// Il "registro": unisce le sessioni lette dal calendario con i dati salvati e ne ricava
// chi deve cosa. Tutto è derivato e ricalcolato a ogni lettura, niente è salvato: così
// un evento aggiunto o modificato in calendario si riflette da solo.

import { type Client, type DuetrackData, type IsoDate, type SessionId, toIsoDate } from './model'
import { amountForDuration } from './money'
import type { Session } from './session'
import { titleKey, withoutWords } from './title'

export type Match =
  | { kind: 'client'; clientId: string }
  | { kind: 'none' }
  | { kind: 'ambiguous'; clientIds: string[] }

/** A quale cliente corrisponde un titolo, confrontando le chiavi normalizzate di nome e alias. */
export function matchClient(key: string, clients: Client[]): Match {
  const ids = clients.filter((c) => [c.name, ...c.aliases].some((n) => titleKey(n) === key)).map((c) => c.id)
  if (ids.length === 1) return { kind: 'client', clientId: ids[0] }
  return ids.length === 0 ? { kind: 'none' } : { kind: 'ambiguous', clientIds: ids }
}

/** La tariffa in vigore in una data, o undefined se non ce n'è ancora nessuna. */
export function rateAt(client: Client, date: IsoDate): number | undefined {
  let current: { from: IsoDate; centsPerHour: number } | undefined
  for (const rate of client.rates) {
    if (rate.from <= date && (!current || rate.from > current.from)) current = rate
  }
  return current?.centsPerHour
}

export interface LedgerSession {
  id: SessionId
  source: 'calendar' | 'manual'
  /** Il titolo senza emoji né parole ignorate. */
  title: string
  /** Chiave normalizzata del titolo, per il confronto con clienti e titoli esclusi. */
  key: string
  start: Date
  date: IsoDate
  durationMinutes: number
  clientId?: string
  /** Solo per le sessioni da calendario non assegnate a mano. */
  match?: Match
  excluded: boolean
  /**
   * Evento precedente alla data "traccia dal": si considera già sistemato, salvo per i
   * clienti con un "pagare da" ancora più vecchio.
   */
  beforeTracking: boolean
  /** Durata × tariffa; undefined se il cliente non ha una tariffa per quella data. */
  computedCents?: number
  /** Importo effettivo: la correzione manuale se c'è, altrimenti quello calcolato. */
  amountCents?: number
  paymentId?: string
}

export type Anomaly =
  | { kind: 'paid-session-missing'; paymentId: string; sessionId: SessionId; start: string }
  | { kind: 'paid-session-changed'; paymentId: string; sessionId: SessionId; paidMinutes: number; currentMinutes: number }

export interface Ledger {
  sessions: LedgerSession[]
  /** Sessioni da calendario senza cliente: titolo sconosciuto o ambiguo. */
  unclassified: LedgerSession[]
  /** Sessioni escluse, a mano o per titolo: si possono sempre ripristinare. */
  excluded: LedgerSession[]
  anomalies: Anomaly[]
}

/**
 * @param calendarSessions sessioni lette dal calendario nell'intervallo [from, to)
 * @param window l'intervallo letto: serve a distinguere un evento cancellato da uno
 *               semplicemente fuori dal periodo caricato
 */
export function buildLedger(
  calendarSessions: Session[],
  data: DuetrackData,
  window: { from: Date; to: Date },
): Ledger {
  const clients = new Map(data.clients.map((c) => [c.id, c]))
  const paymentOf = new Map<SessionId, string>()
  for (const payment of data.payments) {
    for (const item of payment.items) paymentOf.set(item.sessionId, payment.id)
  }

  const sessions: LedgerSession[] = []

  const { ignoredWords, excludedTitles } = data.settings
  for (const s of calendarSessions) {
    const id: SessionId = `cal:${s.eventId}`
    const title = withoutWords(s.title, ignoredWords)
    const key = titleKey(title)
    const override = data.overrides[id]
    const match = override?.clientId ? undefined : matchClient(key, data.clients)
    const clientId = override?.clientId ?? (match?.kind === 'client' ? match.clientId : undefined)
    const excludedByTitle = excludedTitles.includes(key)
    sessions.push(
      finish({ id, source: 'calendar', title, key, start: s.start, durationMinutes: s.durationMinutes, clientId, match }, excludedByTitle),
    )
  }

  for (const m of data.manualSessions) {
    const id: SessionId = `man:${m.id}`
    const clientId = data.overrides[id]?.clientId ?? m.clientId
    const start = new Date(m.start)
    const title = m.note ?? ''
    sessions.push(finish({ id, source: 'manual', title, key: titleKey(title), start, durationMinutes: m.durationMinutes, clientId }, false))
  }

  function finish(
    s: Omit<LedgerSession, 'date' | 'excluded' | 'beforeTracking' | 'computedCents' | 'amountCents' | 'paymentId'>,
    excludedByDefault: boolean,
  ): LedgerSession {
    const override = data.overrides[s.id]
    const date = toIsoDate(s.start)
    const { trackFrom } = data.settings
    const client = s.clientId ? clients.get(s.clientId) : undefined
    const rate = client && rateAt(client, date)
    const computedCents = rate === undefined ? undefined : amountForDuration(s.durationMinutes, rate)
    return {
      ...s,
      date,
      // Un'esclusione o reinclusione esplicita vince sul titolo escluso.
      excluded: override?.excluded ?? excludedByDefault,
      // Le sessioni inserite a mano contano sempre: le hai aggiunte apposta.
      beforeTracking: s.source === 'calendar' && trackFrom !== undefined && date < trackFrom,
      computedCents,
      amountCents: override?.amountCents ?? computedCents,
      paymentId: paymentOf.get(s.id),
    }
  }

  sessions.sort((a, b) => a.start.getTime() - b.start.getTime())

  const byId = new Map(sessions.map((s) => [s.id, s]))
  const anomalies: Anomaly[] = []
  for (const payment of data.payments) {
    for (const item of payment.items) {
      const current = byId.get(item.sessionId)
      const start = new Date(item.start)
      if (!current) {
        // Una sessione manuale non può sparire da sola; un evento sì, ma lo diciamo
        // solo se cadeva nel periodo letto.
        const inWindow = start >= window.from && start < window.to
        if (item.sessionId.startsWith('cal:') && inWindow) {
          anomalies.push({ kind: 'paid-session-missing', paymentId: payment.id, sessionId: item.sessionId, start: item.start })
        }
      } else if (current.durationMinutes !== item.durationMinutes) {
        anomalies.push({
          kind: 'paid-session-changed',
          paymentId: payment.id,
          sessionId: item.sessionId,
          paidMinutes: item.durationMinutes,
          currentMinutes: current.durationMinutes,
        })
      }
    }
  }

  return {
    sessions,
    unclassified: sessions.filter((s) => s.source === 'calendar' && !s.excluded && !s.clientId && !s.beforeTracking),
    excluded: sessions.filter((s) => s.excluded && !s.beforeTracking),
    anomalies,
  }
}

export interface ClientSummary {
  client: Client
  /** Tutte le sessioni non pagate, dalla più vecchia. */
  unpaid: LedgerSession[]
  /** Quelle da mostrare e incassare: da `payFrom` in poi, se impostato. */
  due: LedgerSession[]
  dueMinutes: number
  dueCents: number
  /** Sessioni in `due` senza importo, perché manca una tariffa per la loro data. */
  missingRate: number
  /** Sessioni non pagate prima di `payFrom`: nascoste dalla vista, ma non dimenticate. */
  unpaidBeforePayFrom: number
}

/**
 * Una sessione ancora da incassare: del cliente, non esclusa, non pagata, e successiva
 * alla data "traccia dal". Fa eccezione un "pagare da" più vecchio: chi lo imposta sta
 * dicendo che quel cliente deve pagare anche sessioni precedenti.
 */
function isOutstanding(s: LedgerSession, client: Client): boolean {
  if (s.clientId !== client.id || s.excluded || s.paymentId) return false
  return !s.beforeTracking || (client.payFrom !== undefined && s.date >= client.payFrom)
}

export function summarizeClient(ledger: Ledger, client: Client): ClientSummary {
  const unpaid = ledger.sessions.filter((s) => isOutstanding(s, client))
  const payFrom = client.payFrom
  const due = payFrom ? unpaid.filter((s) => s.date >= payFrom) : unpaid
  return {
    client,
    unpaid,
    due,
    dueMinutes: due.reduce((sum, s) => sum + s.durationMinutes, 0),
    dueCents: due.reduce((sum, s) => sum + (s.amountCents ?? 0), 0),
    missingRate: due.filter((s) => s.amountCents === undefined).length,
    unpaidBeforePayFrom: unpaid.length - due.length,
  }
}

/** Le prime N sessioni dovute, dalla più vecchia: per "pagate N lezioni". */
export function oldestDue(summary: ClientSummary, count: number): LedgerSession[] {
  return summary.due.slice(0, Math.max(0, count))
}
