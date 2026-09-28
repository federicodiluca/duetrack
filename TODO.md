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

- [ ] **Portfolio**: pubblicare la scheda di Duetrack sul sito personale. C'è già un commit
  locale nel repo del sito (`aedea4e`, "progetto Duetrack"); decidere se metterla in cima
  (in home compaiono solo i primi tre progetti) e aggiornare la frase di "Chi sono" sui
  progetti "più recenti"
- [ ] **README del profilo GitHub**: aggiungere Duetrack
- [ ] **Google Search Console**: l'app è `noindex` di proposito (dati privati dietro login),
  quindi il sottodominio non va indicizzato. Quello che conta è il sito personale con la
  pagina Progetti: verificare che la proprietà `federicodiluca.com` ci sia e inviare la
  sitemap dopo aver pubblicato la scheda
- [ ] **Audit SEO del sito personale**, in particolare della pagina Progetti con la scheda di
  Duetrack: è la parte che deve portare visite (quello dell'app è fatto, vedi sopra)
- [ ] **Verifica OAuth di Google** (solo se l'app si apre ad altri utenti): oggi è in modalità
  "Testing" e funziona solo per gli account di prova. Servono informativa privacy (fatta:
  `/privacy/`), dominio verificato e un video dimostrativo

## Da fare sul codice

- [ ] **Non rifare il login a ogni apertura** — *non partiamo ora*. Oggi il token Google vive
  solo in memoria (ADR 0001), quindi ogni ricaricamento chiede di nuovo l'accesso. Strade da
  valutare: tentare un rinnovo silenzioso all'avvio (Google Identity Services, se l'utente
  ha già dato il consenso e ha la sessione Google aperta); oppure salvare il token per la
  sua ora di validità, con i rischi che comporta; oppure mostrare subito i dati locali e
  chiedere il login solo per sincronizzare. Va rivisto l'ADR 0001

## Fatto

- [x] Avviso "È disponibile una nuova versione · Aggiorna" (il tab Resoconto che non compariva
  senza ricaricare), con controllo degli aggiornamenti ogni ora e al ritorno sull'app
- [x] Note sulla singola sessione e sul cliente
- [x] Icone SVG nel menu, nelle azioni delle sessioni e negli stati vuoti
- [x] Lista clienti divisa: chi deve pagare, poi chi è "Tutto pagato"
- [x] Immagine di condivisione (`public/social-share.png`, `npm run social:build`) e tag Open Graph
- [x] Audit dell'app: `<main>` nelle schermate di accesso e configurazione, codice diviso in modo
  che la schermata di accesso non scarichi le pagine interne
