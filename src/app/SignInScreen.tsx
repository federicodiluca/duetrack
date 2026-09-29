import { CalendarSearch, FolderLock, ListTree } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Credits } from '@/components/Credits'
import { InstallButton } from '@/components/InstallButton'
import { CoinCheckIcon, GoogleIcon, ReminderIcon, ReportIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/state/auth'

function Item({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 text-primary [&_svg]:size-5">{icon}</span>
      <div className="grid content-start gap-0.5">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{children}</span>
      </div>
    </li>
  )
}

/**
 * La home page pubblica: presenta l'app e spiega quali permessi chiede a Google e perché,
 * come richiede la verifica OAuth, prima di far accedere.
 */
export function SignInScreen() {
  const { signIn, signingIn } = useAuth()

  const start = () => signIn().catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Accesso non riuscito'))

  const signInButton = (
    <Button size="lg" variant="outline" onClick={start} disabled={signingIn} className="h-11 w-full gap-3 text-base sm:w-fit">
      <GoogleIcon className="size-5" />
      {signingIn ? 'Accesso in corso…' : 'Accedi con Google'}
    </Button>
  )

  return (
    <main className="mx-auto grid max-w-2xl gap-12 px-4 py-12 sm:py-16">
      <section className="grid gap-5">
        <img src="/favicon.svg" alt="" className="size-14" />
        <h1 className="font-heading text-3xl font-semibold text-balance sm:text-4xl">
          Duetrack: chi ti deve cosa, letto dal tuo Google Calendar
        </h1>
        <p className="text-lg text-muted-foreground">
          Per chi lavora a ore e segna ogni appuntamento in calendario: lezioni private, consulenze, sedute. Duetrack legge le
          sessioni dal calendario che scegli, calcola quanto ti deve ogni cliente in base a durata e tariffa oraria, e ti lascia
          segnare i pagamenti. Gratuito, senza pubblicità, senza server.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {signInButton}
          <InstallButton size="lg" variant="ghost" label="Installa l’app" className="h-11 w-full text-base sm:w-fit" />
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="font-heading text-xl font-semibold">Cosa fa</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          <Item icon={<CoinCheckIcon />} title="Il dovuto, calcolato da solo">
            Ogni evento del calendario è una sessione: durata per tariffa oraria, con lo storico degli aumenti.
          </Item>
          <Item icon={<ListTree />} title="Pagamenti singoli o a blocchi">
            Segni pagata una lezione o tutte quelle da una data in poi, e puoi sempre annullare.
          </Item>
          <Item icon={<ReportIcon />} title="Resoconti per periodo">
            Quanto hai lavorato in un mese o in un anno, per cliente, con il confronto e l’esportazione in CSV.
          </Item>
          <Item icon={<ReminderIcon />} title="Promemoria pronti">
            Il riepilogo delle lezioni da saldare, da copiare o mandare su WhatsApp.
          </Item>
        </ul>
      </section>

      <section className="grid gap-4">
        <h2 className="font-heading text-xl font-semibold">Perché chiede l’accesso a Google</h2>
        <ul className="grid gap-4">
          <Item icon={<CalendarSearch />} title="Leggere il calendario, senza modificarlo">
            L’elenco dei tuoi calendari, per scegliere quello delle sessioni, e gli eventi dei calendari di tua proprietà: titolo,
            inizio e fine servono a riconoscere il cliente e calcolare durata e importo. Duetrack non scrive mai sul calendario.
          </Item>
          <Item icon={<FolderLock />} title="Un solo file sul tuo Google Drive">
            Clienti, tariffe e pagamenti vengono salvati nel file <code>duetrack-data.json</code>, per averli uguali su telefono
            e computer. Duetrack vede solo i file che ha creato lui, non il resto del tuo Drive.
          </Item>
        </ul>
        <p className="text-sm text-muted-foreground">
          Duetrack funziona interamente nel tuo browser: i dati vanno da Google al tuo dispositivo e al tuo Drive, e nessuno
          li riceve, nemmeno chi ha realizzato l’app. I dettagli sono nell’
          <a href="/privacy/" className="font-medium text-foreground underline underline-offset-4">
            informativa sulla privacy
          </a>
          .
        </p>
        {signInButton}
      </section>

      <footer className="border-t pt-6">
        <Credits />
      </footer>
    </main>
  )
}
