import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ActionError } from '@/core/actions'
import type { DuetrackData } from '@/core/model'
import { loadData, saveData } from './storage'

interface DataContextValue {
  data: DuetrackData
  /**
   * Applica una modifica (una delle funzioni pure di core/actions) e salva.
   * Restituisce false se la modifica è stata rifiutata; il motivo è già mostrato all'utente.
   */
  apply: (change: (data: DuetrackData) => DuetrackData) => boolean
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DuetrackData>()
  const [loadError, setLoadError] = useState<string>()
  // Lo stato più recente, letto in modo sincrono: due modifiche nello stesso evento
  // (es. crea cliente + aggiungi alias) devono vedersi a vicenda.
  const current = useRef<DuetrackData>(undefined)

  useEffect(() => {
    loadData()
      .then((loaded) => {
        current.current = loaded
        setData(loaded)
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)))
  }, [])

  const apply = useCallback((change: (data: DuetrackData) => DuetrackData) => {
    if (!current.current) return false
    let next: DuetrackData
    try {
      next = change(current.current)
    } catch (e) {
      if (e instanceof ActionError) {
        toast.error(e.message)
        return false
      }
      throw e
    }
    current.current = next
    setData(next)
    saveData(next).catch(() => toast.error('Salvataggio non riuscito: la modifica potrebbe andare persa alla chiusura'))
    return true
  }, [])

  if (loadError) {
    return <p className="p-6 text-destructive">Impossibile leggere i dati salvati: {loadError}</p>
  }
  if (!data) return null

  return <DataContext.Provider value={{ data, apply }}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData va usato dentro DataProvider')
  return value
}
