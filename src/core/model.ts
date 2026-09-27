// I dati che Duetrack salva (ADR 0003, 0005). Il calendario resta la fonte di date e
// durate: qui ci sono solo clienti, correzioni manuali e pagamenti.
// Tutto è serializzabile in JSON così com'è: niente Date, Map o classi.

export const SCHEMA_VERSION = 1

/** Data di calendario nel fuso locale, "YYYY-MM-DD": si confronta come stringa. */
export type IsoDate = string

/** "cal:<id evento Google>" oppure "man:<id sessione manuale>". */
export type SessionId = `cal:${string}` | `man:${string}`

export interface Rate {
  /** Da quando vale questa tariffa (compreso). */
  from: IsoDate
  centsPerHour: number
}

export interface Client {
  id: string
  name: string
  /** Altri modi in cui il cliente compare nei titoli degli eventi, oltre al nome. */
  aliases: string[]
  /** Storico delle tariffe: vale quella con la data `from` più recente non successiva alla sessione. */
  rates: Rate[]
  /** Se impostata, la vista del dovuto parte da questa data. */
  payFrom?: IsoDate
}

/** Una sessione che non è in calendario, inserita a mano. */
export interface ManualSession {
  id: string
  clientId: string
  /** Inizio in formato ISO 8601 completo. */
  start: string
  durationMinutes: number
  note?: string
}

/** Correzioni a mano su una sessione, calendario o manuale che sia. */
export interface SessionOverride {
  /** Assegna la sessione a un cliente, ignorando il titolo dell'evento. */
  clientId?: string
  /** Non è una sessione di lavoro (evento estraneo, lezione annullata). */
  excluded?: boolean
  /** Importo concordato che sostituisce durata × tariffa. */
  amountCents?: number
  note?: string
}

/**
 * Cosa è stato pagato, fotografato al momento del pagamento. La fotografia permette
 * di ricostruire lo storico anche se l'evento viene poi spostato o cancellato, e di
 * accorgersene.
 */
export interface PaidItem {
  sessionId: SessionId
  start: string
  durationMinutes: number
  amountCents: number
}

export interface Payment {
  id: string
  clientId: string
  date: IsoDate
  items: PaidItem[]
  note?: string
}

export interface DuetrackData {
  schemaVersion: typeof SCHEMA_VERSION
  currency: string
  clients: Client[]
  manualSessions: ManualSession[]
  overrides: Partial<Record<SessionId, SessionOverride>>
  payments: Payment[]
}

export function emptyData(): DuetrackData {
  return { schemaVersion: SCHEMA_VERSION, currency: 'EUR', clients: [], manualSessions: [], overrides: {}, payments: [] }
}

/** La data locale di un istante, come IsoDate. */
export function toIsoDate(date: Date): IsoDate {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
