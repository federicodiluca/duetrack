# 0001 — App local-first statica, nessun backend

## Contesto

Duetrack nasce per un solo utente ma deve poter essere usato da chiunque abbia un Google
Calendar. Vincoli: costo zero, nessun server da mantenere, e nessun dato degli utenti
conservato da chi pubblica l'app.

## Decisione

Duetrack è un sito statico (SPA) pubblicato su GitHub Pages. Tutto gira nel browser:
login Google con Google Identity Services, chiamate dirette alle API di Calendar e Drive,
dati salvati sul dispositivo e sul Drive dell'utente.

## Alternative scartate

- **Backend su Cloudflare Workers + D1**: costo zero e niente server, ma i dati di tutti
  gli utenti finirebbero in un database gestito da me.
- **FastAPI + SQLite su VPS**: stesso problema, più un server da tenere aggiornato.
- **Service account Google** per leggere il calendario senza login: richiede una chiave
  segreta, e in un'app solo-browser nessun segreto resta tale.

## Conseguenze

- Nessun segreto nel codice: il Client ID OAuth è pubblico per natura, lo protegge la
  lista delle origini JavaScript autorizzate.
- Nel browser non esistono refresh token: l'access token dura circa un'ora, poi Google lo
  rinnova con un popup (spesso senza richiedere di nuovo il consenso).
- Il rischio principale diventa l'XSS, perché il token vive nella pagina: serve una
  Content-Security-Policy stretta e nessun HTML non fidato renderizzato.
- Gli scope di lettura del calendario sono *sensibili*: per l'uso personale basta la
  modalità "Testing" di Google Cloud; per aprire l'app ad altri serve la verifica di Google
  (gratuita: privacy policy, dominio verificato, video demo).
