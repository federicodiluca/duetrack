# 0010 — Sessioni in programma, lette a parte e fuori dal conto

## Contesto

Fino a qui il calendario si leggeva solo fino ad adesso: una sessione futura non è ancora né
fatta né dovuta. Vedere le prossime sessioni però è comodo: chi viene domani, quando torna un
cliente, se in calendario c'è un titolo che non verrà riconosciuto.

## Decisione

- Le sessioni future si leggono con una **richiesta separata**, da adesso a N settimane, e non
  passano mai dal registro del dovuto (`buildLedger`). Il conto resta giusto per costruzione,
  non perché ogni vista si ricorda di filtrarle.
- Sono riconosciute come le altre (clienti, alias, titoli esclusi, tariffe) da `buildUpcoming`,
  che riusa la stessa logica senza sessioni manuali né pagamenti.
- Si vedono nella panoramica ("Prossime sessioni", per giorno, in un riquadro tratteggiato) e
  nella pagina del cliente ("Prossima sessione…"). Nessun totale in euro, per non confonderle
  con il dovuto.
- Impostazione `upcomingWeeks`, salvata con gli altri dati su Drive: 2 settimane di default,
  0 le nasconde.
- Tornando sull'app dopo più di cinque minuti il calendario si rilegge, così una sessione
  appena finita passa dalle prossime al conto.

## Alternative scartate

- **Allungare la finestra letta oltre adesso** e filtrare le future nelle viste: ogni vista
  (dovuto, report, anomalie, da classificare) dovrebbe ricordarsene, e basta dimenticarne una.
- **Previsione d'incasso nel resoconto**: utile, ma aggiunge proprio la confusione tra fatto e
  previsto che questa decisione evita. Si può riconsiderare.

## Conseguenze

- Una richiesta in più al calendario a ogni lettura, con gli stessi permessi di prima.
- Una sessione in corso conta già come fatta (comportamento invariato) e non compare tra le
  prossime.
- I titoli futuri non riconosciuti finiscono anche in "Da classificare": un cliente nuovo si
  crea prima della prima sessione, e l'assegnazione vale poi anche quando la sessione passa.
