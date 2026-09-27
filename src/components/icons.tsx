// Icone disegnate per Duetrack: stesso tratto delle icone Lucide (griglia 24, linea 2,
// estremi arrotondati), più un riempimento tenue nel colore del testo che le rende
// riconoscibili sui pulsanti principali. Usano currentColor: prendono il colore del pulsante.

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

const tint = { fill: 'currentColor', fillOpacity: 0.18, stroke: 'none' } as const

/** Moneta con spunta: segnare pagato. */
export function CoinCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" {...tint} />
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.3 2.4 2.4 4.6-4.9" />
    </Icon>
  )
}

/** Pila di monete: più sessioni pagate insieme. */
export function CoinStackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="2.8" {...tint} />
      <ellipse cx="12" cy="6" rx="7" ry="2.8" />
      <path d="M5 6v4c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8V6" />
      <path d="M5 10v4c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-4" />
      <path d="M5 14v4c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-4" />
    </Icon>
  )
}

/** Calendario con un più: sessione aggiunta a mano. */
export function CalendarAddIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 10h17V7.5a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2Z" {...tint} />
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4M12 13v5M9.5 15.5h5" />
    </Icon>
  )
}

/** Calendario con le frecce: rileggere il calendario. */
export function CalendarSyncIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 10h17V7.5a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2Z" {...tint} />
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
      <path d="M15 15.2a3 3 0 1 1-.9-2.1M15 12.5v1.8h-1.8" />
    </Icon>
  )
}

/** Persona con un più: nuovo cliente. */
export function ClientAddIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="8" r="3.5" {...tint} />
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M19 8v5M16.5 10.5h5" />
    </Icon>
  )
}

/** Barre con una moneta: il resoconto. */
export function ReportIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="17.5" cy="6.5" r="3" {...tint} />
      <circle cx="17.5" cy="6.5" r="3" />
      <path d="M3.5 20.5h17M6 20.5v-6M11 20.5V10M16 20.5v-6.5" />
    </Icon>
  )
}

/** Fumetto con le righe di un messaggio: il promemoria da mandare al cliente. */
export function ReminderIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5Z" {...tint} />
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5Z" />
      <path d="M8 8.5h8M8 12h5" />
    </Icon>
  )
}

/** Foglio con la freccia in giù: esportare i dati. */
export function ExportIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 3.5h7l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5Z" {...tint} />
      <path d="M6.5 3.5h7l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M13.5 3.5V8H18M11.5 11v6M9 14.5l2.5 2.5 2.5-2.5" />
    </Icon>
  )
}

/** Il logo "G" ufficiale, a colori: le linee guida di Google lo chiedono sui pulsanti di accesso. */
export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.55 4.2 1.64l3.15-3.15A10.56 10.56 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  )
}
