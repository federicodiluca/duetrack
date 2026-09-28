// Le modifiche ai dati: funzioni pure che ricevono lo stato e restituiscono uno stato
// nuovo, senza toccare quello vecchio. Si adatta bene a React (un oggetto nuovo fa
// ripartire il render) e al salvataggio su Drive (si confronta e si salva lo stato intero).
// Gli id si passano da fuori, così le funzioni restano deterministiche e testabili.

import type { LedgerSession } from './ledger'
import type { Client, DuetrackData, IsoDate, ManualSession, Payment, Rate, SessionId, SessionOverride, Settings } from './model'
import { titleKey } from './title'

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
    throw new ActionError('L’importo deve essere un numero intero di centesimi, non negativo')
  }
  return setOverride(data, sessionId, { amountCents })
}

/** Nota su una sessione; vuota la toglie. */
export function setSessionNote(data: DuetrackData, sessionId: SessionId, note: string): DuetrackData {
  return setOverride(data, sessionId, { note: note.trim() || undefined })
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

export function updateSettings(data: DuetrackData, patch: Partial<Settings>): DuetrackData {
  return { ...data, settings: { ...data.settings, ...patch } }
}

/** Aggiunge un alias: da quel momento i titoli con quel nome vanno a quel cliente. */
export function addAlias(data: DuetrackData, clientId: string, alias: string): DuetrackData {
  assertClient(data, clientId)
  const key = titleKey(alias)
  if (!key) throw new ActionError('L’alias è vuoto')
  const owner = data.clients.find((c) => [c.name, ...c.aliases].some((n) => titleKey(n) === key))
  if (owner?.id === clientId) return data
  if (owner) throw new ActionError(`"${alias}" è già il nome o un alias di ${owner.name}`)
  const client = data.clients.find((c) => c.id === clientId)!
  return updateClient(data, clientId, { aliases: [...client.aliases, alias.trim()] })
}

/** Segna un titolo come "mai una sessione", o lo toglie da quella lista. */
export function excludeTitle(data: DuetrackData, key: string, excluded = true): DuetrackData {
  const others = data.settings.excludedTitles.filter((k) => k !== key)
  return updateSettings(data, { excludedTitles: excluded ? [...others, key] : others })
}

/** Aggiunge una tariffa valida da una data; se ce n'è già una con la stessa data la sostituisce. */
export function setRate(data: DuetrackData, clientId: string, rate: Rate): DuetrackData {
  assertClient(data, clientId)
  if (!Number.isInteger(rate.centsPerHour) || rate.centsPerHour < 0) throw new ActionError('Tariffa non valida')
  const client = data.clients.find((c) => c.id === clientId)!
  const rates = [...client.rates.filter((r) => r.from !== rate.from), rate].sort((a, b) => a.from.localeCompare(b.from))
  return updateClient(data, clientId, { rates })
}

export function removeRate(data: DuetrackData, clientId: string, from: IsoDate): DuetrackData {
  assertClient(data, clientId)
  const client = data.clients.find((c) => c.id === clientId)!
  return updateClient(data, clientId, { rates: client.rates.filter((r) => r.from !== from) })
}

/** Elimina un cliente senza storico. Con pagamenti o sessioni manuali si rifiuta: si perderebbero dati. */
export function deleteClient(data: DuetrackData, clientId: string): DuetrackData {
  assertClient(data, clientId)
  if (data.payments.some((p) => p.clientId === clientId)) throw new ActionError('Il cliente ha dei pagamenti registrati')
  if (data.manualSessions.some((m) => m.clientId === clientId)) {
    throw new ActionError('Il cliente ha delle sessioni inserite a mano')
  }
  let next: DuetrackData = { ...data, clients: data.clients.filter((c) => c.id !== clientId) }
  for (const [sessionId, override] of Object.entries(data.overrides) as [SessionId, SessionOverride][]) {
    if (override.clientId === clientId) next = setOverride(next, sessionId, { clientId: undefined })
  }
  return next
}
