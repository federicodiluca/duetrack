import { CalendarSettings } from '@/features/settings/CalendarSettings'

export function SetupScreen() {
  return (
    <main className="mx-auto grid max-w-lg gap-6 px-4 py-10">
      <div className="grid gap-2">
        <img src="/favicon.svg" alt="" className="size-10" />
        <h1 className="font-heading text-2xl font-semibold">Da dove leggo le sessioni?</h1>
        <p className="text-muted-foreground">Tre scelte e sei pronto. Potrai cambiarle quando vuoi dalle impostazioni.</p>
      </div>
      <CalendarSettings submitLabel="Inizia" />
    </main>
  )
}
