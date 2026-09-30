# Duetrack

Chi ti deve cosa, letto dal tuo Google Calendar.

Se lavori a ore (ripetizioni, consulenze, lezioni) e segni ogni appuntamento in calendario,
Duetrack legge quegli eventi, calcola quanto ti deve ogni cliente in base a durata e tariffa
oraria, e ti lascia segnare i pagamenti, una sessione alla volta o a blocchi. Il calendario
resta l'unica cosa da aggiornare: niente più note parallele da tenere allineate a mano.

**In produzione su [duetrack.federicodiluca.com](https://duetrack.federicodiluca.com/)**, installabile
come app (PWA). Le decisioni di progetto sono in [docs/decisions](docs/decisions/), il lavoro
ancora aperto in [TODO.md](TODO.md).

> L'app OAuth non è verificata da Google (scelta voluta, vedi [TODO.md](TODO.md)): al primo
> accesso compare l'avviso "app non verificata" (Avanzate → Vai a Duetrack) e il limite è di
> 100 utenti. La procedura di verifica, se servirà, è in [docs/oauth-verification.md](docs/oauth-verification.md).

## Come funziona

- **Un calendario dedicato**, con il nome del cliente come titolo dell'evento (`Davide`).
  Parole come "ripetizioni" ed eventuali emoji nel titolo vengono ignorate. La durata
  dell'evento è la durata della sessione.
- **Importo proporzionale**: 1h30 a 20 €/h fa 30 €. Ogni importo si può correggere a mano.
- **"Pagare da"**: per chi paga dopo un periodo, imposti una data e vedi ore e totale da lì
  in poi; un tocco segna pagato tutto il blocco, e si può annullare.
- **Tariffe con storico**: un aumento vale da una data in poi, le sessioni precedenti
  restano alla tariffa di allora.
- **Panoramica**: ricerca e ordinamento dei clienti, quelli in pari separati dagli altri,
  clienti inattivi messi da parte.
- **Note** su singole sessioni e sui clienti.
- **Promemoria di pagamento**: un messaggio già pronto con le sessioni da saldare, da
  ritoccare e poi copiare o condividere col cliente.
- **Resoconto**: quanto hai lavorato in un periodo, per tutti i clienti o solo per alcuni,
  diviso tra saldato e da incassare, con confronto col periodo precedente, grafico mensile ed
  esportazione CSV di sessioni e pagamenti.
- **Da classificare**: gli eventi che non corrispondono a nessun cliente non spariscono.
  Diventano un cliente nuovo, un alias di uno esistente, o un titolo da ignorare.
- **Nessun server**: l'app gira nel browser. I tuoi dati stanno sul tuo dispositivo e sul
  tuo Google Drive, in un file che solo Duetrack può vedere. Il calendario viene solo letto.
  Dettagli nell'[informativa sulla privacy](https://duetrack.federicodiluca.com/privacy/)
  (anche [in inglese](https://duetrack.federicodiluca.com/privacy/en/)).
- **Installabile**: pulsante "Installa" che usa la finestra del browser dove c'è, e mostra le
  istruzioni passo passo su iPhone, iPad e Safari per Mac. Quando esce una nuova versione
  l'app la propone invece di restare su quella vecchia.
- **Consiglia Duetrack**: dal footer, un'immagine pronta per le storie di Instagram passata
  al menu di condivisione del telefono (o scaricata, dove il browser non condivide file).

## Sviluppo

Node 22.

```bash
npm install
npm run dev              # con il tuo account Google
npm run demo             # senza login: calendario e clienti inventati
npm test                 # logica pura in src/core
npm run lint
npm run build
npm run icons:build      # rigenera le icone da scripts/icon-source.svg
npm run social:build     # rigenera l'immagine di anteprima public/social-share.png
npm run story:build      # rigenera l'immagine per le storie di Instagram public/story.png
```

Il client ID OAuth di Google è in [src/config.ts](src/config.ts); per usarne un altro in
locale imposta `VITE_GOOGLE_CLIENT_ID` in un file `.env.local`.

Stack: Vite, React, TypeScript, Tailwind, shadcn/ui (Radix), wouter, Vitest, oxlint.
Google Identity Services per il login, API REST di Google Calendar chiamate direttamente dal
browser, IndexedDB per i dati locali, vite-plugin-pwa per l'installazione e l'uso offline.
La home pubblica (con FAQ e dati strutturati) viene scritta nell'HTML durante la build da
[src/prerender.tsx](src/prerender.tsx), così è indicizzabile; la build di produzione ha una
Content-Security-Policy.

```text
src/
  app/         home pubblica, configurazione iniziale, layout e shell dell'app
  core/        logica pura e testata: modello, registro, importi, resoconti, sincronizzazione
  google/      login e chiamate alle API Google (Calendar, Drive)
  state/       stato React: dati salvati, accesso, calendario, sync, installazione
  features/    panoramica · cliente · da classificare · resoconto · impostazioni
  components/  componenti condivisi (ui/ = shadcn)
  lib/         utilità (CSV, formattazione, id)
public/privacy/  informativa privacy (IT ed EN), pagine statiche
docs/            decisioni (ADR) e procedura di verifica OAuth
```

### Deploy

Ogni push su `main` esegue [.github/workflows/deploy.yml](.github/workflows/deploy.yml):
lint, test e build, poi pubblicazione su GitHub Pages con dominio
`duetrack.federicodiluca.com`.

## Autore

Duetrack è ideato e sviluppato da **[Federico Di Luca](https://federicodiluca.com/)**,
sviluppatore software e docente. Altri progetti su
**[federicodiluca.com/progetti](https://federicodiluca.com/progetti/)**.

Domande, segnalazioni o proposte: [duetrack@federicodiluca.com](mailto:duetrack@federicodiluca.com),
oppure apri una [issue](https://github.com/federicodiluca/duetrack/issues).

## Licenza

[MIT](LICENSE) © Federico Di Luca
