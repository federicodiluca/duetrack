import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateSettings } from '@/core/actions'
import { toIsoDate } from '@/core/model'
import { DEMO, demoCalendars } from '@/demo'
import { type CalendarInfo, listOwnedCalendars } from '@/google/calendar'
import { useAuth } from '@/state/auth'
import { useData } from '@/state/data'

function firstOfMonth(): string {
  const now = new Date()
  return toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1))
}

/** Scelta del calendario, data di partenza e parole da ignorare: la configurazione di base. */
export function CalendarSettings({ submitLabel, onSaved }: { submitLabel: string; onSaved?: () => void }) {
  const { token } = useAuth()
  const { data, apply } = useData()
  const [calendars, setCalendars] = useState<CalendarInfo[]>()
  const [loadError, setLoadError] = useState<string>()
  const [calendarId, setCalendarId] = useState(data.settings.calendarId ?? '')
  const [trackFrom, setTrackFrom] = useState(data.settings.trackFrom ?? firstOfMonth())
  const [ignoredWords, setIgnoredWords] = useState(data.settings.ignoredWords.join(', '))

  useEffect(() => {
    if (!token) return
    ;(DEMO ? Promise.resolve(demoCalendars) : listOwnedCalendars(token))
      .then(setCalendars)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)))
  }, [token])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const words = ignoredWords
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean)
    if (apply((d) => updateSettings(d, { calendarId, trackFrom, ignoredWords: words }))) onSaved?.()
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="calendar">Calendario delle sessioni</Label>
        <Select value={calendarId} onValueChange={setCalendarId} disabled={!calendars}>
          <SelectTrigger id="calendar" className="w-full">
            <SelectValue placeholder={calendars ? 'Scegli un calendario' : 'Carico i calendari…'} />
          </SelectTrigger>
          <SelectContent>
            {calendars?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="size-2.5 rounded-full" style={{ background: c.backgroundColor }} />
                {c.summary}
                {c.primary && ' (principale)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loadError && <p className="text-sm text-destructive">Impossibile leggere i calendari: {loadError}</p>}
        <p className="text-sm text-muted-foreground">Ogni evento con orario di questo calendario è una sessione.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="track-from">Traccia dal</Label>
        <Input id="track-from" type="date" value={trackFrom} onChange={(e) => setTrackFrom(e.target.value)} required className="w-fit" />
        <p className="text-sm text-muted-foreground">
          Le sessioni precedenti non vengono lette: considerale già sistemate. Scegli il giorno dopo l’ultimo pagamento che hai
          ricevuto da tutti.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ignored-words">Parole da ignorare nei titoli</Label>
        <Input id="ignored-words" value={ignoredWords} onChange={(e) => setIgnoredWords(e.target.value)} placeholder="es. ripetizioni, lezione" />
        <p className="text-sm text-muted-foreground">
          Con “ripetizioni”, l’evento “Ripetizioni Giacomo” viene riconosciuto come Giacomo. Separa più parole con la virgola.
        </p>
      </div>

      <Button type="submit" disabled={!calendarId || !trackFrom} className="w-fit">
        {submitLabel}
      </Button>
    </form>
  )
}
