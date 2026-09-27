# 0003 — Stato su IndexedDB + file JSON sul Drive dell'utente

## Contesto

Il calendario dice *quando* e *quanto dura* una sessione; va salvato altrove *chi ha pagato
cosa*, i clienti e le tariffe. Senza backend (ADR 0001), e usando l'app sia da telefono sia
da PC.

## Decisione

- **Fonte persistente**: un file JSON sul Google Drive dell'utente, con lo scope `drive.file`
  (non sensibile: l'app vede *solo* i file che ha creato lei).
- **Cache locale**: IndexedDB, così l'app si apre subito e funziona offline.
- **Conflitti tra dispositivi**: prima di scrivere si confronta la versione del file su Drive
  con quella da cui partono i dati locali. Se nel frattempo è cambiata, si rilegge il file e
  **si riapplicano sopra le modifiche locali**, come un `git rebase`: ogni modifica è una
  funzione pura `stato → nuovo stato`, quindi si può rieseguire su un altro stato. Una
  modifica che non ha più senso (es. un pagamento già registrato dall'altro dispositivo)
  viene scartata e segnalata. Se le modifiche locali non sono più note (app chiusa prima di
  sincronizzare), decide l'utente quale versione tenere.
- **Quando**: un secondo dopo l'ultima modifica, all'apertura, quando l'app torna in primo
  piano e quando torna la rete.
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
- L'API v3 di Drive non ha una scrittura condizionata ("scrivi solo se la versione è
  ancora X"): tra il controllo della versione e la scrittura resta una finestra di pochi
  millisecondi in cui due dispositivi potrebbero sovrascriversi. Con un solo utente che
  difficilmente modifica da due dispositivi nello stesso istante, è un rischio accettato.
- La logica sta in `SyncEngine`, una classe senza React testata con un Drive finto in
  memoria condiviso da due "dispositivi".
