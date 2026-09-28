# TODO — Duetrack

**Dove siamo (28/09/2026).** In produzione su <https://duetrack.federicodiluca.com> (GitHub
Pages, pubblicato dal workflow a ogni push su `main`): lettura del calendario, clienti e
tariffe con storico, note, pagamenti, resoconto con confronto e grafico mensile,
promemoria, sincronizzazione sul Google Drive dell'utente, app installabile con avviso di
nuova versione, CSP, informativa privacy e anteprima per la condivisione del link.

Lighthouse sulla schermata di accesso (build di produzione, 28/09): prestazioni 99,
accessibilità 100, best practice 100. SEO 66 per scelta: la pagina è `noindex`.

---

## Da fare tu (fuori dal repo)

- [ ] **Verifica OAuth di Google**, per aprire Duetrack a chiunque: la procedura completa, con i
  testi da incollare e la scaletta del video, è in [docs/oauth-verification.md](docs/oauth-verification.md).
  In sintesi:
  - [ ] dominio `federicodiluca.com` verificato in **Google Search Console** con lo stesso
    account del progetto Cloud (serve alla verifica, anche se per il SEO non la usiamo)
  - [ ] logo [`docs/oauth/logo-120.png`](docs/oauth/logo-120.png) caricato nel Branding
  - [ ] i tre scope in "Accesso ai dati", con le motivazioni
  - [ ] app pubblicata ("In produzione")
  - [ ] video dimostrativo su YouTube, poi invio della richiesta

## Da fare sul codice

- [ ] **Non rifare il login a ogni apertura** — *non partiamo ora*. Oggi il token Google vive
  solo in memoria (ADR 0001), quindi ogni ricaricamento chiede di nuovo l'accesso. Strade da
  valutare: tentare un rinnovo silenzioso all'avvio (Google Identity Services, se l'utente
  ha già dato il consenso e ha la sessione Google aperta); oppure salvare il token per la
  sua ora di validità, con i rischi che comporta; oppure mostrare subito i dati locali e
  chiedere il login solo per sincronizzare. Va rivisto l'ADR 0001

## Fatto

- [x] Scheda di Duetrack nel portfolio e nel README del profilo GitHub (fatto da te)
- [x] Home page pubblica con cosa fa l'app e perché chiede l'accesso a Google, informativa
  privacy anche in inglese, logo per la schermata di consenso
- [x] Avviso "È disponibile una nuova versione · Aggiorna" (il tab Resoconto che non compariva
  senza ricaricare), con controllo degli aggiornamenti ogni ora e al ritorno sull'app
- [x] Note sulla singola sessione e sul cliente
- [x] Icone SVG nel menu, nelle azioni delle sessioni e negli stati vuoti
- [x] Lista clienti divisa: chi deve pagare, poi chi è "Tutto pagato"
- [x] Immagine di condivisione (`public/social-share.png`, `npm run social:build`) e tag Open Graph
- [x] Audit dell'app: `<main>` nelle schermate di accesso e configurazione, codice diviso in modo
  che la schermata di accesso non scarichi le pagine interne
