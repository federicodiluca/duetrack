import { toast } from 'sonner'
import { Credits } from '@/components/Credits'
import { GoogleIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/state/auth'

export function SignInScreen() {
  const { signIn, signingIn } = useAuth()

  const start = () => signIn().catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Accesso non riuscito'))

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10">
      <div className="grid gap-4">
        <img src="/favicon.svg" alt="" className="size-14" />
        <h1 className="font-heading text-3xl font-semibold text-balance">Chi ti deve cosa, letto dal tuo Google Calendar</h1>
        <p className="text-muted-foreground">
          Duetrack legge le sessioni dal calendario che scegli, calcola quanto ti deve ogni cliente in base a durata e tariffa
          oraria, e ti lascia segnare i pagamenti.
        </p>
      </div>
      <Button size="lg" variant="outline" onClick={start} disabled={signingIn} className="h-11 gap-3 text-base">
        <GoogleIcon className="size-5" />
        {signingIn ? 'Accesso in corso…' : 'Accedi con Google'}
      </Button>
      <ul className="grid gap-2 text-sm text-muted-foreground">
        <li>Il calendario viene solo letto, mai modificato.</li>
        <li>I tuoi dati restano sul tuo dispositivo e sul tuo Google Drive: nessun altro server li raccoglie.</li>
      </ul>
      <Credits />
    </main>
  )
}
