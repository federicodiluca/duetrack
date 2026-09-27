# TODO — Duetrack

**Dove siamo (27/09/2026).** In produzione su <https://duetrack.federicodiluca.com> (GitHub
Pages, pubblicato dal workflow a ogni push su `main`): lettura del calendario, clienti e
tariffe con storico, pagamenti, resoconto con confronto e grafico mensile, promemoria,
sincronizzazione sul Google Drive dell'utente, app installabile, CSP e informativa privacy.

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
- [ ] **Verifica OAuth di Google** (solo se l'app si apre ad altri utenti): oggi è in modalità
  "Testing" e funziona solo per gli account di prova. Servono informativa privacy (fatta:
  `/privacy/`), dominio verificato e un video dimostrativo

## Da fare sul codice

- [ ] **Aggiornamento dell'app installata**. Problema visto: dopo una pubblicazione il tab
  "Resoconto" non c'era finché non si ricaricava la pagina (e poi si rifaceva il login).
  Causa: il service worker scarica la versione nuova in background, ma la pagina aperta
  continua a usare quella vecchia fino al ricaricamento. Soluzione: un avviso "È
  disponibile una nuova versione · Aggiorna" (vite-plugin-pwa lo supporta con
  `registerType: 'prompt'`), da legare al punto sul login qui sotto
- [ ] **Non rifare il login a ogni apertura** — *non partiamo ora*. Oggi il token Google vive
  solo in memoria (ADR 0001), quindi ogni ricaricamento chiede di nuovo l'accesso. Strade da
  valutare: tentare un rinnovo silenzioso all'avvio (Google Identity Services, se l'utente
  ha già dato il consenso e ha la sessione Google aperta); oppure salvare il token per la
  sua ora di validità, con i rischi che comporta; oppure mostrare subito i dati locali e
  chiedere il login solo per sincronizzare. Va rivisto l'ADR 0001
- [ ] **Note**: un campo note sulla singola sessione (es. "recupero", "fatto online") e sul
  cliente (es. contatto del genitore, accordi). Le correzioni per sessione hanno già un
  campo `note` nel modello, manca l'interfaccia; per il cliente va aggiunto
- [ ] **Più icone SVG** disegnate per Duetrack, qua e là: stati vuoti ("Tutto pagato",
  "Nessuna sessione"), intestazioni delle sezioni, menu delle azioni
- [ ] **Lista clienti**: separare con un breve spazio chi ha sessioni da pagare da chi è
  "Tutto pagato"
- [ ] **Immagine di condivisione**: oggi l'app non ha tag Open Graph né immagine. Servono
  `og:title`, `og:description`, `og:image` (1200×630, con logo e frase) per l'anteprima
  quando si condivide il link. Il `noindex` resta: le anteprime non dipendono
  dall'indicizzazione
- [ ] **Audit SEO completo**, sia dell'app (tag, anteprime, prestazioni, accessibilità) sia
  della scheda sul sito personale, che è la parte che deve portare visite
