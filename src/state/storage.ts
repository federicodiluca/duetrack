// Salvataggio locale su IndexedDB (ADR 0003). I dati sono un solo documento JSON, quindi
// basta un archivio chiave-valore: idb-keyval nasconde le API di IndexedDB, verbose e
// basate su eventi, dietro un get/set con le Promise.

import { get, set } from 'idb-keyval'
import { type DuetrackData, emptyData, normalizeData } from '@/core/model'
import { isEmptyData } from '@/core/sync'
import { DEMO } from '@/demo'

// La demo salva altrove, per non mescolare dati inventati con quelli veri.
const DATA_KEY = DEMO ? 'duetrack.demo' : 'duetrack.data'
const SYNC_KEY = 'duetrack.sync'

/** Dove siamo rispetto al file su Drive: sopravvive alla chiusura dell'app. */
export interface SyncMeta {
  fileId?: string
  /** Versione del file su Drive da cui partono i dati locali. */
  baseVersion?: string
  /** Modifiche locali non ancora scritte su Drive. */
  dirty: boolean
}

export async function loadData(): Promise<DuetrackData> {
  const stored = await get<unknown>(DATA_KEY)
  return stored === undefined ? emptyData() : normalizeData(stored)
}

export async function saveData(data: DuetrackData): Promise<void> {
  await set(DATA_KEY, data)
}

/**
 * Lo stato di sincronizzazione salvato. Se manca (dati creati prima che la
 * sincronizzazione esistesse) non si può sapere se sono già su Drive: se non sono vuoti
 * si trattano come modifiche non salvate, così un file già presente su Drive non li
 * sostituisce in silenzio ma fa scegliere all'utente.
 */
export async function loadSyncMeta(data: DuetrackData): Promise<SyncMeta> {
  return (await get<SyncMeta>(SYNC_KEY)) ?? { dirty: !isEmptyData(data) }
}

export async function saveSyncMeta(meta: SyncMeta): Promise<void> {
  await set(SYNC_KEY, meta)
}
