// Le decisioni della sincronizzazione con Drive (ADR 0003), separate dalle chiamate di rete
// così si possono testare. Il file su Drive ha un numero di versione che Google incrementa
// a ogni modifica: confrontandolo con l'ultima versione sincronizzata si capisce chi ha
// cambiato cosa.

import { ActionError } from './actions'
import type { DuetrackData } from './model'

export type Change = (data: DuetrackData) => DuetrackData

export interface LocalSyncState {
  /** Ci sono modifiche locali non ancora scritte su Drive. */
  dirty: boolean
  /** La versione del file su Drive da cui partono i dati locali; assente se mai sincronizzati. */
  baseVersion?: string
  /** Modifiche di questa sessione non ancora scritte, riapplicabili su un'altra versione. */
  pendingChanges: number
  /** I dati locali non contengono niente: nessun cliente, pagamento o correzione. */
  localIsEmpty: boolean
}

export type SyncPlan =
  /** Nessun file su Drive: si crea con i dati locali. */
  | 'create'
  /** Tutto allineato. */
  | 'noop'
  /** Drive è fermo alla nostra versione: si scrivono le modifiche locali. */
  | 'push'
  /** Drive è più avanti e qui non c'è niente di nuovo: si prendono i dati di Drive. */
  | 'adopt'
  /** Entrambi cambiati, ma le modifiche locali sono note: si riapplicano su Drive e si scrive. */
  | 'replay'
  /** Entrambi cambiati senza modo di unirli: decide l'utente. */
  | 'conflict'

export function planSync(local: LocalSyncState, remoteVersion: string | null): SyncPlan {
  if (remoteVersion === null) return 'create'
  if (local.baseVersion === remoteVersion) return local.dirty ? 'push' : 'noop'
  if (!local.dirty || local.localIsEmpty) return 'adopt'
  if (local.baseVersion !== undefined && local.pendingChanges > 0) return 'replay'
  return 'conflict'
}

/**
 * Riapplica le modifiche locali sopra i dati di Drive, come un rebase. Una modifica che
 * non ha più senso (es. segnare pagata una sessione già pagata dall'altro dispositivo)
 * viene scartata e contata.
 */
export function replayChanges(base: DuetrackData, changes: Change[]): { data: DuetrackData; rejected: number } {
  let data = base
  let rejected = 0
  for (const change of changes) {
    try {
      data = change(data)
    } catch (e) {
      if (!(e instanceof ActionError)) throw e
      rejected++
    }
  }
  return { data, rejected }
}

export function isEmptyData(data: DuetrackData): boolean {
  return (
    data.clients.length === 0 &&
    data.payments.length === 0 &&
    data.manualSessions.length === 0 &&
    Object.keys(data.overrides).length === 0
  )
}
