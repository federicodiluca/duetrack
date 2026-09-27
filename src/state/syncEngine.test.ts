import { describe, expect, it, vi } from 'vitest'
import { addClient } from '@/core/actions'
import { type Client, type DuetrackData, emptyData } from '@/core/model'
import { GoogleApiError } from '@/google/http'
import type { SyncMeta } from './storage'
import { type DriveApi, SyncEngine } from './syncEngine'

const TOKEN = 'token'
const client = (id: string): Client => ({ id, name: id, aliases: [], rates: [] })
const ids = (data: DuetrackData) => data.clients.map((c) => c.id).sort()

/** Un Drive in memoria: un solo file, versione che cresce a ogni scrittura, dati in JSON. */
class FakeDrive implements DriveApi {
  file?: { id: string; version: number; json: string }
  offline = false
  unauthorized = false
  /** Eseguita a metà di una scrittura, per simulare quello che succede nel frattempo. */
  duringUpdate?: () => void

  private check() {
    if (this.offline) throw new TypeError('Failed to fetch')
    if (this.unauthorized) throw new GoogleApiError(401, 'Invalid Credentials')
  }

  get content(): DuetrackData {
    return JSON.parse(this.file!.json)
  }

  async find() {
    this.check()
    return this.file ? { id: this.file.id, version: String(this.file.version) } : null
  }

  async getVersion(_token: string, fileId: string) {
    this.check()
    return this.file?.id === fileId ? String(this.file.version) : null
  }

  async read() {
    this.check()
    return JSON.parse(this.file!.json)
  }

  async create(_token: string, data: DuetrackData) {
    this.check()
    this.file = { id: 'file-1', version: 1, json: JSON.stringify(data) }
    return { id: this.file.id, version: '1' }
  }

  async update(_token: string, _fileId: string, data: DuetrackData) {
    this.check()
    this.duringUpdate?.()
    this.file = { ...this.file!, version: this.file!.version + 1, json: JSON.stringify(data) }
    return String(this.file.version)
  }

  /** Un altro dispositivo scrive direttamente il file. */
  writeFromElsewhere(change: (data: DuetrackData) => DuetrackData) {
    this.file = { ...this.file!, version: this.file!.version + 1, json: JSON.stringify(change(this.content)) }
  }
}

function device(drive: FakeDrive, data = emptyData(), meta: SyncMeta = { dirty: false }) {
  const notify = vi.fn()
  const onUnauthorized = vi.fn()
  const saved: { meta?: SyncMeta } = {}
  const engine = new SyncEngine({
    data,
    meta,
    drive,
    saveData: () => {},
    saveMeta: (m) => (saved.meta = m),
    notify,
    onUnauthorized,
  })
  return { engine, notify, onUnauthorized, saved, state: () => engine.getSnapshot() }
}

