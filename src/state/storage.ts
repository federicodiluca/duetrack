// Salvataggio locale su IndexedDB (ADR 0003). I dati sono un solo documento JSON, quindi
// basta un archivio chiave-valore: idb-keyval nasconde le API di IndexedDB, verbose e
// basate su eventi, dietro un get/set con le Promise.

import { get, set } from 'idb-keyval'
import { type DuetrackData, emptyData, SCHEMA_VERSION } from '@/core/model'
import { DEMO } from '@/demo'

// La demo salva altrove, per non mescolare dati inventati con quelli veri.
const KEY = DEMO ? 'duetrack.demo' : 'duetrack.data'

export async function loadData(): Promise<DuetrackData> {
  const stored = await get<DuetrackData>(KEY)
  if (!stored) return emptyData()
  if (stored.schemaVersion !== SCHEMA_VERSION) {
    // Nessuna migrazione esiste ancora: la prima servirà quando cambierà il formato.
    throw new Error(`Formato dei dati non supportato (versione ${stored.schemaVersion})`)
  }
  // Campi aggiunti dopo i primi salvataggi prendono il valore di default.
  const empty = emptyData()
  return { ...empty, ...stored, settings: { ...empty.settings, ...stored.settings } }
}

export async function saveData(data: DuetrackData): Promise<void> {
  await set(KEY, data)
}
