# TODO — Duetrack

**Dove siamo (28/09/2026).** In produzione su <https://duetrack.federicodiluca.com> (GitHub
Pages, pubblicato dal workflow a ogni push su `main`): lettura del calendario, clienti e
tariffe con storico, note, pagamenti, resoconto con confronto e grafico mensile,
promemoria, sincronizzazione sul Google Drive dell'utente, app installabile con avviso di
nuova versione, CSP, informativa privacy e anteprima per la condivisione del link.

Lighthouse sulla home (build di produzione, 29/09): prestazioni 98, accessibilità 100,
best practice 100, SEO 100 (era 66 prima dell'ADR 0009, quando la pagina era `noindex`).

---

## Da fare tu (fuori dal repo)

- [ ] **Rinominare la cartella** locale da `payment-tracker` a `duetrack`, a VS Code chiuso
  (la memoria di Claude Code è già copiata anche sul nuovo percorso)

**Verifica OAuth: decisa di no (28/09/2026).** L'app è pubblicata "In produzione" senza
verifica: chiunque può accedere, ma vede l'avviso "app non verificata" (Avanzate → Vai a
Duetrack) e c'è un limite di 100 utenti. La verifica richiederebbe un video dimostrativo;
se un giorno servisse, la procedura è in [docs/oauth-verification.md](docs/oauth-verification.md).
Alternativa senza video da valutare solo in quel caso: il permesso `calendar.app.created`
(solo calendari creati dall'app), se Google lo classifica come non sensibile.

## Da fare sul codice

- [ ] **Non rifare il login a ogni apertura** — *non partiamo ora*. Oggi il token Google vive
  solo in memoria (ADR 0001), quindi ogni ricaricamento chiede di nuovo l'accesso. Strade da
  valutare: tentare un rinnovo silenzioso all'avvio (Google Identity Services, se l'utente
  ha già dato il consenso e ha la sessione Google aperta); oppure salvare il token per la
  sua ora di validità, con i rischi che comporta; oppure mostrare subito i dati locali e
  chiedere il login solo per sincronizzare. Va rivisto l'ADR 0001

## Fatto

- [x] Uso da telefono: tendine e menu come pannello dal basso (ADR 0008), pulsanti più
  grandi al tocco, barra "Segna pagate" fissa in basso; ricerca, filtri e ordinamento per
  clienti, sessioni da pagare (per mese, con nota, senza tariffa) e tabella del Resoconto
- [x] Home indicizzabile (ADR 0009): scritta nell'HTML durante la build, FAQ, dati
  strutturati, sitemap e privacy indicizzabile
- [x] Pulsante "Installa" nella home e nell'intestazione: finestra del browser dove c'è,
  istruzioni passo passo su iPhone, iPad e Safari per Mac
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
