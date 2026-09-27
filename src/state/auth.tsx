import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { CALENDAR_SCOPES, GOOGLE_CLIENT_ID } from '@/config'
import { DEMO } from '@/demo'
import { type AccessToken, requestAccessToken } from '@/google/auth'

interface AuthContextValue {
  /** Il token, se c'è e non sta per scadere. */
  token?: string
  signingIn: boolean
  /** Apre il popup di Google: va chiamata da un click. */
  signIn: () => Promise<void>
  /** Dimentica il token, es. dopo un 401 o per uscire. */
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Un minuto di margine: meglio rifare il login che far fallire una richiesta a metà.
const EXPIRY_MARGIN_MS = 60_000

// Il token vive solo in memoria (vedi ADR 0001): a ogni apertura dell'app si rifà il login.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<AccessToken>()
  const [signingIn, setSigningIn] = useState(false)

  const signIn = useCallback(async () => {
    if (DEMO) return setToken({ value: 'demo', expiresAt: Date.now() + 24 * 3_600_000 })
    setSigningIn(true)
    try {
      setToken(await requestAccessToken(GOOGLE_CLIENT_ID, CALENDAR_SCOPES))
    } finally {
      setSigningIn(false)
    }
  }, [])

  const signOut = useCallback(() => setToken(undefined), [])

  // Alla scadenza il token si dimentica da solo, e l'app torna alla schermata di accesso.
  // Un timer invece di un controllo durante il render: il render deve restare una funzione
  // pura dei dati, e Date.now() darebbe risultati diversi a ogni chiamata.
  useEffect(() => {
    if (!token) return
    const timer = setTimeout(() => setToken(undefined), Math.max(0, token.expiresAt - Date.now() - EXPIRY_MARGIN_MS))
    return () => clearTimeout(timer)
  }, [token])

  return <AuthContext.Provider value={{ token: token?.value, signingIn, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth va usato dentro AuthProvider')
  return value
}
