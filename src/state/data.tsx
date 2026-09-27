import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { toast } from 'sonner'
import type { DuetrackData } from '@/core/model'
import type { Change } from '@/core/sync'
import { DEMO } from '@/demo'
import { createDataFile, findDataFile, getVersion, readDataFile, updateDataFile } from '@/google/drive'
import { useAuth } from './auth'
import { loadData, loadSyncMeta, saveData, saveSyncMeta } from './storage'
import { type DriveApi, SyncEngine, type SyncStatus } from './syncEngine'

export type { SyncStatus }

interface DataContextValue {
  data: DuetrackData
  /**
   * Applica una modifica (una delle funzioni pure di core/actions), salva e sincronizza.
   * Restituisce false se la modifica è stata rifiutata; il motivo è già mostrato all'utente.
   */
  apply: (change: Change) => boolean
  sync: SyncStatus
  /** La prima sincronizzazione di questa sessione è conclusa (bene o male). */
  initialSyncDone: boolean
  syncNow: () => void
  /** In caso di conflitto: quale versione tenere. */
  resolveConflict: (keep: 'drive' | 'device') => void
}

const DataContext = createContext<DataContextValue | null>(null)

const drive: DriveApi = {
  find: findDataFile,
  getVersion,
  read: readDataFile,
  create: createDataFile,
  update: updateDataFile,
}

// Attesa dopo l'ultima modifica prima di scrivere su Drive: più modifiche ravvicinate
// (es. crea cliente e aggiungi alias) finiscono in una sola scrittura.
const PUSH_DELAY_MS = 1000

export function DataProvider({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const [engine, setEngine] = useState<SyncEngine>()
  const [loadError, setLoadError] = useState<string>()

  useEffect(() => {
    loadData()
      .then(async (data) => ({ data, meta: await loadSyncMeta(data) }))
      .then(({ data, meta }) =>
        setEngine(
          new SyncEngine({
            data,
            meta,
            drive,
            saveData: (d) => saveData(d).catch(() => toast.error('Salvataggio non riuscito su questo dispositivo')),
            saveMeta: (m) => saveSyncMeta(m).catch(() => {}),
            notify: (kind, message) => (kind === 'error' ? toast.error(message) : toast.warning(message)),
            onUnauthorized: signOut,
          }),
        ),
      )
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)))
  }, [signOut])

  if (loadError) return <p className="p-6 text-destructive">Impossibile leggere i dati salvati: {loadError}</p>
  if (!engine) return null
  return <EngineBridge engine={engine}>{children}</EngineBridge>
}

/** Collega il motore a React: lo legge, e lo fa sincronizzare quando serve. */
function EngineBridge({ engine, children }: { engine: SyncEngine; children: ReactNode }) {
  const { token } = useAuth()
  // useSyncExternalStore è il modo previsto da React per leggere uno stato che vive fuori
  // da React: ridisegna quando il motore pubblica una nuova fotografia.
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  const pushTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const syncNow = useCallback(() => {
    if (!DEMO && token) void engine.sync(token)
  }, [engine, token])

  const apply = useCallback(
    (change: Change) => {
      const applied = engine.apply(change)
      if (applied && !DEMO) {
        clearTimeout(pushTimer.current)
        pushTimer.current = setTimeout(syncNow, PUSH_DELAY_MS)
      }
      return applied
    },
    [engine, syncNow],
  )

  const resolveConflict = useCallback(
    (keep: 'drive' | 'device') => {
      if (token) void engine.resolveConflict(keep, token)
    },
    [engine, token],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      ...snapshot,
      // La demo non ha un Drive: i dati restano solo qui.
      sync: DEMO ? { state: 'off' } : snapshot.sync,
      initialSyncDone: DEMO || snapshot.initialSyncDone,
      syncNow,
      apply,
      resolveConflict,
    }),
    [snapshot, syncNow, apply, resolveConflict],
  )

  // Si sincronizza al login, quando l'app torna in primo piano (magari dopo averla usata
  // da un altro dispositivo) e quando torna la rete.
  useEffect(() => {
    syncNow()
    const onVisible = () => document.visibilityState === 'visible' && syncNow()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', syncNow)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', syncNow)
    }
  }, [syncNow])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData va usato dentro DataProvider')
  return value
}
