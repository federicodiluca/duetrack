// Il motore dei dati: tiene lo stato, applica le modifiche e lo sincronizza con Drive
// (ADR 0003). È una classe senza React, così i test la usano con un Drive finto; React la
// legge con useSyncExternalStore (vedi data.tsx).

import { ActionError } from '@/core/actions'
import type { DuetrackData } from '@/core/model'
import { type Change, isEmptyData, planSync, replayChanges } from '@/core/sync'
import { GoogleApiError } from '@/google/http'
import type { SyncMeta } from './storage'

export type SyncStatus =
  | { state: 'off' }
  | { state: 'syncing' }
  | { state: 'synced'; at: Date }
  | { state: 'pending' }
  | { state: 'offline' }
  | { state: 'error'; message: string }
  | { state: 'conflict' }

/** Le operazioni sul file di Drive: in produzione google/drive.ts, nei test un finto. */
export interface DriveApi {
  find(token: string): Promise<{ id: string; version: string } | null>
  getVersion(token: string, fileId: string): Promise<string | null>
  read(token: string, fileId: string): Promise<DuetrackData>
  create(token: string, data: DuetrackData): Promise<{ id: string; version: string }>
  update(token: string, fileId: string, data: DuetrackData): Promise<string>
}

export interface EngineOptions {
  data: DuetrackData
  meta: SyncMeta
  drive: DriveApi
  /** Salvataggio locale (IndexedDB); gli errori vanno segnalati da chi lo implementa. */
  saveData: (data: DuetrackData) => void
  saveMeta: (meta: SyncMeta) => void
  /** Messaggi per l'utente: modifica rifiutata, modifiche non riapplicabili. */
  notify: (kind: 'error' | 'warning', message: string) => void
  /** Chiamata su 401: il token non vale più. */
  onUnauthorized: () => void
}

export interface EngineSnapshot {
  data: DuetrackData
  sync: SyncStatus
  /** La prima sincronizzazione è conclusa, bene o male. */
  initialSyncDone: boolean
}

export class SyncEngine {
  private data: DuetrackData
  private meta: SyncMeta
  /** Le modifiche fatte dopo meta.baseVersion: si riapplicano se Drive è andato avanti. */
  private pending: Change[] = []
  private conflict?: { fileId: string; version: string; data: DuetrackData }
  private running = false
  private rerun = false
  private snapshot: EngineSnapshot
  private listeners = new Set<() => void>()
  private readonly options: EngineOptions

  constructor(options: EngineOptions) {
    this.options = options
    this.data = options.data
    this.meta = options.meta
    this.snapshot = { data: this.data, sync: { state: 'off' }, initialSyncDone: false }
  }

  // --- Interfaccia per useSyncExternalStore -------------------------------------------

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Sempre lo stesso oggetto finché non cambia qualcosa: React confronta per identità. */
  getSnapshot = () => this.snapshot

  private publish(patch: Partial<EngineSnapshot>) {
    this.snapshot = { ...this.snapshot, data: this.data, ...patch }
    for (const listener of this.listeners) listener()
  }

  // --- Modifiche locali ---------------------------------------------------------------

  /** Applica una modifica e la mette in coda per Drive. False se la modifica è rifiutata. */
  apply(change: Change): boolean {
    let next: DuetrackData
    try {
      next = change(this.data)
    } catch (e) {
      if (!(e instanceof ActionError)) throw e
      this.options.notify('error', e.message)
      return false
    }
    this.setData(next)
    this.pending.push(change)
    this.setMeta({ dirty: true })
    const busy = this.snapshot.sync.state === 'syncing' || this.snapshot.sync.state === 'conflict'
    this.publish(busy ? {} : { sync: { state: 'pending' } })
    return true
  }

  private setData(next: DuetrackData) {
    this.data = next
    this.options.saveData(next)
  }

  private setMeta(patch: Partial<SyncMeta>) {
    this.meta = { ...this.meta, ...patch }
    this.options.saveMeta(this.meta)
  }

  // --- Sincronizzazione ---------------------------------------------------------------

