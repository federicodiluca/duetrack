import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateSettings } from '@/core/actions'
import { toIsoDate } from '@/core/model'
import { DEMO, demoCalendars } from '@/demo'
import { type CalendarInfo, listOwnedCalendars } from '@/google/calendar'
import { pluralize } from '@/lib/format'
import { useAuth } from '@/state/auth'
import { useData } from '@/state/data'

// Oltre due mesi le ricorrenze dicono poco: a quella distanza il calendario cambia ancora.
const UPCOMING_CHOICES = [0, 1, 2, 4, 8]
const INACTIVE_CHOICES = [0, 21, 30, 60, 90, 180]

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
  const [upcomingWeeks, setUpcomingWeeks] = useState(String(data.settings.upcomingWeeks))
  const [inactiveAfterDays, setInactiveAfterDays] = useState(String(data.settings.inactiveAfterDays))

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
    const patch = {
      calendarId,
      trackFrom,
      ignoredWords: words,
      upcomingWeeks: Number(upcomingWeeks),
      inactiveAfterDays: Number(inactiveAfterDays),
    }
    if (apply((d) => updateSettings(d, patch))) onSaved?.()
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

      <div className="grid gap-2">
        <Label htmlFor="upcoming-weeks">Sessioni in programma</Label>
        <Select value={upcomingWeeks} onValueChange={setUpcomingWeeks}>
          <SelectTrigger id="upcoming-weeks" className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UPCOMING_CHOICES.map((weeks) => (
              <SelectItem key={weeks} value={String(weeks)}>
                {weeks === 0 ? 'Non mostrarle' : `Prossime ${pluralize(weeks, 'settimana', 'settimane')}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Le sessioni future si vedono a parte e non entrano nel conto finché non sono passate.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="inactive-after-days">Clienti che non vedi da un po’</Label>
        <Select value={inactiveAfterDays} onValueChange={setInactiveAfterDays}>
          <SelectTrigger id="inactive-after-days" className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INACTIVE_CHOICES.map((days) => (
              <SelectItem key={days} value={String(days)}>
                {days === 0 ? 'Non segnalarli' : `Dopo ${days} giorni senza sessioni`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Nella panoramica, per accorgerti di chi si è perso per strada.
        </p>
      </div>

      <Button type="submit" disabled={!calendarId || !trackFrom} className="w-fit">
        {submitLabel}
      </Button>
    </form>
  )
}
