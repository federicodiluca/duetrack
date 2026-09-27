// Le modifiche ai dati: funzioni pure che ricevono lo stato e restituiscono uno stato
// nuovo, senza toccare quello vecchio. Si adatta bene a React (un oggetto nuovo fa
// ripartire il render) e al salvataggio su Drive (si confronta e si salva lo stato intero).
// Gli id si passano da fuori, così le funzioni restano deterministiche e testabili.

import type { LedgerSession } from './ledger'
import type { Client, DuetrackData, IsoDate, ManualSession, Payment, SessionId, SessionOverride } from './model'

export class ActionError extends Error {}

function assertClient(data: DuetrackData, clientId: string) {
  if (!data.clients.some((c) => c.id === clientId)) throw new ActionError(`Cliente sconosciuto: ${clientId}`)
}

export function addClient(data: DuetrackData, client: Client): DuetrackData {
  if (data.clients.some((c) => c.id === client.id)) throw new ActionError(`Cliente già presente: ${client.id}`)
  return { ...data, clients: [...data.clients, client] }
}

export function updateClient(data: DuetrackData, clientId: string, patch: Partial<Omit<Client, 'id'>>): DuetrackData {
  assertClient(data, clientId)
  return { ...data, clients: data.clients.map((c) => (c.id === clientId ? { ...c, ...patch } : c)) }
}

export function setPayFrom(data: DuetrackData, clientId: string, payFrom: IsoDate | undefined): DuetrackData {
  return updateClient(data, clientId, { payFrom })
}

/** Segna pagate le sessioni indicate, tutte non pagate e dello stesso cliente. */
export function recordPayment(
  data: DuetrackData,
  payment: { id: string; clientId: string; date: IsoDate; note?: string },
  sessions: LedgerSession[],
): DuetrackData {
  assertClient(data, payment.clientId)
  if (sessions.length === 0) throw new ActionError('Nessuna sessione da segnare pagata')
  for (const s of sessions) {
    if (s.clientId !== payment.clientId) throw new ActionError(`La sessione ${s.id} non è di questo cliente`)
    if (s.paymentId) throw new ActionError(`La sessione ${s.id} è già pagata`)
    if (s.excluded) throw new ActionError(`La sessione ${s.id} è esclusa`)
    if (s.amountCents === undefined) throw new ActionError(`La sessione ${s.id} non ha un importo: manca la tariffa`)
  }
  const record: Payment = {
    ...payment,
    items: sessions.map((s) => ({
      sessionId: s.id,
      start: s.start.toISOString(),
      durationMinutes: s.durationMinutes,
      amountCents: s.amountCents!,
    })),
  }
  return { ...data, payments: [...data.payments, record] }
}

/** Annulla un pagamento: tutte le sue sessioni tornano da pagare. */
export function undoPayment(data: DuetrackData, paymentId: string): DuetrackData {
  if (!data.payments.some((p) => p.id === paymentId)) throw new ActionError(`Pagamento sconosciuto: ${paymentId}`)
  return { ...data, payments: data.payments.filter((p) => p.id !== paymentId) }
}

/** Applica una correzione; i campi a undefined vengono tolti, e una correzione vuota sparisce. */
export function setOverride(data: DuetrackData, sessionId: SessionId, patch: SessionOverride): DuetrackData {
  const merged: SessionOverride = { ...data.overrides[sessionId], ...patch }
  for (const key of Object.keys(merged) as (keyof SessionOverride)[]) {
    if (merged[key] === undefined) delete merged[key]
  }
  const overrides = { ...data.overrides }
  if (Object.keys(merged).length === 0) delete overrides[sessionId]
  else overrides[sessionId] = merged
  return { ...data, overrides }
}

export function excludeSession(data: DuetrackData, sessionId: SessionId, excluded = true): DuetrackData {
  return setOverride(data, sessionId, { excluded: excluded || undefined })
}

export function assignSession(data: DuetrackData, sessionId: SessionId, clientId: string | undefined): DuetrackData {
  if (clientId) assertClient(data, clientId)
  return setOverride(data, sessionId, { clientId })
}

export function setAmount(data: DuetrackData, sessionId: SessionId, amountCents: number | undefined): DuetrackData {
  if (amountCents !== undefined && (!Number.isInteger(amountCents) || amountCents < 0)) {
    throw new ActionError('L\'importo deve essere un numero intero di centesimi, non negativo')
  }
  return setOverride(data, sessionId, { amountCents })
}

export function addManualSession(data: DuetrackData, session: ManualSession): DuetrackData {
  assertClient(data, session.clientId)
  if (session.durationMinutes <= 0) throw new ActionError('La durata deve essere positiva')
  return { ...data, manualSessions: [...data.manualSessions, session] }
}

export function removeManualSession(data: DuetrackData, id: string): DuetrackData {
  const sessionId: SessionId = `man:${id}`
  if (data.payments.some((p) => p.items.some((i) => i.sessionId === sessionId))) {
    throw new ActionError('La sessione è in un pagamento: annulla prima il pagamento')
  }
  return setOverride({ ...data, manualSessions: data.manualSessions.filter((m) => m.id !== id) }, sessionId, {
    clientId: undefined,
    excluded: undefined,
    amountCents: undefined,
    note: undefined,
  })
}
