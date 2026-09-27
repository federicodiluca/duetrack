import { Route, Router, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { Toaster } from '@/components/ui/sonner'
import { ClientPage } from '@/features/client/ClientPage'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { UnclassifiedPage } from '@/features/unclassified/UnclassifiedPage'
import { AuthProvider, useAuth } from '@/state/auth'
import { CalendarProvider } from '@/state/calendar'
import { DataProvider, useData } from '@/state/data'
import { Layout } from './Layout'
import { SetupScreen } from './SetupScreen'
import { SignInScreen } from './SignInScreen'

function Gate() {
  const { token } = useAuth()
  const { data } = useData()

  if (!token) return <SignInScreen />
  if (!data.settings.calendarId || !data.settings.trackFrom) return <SetupScreen />

  return (
    <CalendarProvider>
      {/*
        Indirizzi con # (#/clienti/…) invece degli URL "veri": GitHub Pages serve solo file
        statici e risponderebbe 404 a /clienti/… ricaricando la pagina.
      */}
      <Router hook={useHashLocation}>
        <Layout>
          <Switch>
            <Route path="/clienti/:clientId" component={ClientPage} />
            <Route path="/da-classificare" component={UnclassifiedPage} />
            <Route path="/impostazioni" component={SettingsPage} />
            <Route component={OverviewPage} />
          </Switch>
        </Layout>
      </Router>
    </CalendarProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Gate />
      </DataProvider>
      <Toaster position="bottom-center" />
    </AuthProvider>
  )
}
