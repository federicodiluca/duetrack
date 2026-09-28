# Verifica OAuth di Google

Finché l'app OAuth è in modalità **Testing**, Duetrack funziona solo per gli account aggiunti
come utenti di prova. Per aprirla a chiunque, Google deve verificarla, perché i due permessi
sul calendario sono *sensibili* (`drive.file` invece non lo è). Non servono la valutazione di
sicurezza a pagamento (CASA) né altri costi: quella riguarda solo gli scope *restricted*,
come l'accesso completo a Drive o a Gmail.

Tempi indicativi: da qualche giorno a qualche settimana. Google risponde via email
all'indirizzo di contatto dello sviluppatore, a volte con richieste di chiarimenti.

## 1. Prima di inviare

- [ ] **Dominio verificato in Google Search Console** con lo **stesso account Google** che
  possiede il progetto Cloud. Conviene una proprietà di tipo *Dominio* su
  `federicodiluca.com`: copre anche `duetrack.` e si verifica con un record TXT su Cloudflare
  (Search Console può aggiungerlo da sola collegandosi a Cloudflare).
- [ ] **Branding** (Google Auth Platform → Branding):
  - nome dell'app: `Duetrack`, uguale a quello della home page;
  - email di assistenza utenti: il tuo account o un gruppo Google che gestisci;
  - logo: [`docs/oauth/logo-120.png`](oauth/logo-120.png) (120×120). È facoltativo, ma con il
    logo la schermata di consenso è più affidabile agli occhi di chi accede;
  - home page: `https://duetrack.federicodiluca.com/`;
  - informativa privacy: `https://duetrack.federicodiluca.com/privacy/` (c'è anche la versione
    inglese su `/privacy/en/`);
  - termini di servizio: facoltativi, si possono lasciare vuoti;
  - domini autorizzati: `federicodiluca.com`;
  - contatto sviluppatore: va bene anche `duetrack@federicodiluca.com`.
- [ ] **Accesso ai dati** (Google Auth Platform → Accesso ai dati): aggiungere esattamente
  questi tre scope, né più né meno di quelli che l'app chiede:
  - `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
  - `https://www.googleapis.com/auth/calendar.events.owned.readonly`
  - `https://www.googleapis.com/auth/drive.file`
- [ ] **Pubblico** (Google Auth Platform → Pubblico): *Pubblica app* per passare da Testing a
  In produzione. Da qui chiunque può accedere, ma vede l'avviso "app non verificata" e c'è un
  limite di 100 utenti finché la verifica non è completata.
- [ ] **Video dimostrativo** caricato su YouTube (anche *non in elenco*), vedi sotto.

## 2. Motivazioni degli scope

Google le chiede in inglese, una per scope sensibile. Testi pronti da incollare:

**`calendar.calendarlist.readonly`**

> Duetrack lets users track payments for hourly work (private lessons, consulting) recorded
> in Google Calendar. After sign-in, the user picks which of their calendars holds their
> work sessions. We read the calendar list only to show that choice: the calendar names and
> colours are displayed in a selector and nothing else is read or stored. Access is
> read-only.

**`calendar.events.owned.readonly`**

> Each event in the chosen calendar is a work session. Duetrack reads the title, start and
> end of the events to recognise the client (the title is the client's name) and to compute
> the session's duration and amount from the client's hourly rate. The events are processed
> in the user's browser and never sent to any server of ours. Duetrack never modifies the
> calendar. We use the "owned" variant because work calendars are owned by the user, so we
> do not need access to calendars shared with them.

**`drive.file`** (non sensibile, ma se il modulo lo chiede)

> Duetrack stores the user's clients, rates and payments in a single file it creates in the
> user's own Drive (duetrack-data.json), so their data is the same on phone and computer
> without any server of ours. drive.file only grants access to files created by the app.

**Descrizione generale dell'uso dei dati**

> Duetrack is a client-side web app with no backend. Google data is fetched directly by the
> user's browser and used only to show the user their own sessions, amounts owed and
> reports. It is not sold, not used for advertising, not transferred to third parties and not
> read by humans. The access token is kept in memory only and never stored.

## 3. Video dimostrativo

Un solo video, 2-4 minuti, in inglese o con l'interfaccia di Google impostata in inglese
(la schermata di consenso deve essere leggibile dai revisori). Non serve audio: bastano
sottotitoli o un testo a schermo. Da registrare con un account di prova su un calendario
con qualche evento finto, mai con dati di clienti veri.

1. **La home page** `https://duetrack.federicodiluca.com/`: mostra la sezione "Perché chiede
   l'accesso a Google" e il link all'informativa privacy.
2. **Il flusso di consenso**: clic su "Accedi con Google". Nella finestra di Google devono
   vedersi il nome dell'app, i permessi richiesti e, **nella barra degli indirizzi**, il
   `client_id` (`940793929992-…`). Se il popup non mostra l'indirizzo, aprilo in una scheda.
3. **`calendar.calendarlist.readonly`**: la schermata di configurazione con il selettore dei
   calendari aperto.
4. **`calendar.events.owned.readonly`**: la pagina "Da classificare" con gli eventi letti, poi
   la creazione di un cliente e la pagina "Chi deve cosa" con durate e importi calcolati.
   Mostra anche che l'evento nel calendario non cambia.
5. **`drive.file`**: in Impostazioni la frase sul file, poi Google Drive con il file
   `duetrack-data.json`.
6. **Revoca**: facoltativo, ma apprezzato: la pagina "App di terze parti con accesso
   all'account" con Duetrack.

## 4. Dopo l'invio

- Rispondere alle email di Google dall'indirizzo di contatto: se chiedono modifiche,
  descriverle e rispondere nello stesso thread.
- Se cambiano gli scope richiesti dall'app, la verifica va rifatta: aggiornare prima questo
  documento, `src/config.ts` e l'informativa privacy, in quest'ordine.
- A verifica completata l'avviso "app non verificata" sparisce e il limite di 100 utenti
  decade. Aggiornare il TODO e la pagina privacy se serve.
