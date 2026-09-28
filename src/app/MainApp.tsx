import { Route, Router, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { ClientPage } from '@/features/client/ClientPage'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { ReportPage } from '@/features/report/ReportPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { UnclassifiedPage } from '@/features/unclassified/UnclassifiedPage'
import { CalendarProvider } from '@/state/calendar'
import { Layout } from './Layout'

/**
 * L'app dopo l'accesso. Sta in un file a sé perché App.tsx la carica con lazy(): la
 * schermata di accesso non scarica il codice di pagine che non può ancora mostrare.
 */
export default function MainApp() {
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
            <Route path="/resoconto" component={ReportPage} />
            <Route path="/impostazioni" component={SettingsPage} />
            <Route component={OverviewPage} />
          </Switch>
        </Layout>
      </Router>
    </CalendarProvider>
  )
}
