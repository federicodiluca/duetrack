// Il Client ID OAuth non è un segreto: finisce comunque nel JavaScript servito al browser.
// Lo protegge la lista delle "origini JavaScript autorizzate" in Google Cloud Console,
// che accetta solo localhost:5173 e duetrack.federicodiluca.com. Chi fa un fork lo
// sostituisce con il proprio tramite VITE_GOOGLE_CLIENT_ID.
export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '940793929992-t79av1flc6iu5fp0ubtlbuaujua5qimd.apps.googleusercontent.com'

// Permessi minimi (ADR 0003, 0004): vedere l'elenco dei calendari per sceglierne uno,
// leggere gli eventi dei soli calendari di proprietà dell'utente, e gestire sul suo Drive
// soltanto i file creati da Duetrack. Nessuna scrittura sul calendario.
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.events.owned.readonly',
  'https://www.googleapis.com/auth/drive.file',
]