describe('SyncEngine', () => {
  it('creates the file on first sync and reports it synced', async () => {
    const drive = new FakeDrive()
    const pc = device(drive)
    pc.engine.apply((d) => addClient(d, client('luca')))
    await pc.engine.sync(TOKEN)

    expect(ids(drive.content)).toEqual(['luca'])
    expect(pc.state().sync.state).toBe('synced')
    expect(pc.saved.meta).toEqual({ fileId: 'file-1', baseVersion: '1', dirty: false })
  })

  it('adopts the Drive data on a new device', async () => {
    const drive = new FakeDrive()
    const pc = device(drive)
    pc.engine.apply((d) => addClient(d, client('luca')))
    await pc.engine.sync(TOKEN)

    const phone = device(drive)
    await phone.engine.sync(TOKEN)
    expect(ids(phone.state().data)).toEqual(['luca'])
  })

  it('replays local changes on top of changes made on another device', async () => {
    const drive = new FakeDrive()
    const pc = device(drive)
    await pc.engine.sync(TOKEN)

    drive.writeFromElsewhere((d) => addClient(d, client('marta')))
    pc.engine.apply((d) => addClient(d, client('luca')))
    await pc.engine.sync(TOKEN)

    expect(ids(drive.content)).toEqual(['luca', 'marta'])
    expect(ids(pc.state().data)).toEqual(['luca', 'marta'])
    expect(pc.saved.meta?.dirty).toBe(false)
  })

  it('drops a replayed change that no longer applies, and says so', async () => {
    const drive = new FakeDrive()
    const pc = device(drive)
    await pc.engine.sync(TOKEN)

    // Stesso cliente creato anche dal telefono: il secondo addClient è rifiutato.
    drive.writeFromElsewhere((d) => addClient(d, client('luca')))
    pc.engine.apply((d) => addClient(d, client('luca')))
    await pc.engine.sync(TOKEN)

    expect(ids(drive.content)).toEqual(['luca'])
    expect(pc.notify).toHaveBeenCalledWith('warning', expect.stringContaining('1 modifica non applicata'))
  })

  it('keeps changes made while a write is in progress, and writes them too', async () => {
    const drive = new FakeDrive()
    const pc = device(drive)
    await pc.engine.sync(TOKEN)

    pc.engine.apply((d) => addClient(d, client('luca')))
    drive.duringUpdate = () => {
      drive.duringUpdate = undefined
      pc.engine.apply((d) => addClient(d, client('marta')))
    }
    await pc.engine.sync(TOKEN)

    expect(ids(drive.content)).toEqual(['luca', 'marta'])
    expect(pc.saved.meta?.dirty).toBe(false)
    expect(pc.state().sync.state).toBe('synced')
  })

  it('goes offline without losing changes, and pushes them when back online', async () => {
    const drive = new FakeDrive()
    const pc = device(drive)
    await pc.engine.sync(TOKEN)

    drive.offline = true
    pc.engine.apply((d) => addClient(d, client('luca')))
    await pc.engine.sync(TOKEN)
    expect(pc.state().sync.state).toBe('offline')
    expect(pc.saved.meta?.dirty).toBe(true)

    drive.offline = false
    await pc.engine.sync(TOKEN)
    expect(ids(drive.content)).toEqual(['luca'])
    expect(pc.state().sync.state).toBe('synced')
  })

  it('asks which version to keep when unsynced changes cannot be replayed', async () => {
    const drive = new FakeDrive()
    const first = device(drive)
    await first.engine.sync(TOKEN)
    drive.writeFromElsewhere((d) => addClient(d, client('marta')))

    // L'app riaperta con modifiche non salvate: la coda delle modifiche non c'è più.
    const reopened = () => device(drive, addClient(emptyData(), client('luca')), { fileId: 'file-1', baseVersion: '1', dirty: true })

    const keepDrive = reopened()
    await keepDrive.engine.sync(TOKEN)
    expect(keepDrive.state().sync.state).toBe('conflict')
    await keepDrive.engine.resolveConflict('drive', TOKEN)
    expect(ids(keepDrive.state().data)).toEqual(['marta'])
    expect(ids(drive.content)).toEqual(['marta'])

    const keepDevice = reopened()
    await keepDevice.engine.sync(TOKEN)
    await keepDevice.engine.resolveConflict('device', TOKEN)
    expect(ids(drive.content)).toEqual(['luca'])
    expect(keepDevice.state().sync.state).toBe('synced')
  })

  it('does not silently replace data created before sync existed', async () => {
    const drive = new FakeDrive()
    const phone = device(drive)
    phone.engine.apply((d) => addClient(d, client('marta')))
    await phone.engine.sync(TOKEN)

    // Il PC ha dati di prima della sincronizzazione: storage.loadSyncMeta li segna dirty.
    const pc = device(drive, addClient(emptyData(), client('luca')), { dirty: true })
    await pc.engine.sync(TOKEN)
    expect(pc.state().sync.state).toBe('conflict')
    expect(ids(pc.state().data)).toEqual(['luca'])
    expect(ids(drive.content)).toEqual(['marta'])
  })

  it('recreates the file if it was deleted from Drive', async () => {
    const drive = new FakeDrive()
    const pc = device(drive)
    pc.engine.apply((d) => addClient(d, client('luca')))
    await pc.engine.sync(TOKEN)

    drive.file = undefined
    await pc.engine.sync(TOKEN)
    expect(ids(drive.content)).toEqual(['luca'])
  })

  it('hands a 401 back to the sign-in flow', async () => {
    const drive = new FakeDrive()
    drive.unauthorized = true
    const pc = device(drive)
    await pc.engine.sync(TOKEN)
    expect(pc.onUnauthorized).toHaveBeenCalled()
    expect(pc.state().initialSyncDone).toBe(true)
  })

  it('reports a rejected change instead of applying it', () => {
    const pc = device(new FakeDrive(), addClient(emptyData(), client('luca')))
    expect(pc.engine.apply((d) => addClient(d, client('luca')))).toBe(false)
    expect(pc.notify).toHaveBeenCalledWith('error', expect.any(String))
  })
})
