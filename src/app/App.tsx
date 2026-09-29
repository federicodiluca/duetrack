import { lazy, Suspense } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { AuthProvider, useAuth } from '@/state/auth'
import { DataProvider, useData } from '@/state/data'
import { SignInScreen } from './SignInScreen'

// Caricate solo quando servono: la schermata di accesso resta leggera e si apre prima.
const MainApp = lazy(() => import('./MainApp'))
const SetupScreen = lazy(() => import('./SetupScreen').then((m) => ({ default: m.SetupScreen })))
const ConflictDialog = lazy(() => import('@/components/ConflictDialog').then((m) => ({ default: m.ConflictDialog })))

function Waiting({ text }: { text: string }) {
  return <main className="grid min-h-dvh place-items-center text-muted-foreground">{text}</main>
}

function Gate() {
  const { token } = useAuth()
  const { data, initialSyncDone } = useData()

  if (!token) return <SignInScreen />
  if (!data.settings.calendarId || !data.settings.trackFrom) {
    // Su un dispositivo nuovo la configurazione può già essere su Drive: prima si guarda lì.
    if (!initialSyncDone) return <Waiting text="Cerco i tuoi dati su Google Drive…" />
    return <SetupScreen />
  }
  return <MainApp />
}

/** La finestra "quale versione tieni?": il suo codice si scarica solo se serve. */
function Conflict() {
  const { sync } = useData()
  return sync.state === 'conflict' ? <ConflictDialog /> : null
}

export default function App() {
  return (
    <AuthProvider>
      {/* Mentre legge i dati locali mostra già la home: all'avvio non c'è mai un token (vive solo
          in memoria), e così la home scritta nell'HTML dal prerender non sparisce per un attimo. */}
      <DataProvider loading={<SignInScreen />}>
        <Suspense fallback={<Waiting text="Carico Duetrack…" />}>
          <Gate />
          <Conflict />
        </Suspense>
      </DataProvider>
      <Toaster position="bottom-center" />
      {/* In demo e in sviluppo il service worker non c'è. */}
      {import.meta.env.PROD && <UpdatePrompt />}
    </AuthProvider>
  )
}
