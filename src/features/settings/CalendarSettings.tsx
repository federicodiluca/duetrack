import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Picker } from '@/components/Picker'
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
        <Picker
          id="calendar"
          labelled
          title="Calendario delle sessioni"
          value={calendarId}
          onValueChange={setCalendarId}
          disabled={!calendars}
          placeholder={calendars ? 'Scegli un calendario' : 'Carico i calendari…'}
          choices={(calendars ?? []).map((c) => ({
            value: c.id,
            text: c.summary,
            label: (
              <>
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.backgroundColor }} />
                {c.summary}
                {c.primary && ' (principale)'}
              </>
            ),
          }))}
          className="w-full"
        />
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
        <Picker
          id="upcoming-weeks"
          labelled
          title="Sessioni in programma"
          value={upcomingWeeks}
          onValueChange={setUpcomingWeeks}
          choices={UPCOMING_CHOICES.map((weeks) => ({
            value: String(weeks),
            label: weeks === 0 ? 'Non mostrarle' : `Prossime ${pluralize(weeks, 'settimana', 'settimane')}`,
          }))}
        />
        <p className="text-sm text-muted-foreground">
          Le sessioni future si vedono a parte e non entrano nel conto finché non sono passate.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="inactive-after-days">Clienti che non vedi da un po’</Label>
        <Picker
          id="inactive-after-days"
          labelled
          title="Clienti che non vedi da un po’"
          value={inactiveAfterDays}
          onValueChange={setInactiveAfterDays}
          choices={INACTIVE_CHOICES.map((days) => ({
            value: String(days),
            label: days === 0 ? 'Non segnalarli' : `Dopo ${days} giorni senza sessioni`,
          }))}
        />
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
