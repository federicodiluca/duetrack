import { Download, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { excludeTitle } from '@/core/actions'
import { toIsoDate } from '@/core/model'
import { useAuth } from '@/state/auth'
import { useData } from '@/state/data'
import { CalendarSettings } from './CalendarSettings'

export function SettingsPage() {
  const { data, apply } = useData()
  const { signOut } = useAuth()

  function exportData() {
    // Una copia da tenere dove si vuole, indipendente da Drive e da Duetrack.
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `duetrack-${toIsoDate(new Date())}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-10">
      <section className="grid gap-4">
        <h1 className="font-heading text-2xl font-semibold">Impostazioni</h1>
        <CalendarSettings submitLabel="Salva" onSaved={() => toast.success('Impostazioni salvate')} />
      </section>

      <section className="grid gap-3">
        <h2 className="font-heading text-lg font-semibold">Titoli esclusi</h2>
        {data.settings.excludedTitles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessuno. Gli eventi che non sono sessioni si escludono da “Da classificare”.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {data.settings.excludedTitles.map((key) => (
              <li key={key} className="flex items-center gap-3 p-3 text-sm">
                <span className="flex-1">{key}</span>
                <Button variant="ghost" size="sm" onClick={() => apply((d) => excludeTitle(d, key, false))}>
                  Ripristina
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="font-heading text-lg font-semibold">Dati</h2>
        <p className="text-sm text-muted-foreground">
          Clienti, tariffe e pagamenti stanno su questo dispositivo e nel file <code>duetrack-data.json</code> sul tuo Google
          Drive, che tiene allineati telefono e computer. Duetrack vede solo i file che ha creato lui.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download /> Scarica una copia (JSON)
          </Button>
          <Button variant="ghost" onClick={signOut}>
            <LogOut /> Esci
          </Button>
        </div>
      </section>
    </div>
  )
}
