# Duetrack

Chi ti deve cosa, letto dal tuo Google Calendar.

Se lavori a ore (ripetizioni, consulenze, lezioni) e segni ogni appuntamento in calendario,
Duetrack legge quegli eventi, calcola quanto ti deve ogni cliente in base a durata e tariffa
oraria, e ti lascia segnare i pagamenti, una sessione alla volta o a blocchi. Il calendario
resta l'unica cosa da aggiornare: niente più note parallele da tenere allineate a mano.

> Stato: in sviluppo. Le decisioni prese finora sono in [docs/decisions](docs/decisions/).

## Come funziona

- **Un calendario dedicato**, con il nome del cliente come titolo dell'evento (`Davide`).
  Parole come "ripetizioni" ed eventuali emoji nel titolo vengono ignorate. La durata
  dell'evento è la durata della sessione.
- **Importo proporzionale**: 1h30 a 20 €/h fa 30 €. Ogni importo si può correggere a mano.
- **"Pagare da"**: per chi paga dopo un periodo, imposti una data e vedi ore e totale da lì
  in poi; un tocco segna pagato tutto il blocco, e si può annullare.
- **Da classificare**: gli eventi che non corrispondono a nessun cliente non spariscono.
  Diventano un cliente nuovo, un alias di uno esistente, o un titolo da ignorare.
- **Nessun server**: l'app gira nel browser. I tuoi dati stanno sul tuo dispositivo e sul
  tuo Google Drive, in un file che solo Duetrack può vedere. Il calendario viene solo letto.

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
```

Stack: Vite, React, TypeScript, Tailwind, shadcn/ui (Radix), wouter, Vitest, oxlint.
Google Identity Services per il login, API REST di Google Calendar chiamate direttamente dal
browser, IndexedDB per i dati locali.

```text
src/
  core/        logica pura e testata: modello, registro, importi, azioni
  google/      login e chiamate alle API Google
  state/       stato React: dati salvati, accesso, calendario
  features/    panoramica · cliente · da classificare · impostazioni
  components/  componenti condivisi (ui/ = shadcn)
```

## Autore

Duetrack è ideato e sviluppato da **[Federico Di Luca](https://federicodiluca.com/chi-sono/)**,
sviluppatore software e docente. Altri progetti su
**[federicodiluca.com/progetti](https://federicodiluca.com/progetti/)**.

Domande, segnalazioni o proposte: [duetrack@federicodiluca.com](mailto:duetrack@federicodiluca.com),
oppure apri una [issue](https://github.com/federicodiluca/duetrack/issues).

## Licenza

[MIT](LICENSE) © Federico Di Luca