  /**
   * Allinea dati locali e file su Drive. Una sola alla volta: una richiesta che arriva
   * mentre un'altra è in corso la fa ripetere alla fine, invece di sovrapporsi.
   */
  async sync(token: string): Promise<void> {
    if (this.conflict) return
    if (this.running) {
      this.rerun = true
      return
    }
    this.running = true
    this.publish({ sync: { state: 'syncing' } })
    try {
      do {
        this.rerun = false
        if (await this.syncOnce(token)) {
          this.publish({ sync: { state: 'conflict' } })
          return
        }
      } while (this.rerun)
      this.publish({ sync: this.meta.dirty ? { state: 'pending' } : { state: 'synced', at: new Date() } })
    } catch (e) {
      if (e instanceof GoogleApiError && e.status === 401) {
        this.options.onUnauthorized()
        this.publish({ sync: { state: 'off' } })
      } else if (e instanceof TypeError) {
        // fetch lancia TypeError quando la rete non c'è: si riprova al ritorno online.
        this.publish({ sync: { state: 'offline' } })
      } else {
        this.publish({ sync: { state: 'error', message: e instanceof Error ? e.message : String(e) } })
      }
    } finally {
      this.running = false
      if (!this.snapshot.initialSyncDone) this.publish({ initialSyncDone: true })
    }
  }

  /** Un giro di sincronizzazione. Restituisce true se serve la scelta dell'utente. */
  private async syncOnce(token: string): Promise<boolean> {
    const { drive } = this.options
    let fileId = this.meta.fileId
    let remoteVersion = fileId ? await drive.getVersion(token, fileId) : null
    if (remoteVersion === null) {
      // Il file ricordato non c'è più, o non c'è mai stato: lo si cerca per nome.
      const found = await drive.find(token)
      fileId = found?.id
      remoteVersion = found?.version ?? null
    }
    const sameFile = fileId !== undefined && fileId === this.meta.fileId

    const plan = planSync(
      {
        dirty: this.meta.dirty,
        baseVersion: sameFile ? this.meta.baseVersion : undefined,
        pendingChanges: this.pending.length,
        localIsEmpty: isEmptyData(this.data),
      },
      remoteVersion,
    )

    switch (plan) {
      case 'noop':
        return false

      case 'create':
      case 'push': {
        // Si scrive una fotografia: le modifiche fatte durante la scrittura restano in coda.
        const written = this.data
        const writtenChanges = this.pending.length
        let version: string
        if (plan === 'create') {
          const created = await drive.create(token, written)
          fileId = created.id
          version = created.version
        } else {
          version = await drive.update(token, fileId!, written)
        }
        this.pending = this.pending.slice(writtenChanges)
        const dirty = this.pending.length > 0 || this.data !== written
        this.setMeta({ fileId, baseVersion: version, dirty })
        this.rerun ||= dirty
        return false
      }

      case 'adopt':
      case 'replay': {
        const remote = await drive.read(token, fileId!)
        // Da qui in poi tutto è sincrono: nessuna modifica può inserirsi a metà.
        if (this.pending.length === 0) {
          this.setData(remote)
          this.setMeta({ fileId, baseVersion: remoteVersion!, dirty: false })
          this.publish({})
          return false
        }
        // Come un rebase: le modifiche locali si riapplicano sopra la versione di Drive, e
        // restano in coda finché non sono scritte, nel caso Drive cambi ancora.
        const { data: merged, rejected } = replayChanges(remote, this.pending)
        this.setData(merged)
        this.setMeta({ fileId, baseVersion: remoteVersion!, dirty: true })
        this.publish({})
        this.rerun = true
        if (rejected > 0) {
          this.options.notify(
            'warning',
            `${rejected === 1 ? '1 modifica non applicata' : `${rejected} modifiche non applicate`}: nel frattempo i dati erano cambiati su un altro dispositivo`,
          )
        }
        return false
      }

      case 'conflict':
        this.conflict = { fileId: fileId!, version: remoteVersion!, data: await drive.read(token, fileId!) }
        return true
    }
  }

  /** Dopo un conflitto: tiene i dati di Drive o quelli di questo dispositivo. */
  resolveConflict(keep: 'drive' | 'device', token: string): Promise<void> {
    const remote = this.conflict
    if (!remote) return Promise.resolve()
    this.conflict = undefined
    this.pending = []
    if (keep === 'drive') {
      this.setData(remote.data)
      this.setMeta({ fileId: remote.fileId, baseVersion: remote.version, dirty: false })
      this.publish({ sync: { state: 'synced', at: new Date() } })
      return Promise.resolve()
    }
    // Si riparte dalla versione di Drive con i dati di qui: la sincronizzazione la sovrascrive.
    this.setMeta({ fileId: remote.fileId, baseVersion: remote.version, dirty: true })
    return this.sync(token)
  }
}
