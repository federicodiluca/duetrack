// I dati che Duetrack salva (ADR 0003, 0005). Il calendario resta la fonte di date e
// durate: qui ci sono solo clienti, correzioni manuali e pagamenti.
// Tutto è serializzabile in JSON così com'è: niente Date, Map o classi.

export const SCHEMA_VERSION = 1

/** Data di calendario nel fuso locale, "YYYY-MM-DD": si confronta come stringa. */
export type IsoDate = string

/** "cal:<id evento Google>" oppure "man:<id sessione manuale>". */
export type SessionId = `cal:${string}` | `man:${string}`

/** Data di inizio di una tariffa valida "da sempre": precede qualunque sessione. */
export const SINCE_ALWAYS: IsoDate = '0000-01-01'

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
  /** Appunti liberi: contatti, accordi, cose da ricordare. */
  note?: string
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

export interface Settings {
  /** Il calendario da cui leggere le sessioni. */
  calendarId?: string
  /** Da quando tracciare: gli eventi precedenti non vengono letti, si considerano già sistemati. */
  trackFrom?: IsoDate
  /** Parole da togliere dai titoli prima del confronto, es. "ripetizioni". */
  ignoredWords: string[]
  /** Titoli (chiavi normalizzate) che non sono mai sessioni, es. "riunione". */
  excludedTitles: string[]
}

export interface DuetrackData {
  schemaVersion: typeof SCHEMA_VERSION
  currency: string
  settings: Settings
  clients: Client[]
  manualSessions: ManualSession[]
  overrides: Partial<Record<SessionId, SessionOverride>>
  payments: Payment[]
}

export function emptyData(): DuetrackData {
  return {
    schemaVersion: SCHEMA_VERSION,
    currency: 'EUR',
    settings: { ignoredWords: [], excludedTitles: [] },
    clients: [],
    manualSessions: [],
    overrides: {},
    payments: [],
  }
}

/**
 * Controlla dati letti da fuori (IndexedDB, file su Drive) e completa i campi aggiunti
 * dopo il loro salvataggio con i valori di default. Lancia un errore se non sono dati Duetrack.
 */
export function normalizeData(value: unknown): DuetrackData {
  const stored = value as Partial<DuetrackData> | null
  if (!stored || typeof stored !== 'object' || !Array.isArray(stored.clients) || !Array.isArray(stored.payments)) {
    throw new Error('Il file non contiene dati di Duetrack')
  }
  if (stored.schemaVersion !== SCHEMA_VERSION) {
    // Nessuna migrazione esiste ancora: la prima servirà quando cambierà il formato.
    throw new Error(`Formato dei dati non supportato (versione ${stored.schemaVersion})`)
  }
  const empty = emptyData()
  return { ...empty, ...stored, settings: { ...empty.settings, ...stored.settings } } as DuetrackData
}

/** La data locale di un istante, come IsoDate. */
export function toIsoDate(date: Date): IsoDate {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
