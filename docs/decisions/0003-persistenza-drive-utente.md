# 0003 — Stato su IndexedDB + file JSON sul Drive dell'utente

## Contesto

Il calendario dice *quando* e *quanto dura* una sessione; va salvato altrove *chi ha pagato
cosa*, i clienti e le tariffe. Senza backend (ADR 0001), e usando l'app sia da telefono sia
da PC.

## Decisione

- **Fonte persistente**: un file JSON sul Google Drive dell'utente, con lo scope `drive.file`
  (non sensibile: l'app vede *solo* i file che ha creato lei).
- **Cache locale**: IndexedDB, così l'app si apre subito e funziona offline.
- **Conflitti tra dispositivi**: ogni scrittura su Drive controlla la versione del file; se
  nel frattempo è cambiato, si ricarica e si riapplica la modifica invece di sovrascrivere.
- **Export CSV** per avere i dati leggibili anche fuori dall'app.

## Alternative scartate

- **Solo IndexedDB**: niente sync tra dispositivi, e Safari su iOS cancella i dati dei siti
  non usati da 7 giorni (salvo PWA installata).
- **Google Sheet**: modificabile a mano, ma un foglio non è un database: struttura fragile e
  validazione a carico dell'app.
- **File SQLite (WebAssembly) su Drive**: blob binario opaco, prende il peggio delle altre due.

## Conseguenze

- Chi pubblica l'app non conserva nessun dato degli utenti.
- Il formato del file JSON va versionato (`schemaVersion`) e migrato quando cambia.
