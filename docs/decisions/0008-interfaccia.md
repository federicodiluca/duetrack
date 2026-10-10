# 0008 — Interfaccia: shadcn/ui, wouter, indirizzi con #

## Contesto

L'interfaccia deve funzionare bene da telefono e da tastiera: liste selezionabili, finestre
di conferma, menu per ogni sessione, avvisi con "Annulla". L'app è statica su GitHub Pages
e resta in cache come PWA.

## Decisione

- **Tailwind + shadcn/ui su Radix.** I componenti accessibili (dialog, menu, select,
  checkbox) vengono copiati nel repo in `src/components/ui`: sono codice nostro, modificabile,
  non una dipendenza da aggiornare. Tema blu notte e ambra come l'icona, chiaro o scuro
  secondo il sistema.
- **Date con il selettore nativo** (`<input type="date">`): su telefono apre il calendario
  del sistema, già in italiano, senza JavaScript in più.
- **wouter** come router, con indirizzi del tipo `#/clienti/…`. GitHub Pages serve solo file
  statici: un indirizzo "vero" come `/clienti/…` darebbe 404 ricaricando la pagina.
- **idb-keyval** per IndexedDB: i dati sono un solo documento JSON, basta un get/set.
- **Modalità demo** (`npm run demo`): login e calendario finti, dati salvati a parte. Serve a
  provare l'interfaccia senza account Google e per gli screenshot su dati inventati; Vite la
  elimina dalla build di produzione.

## Alternative scartate

- **react-router**: completo ma pensato per app con caricamento dati e rendering lato
  server; per quattro pagine pesava 32 kB minificati contro i 2 kB di wouter.
- **Date picker in JavaScript**: più peso e un'esperienza peggiore del selettore nativo su
  telefono.
- **CSS scritto a mano, Mantine**: vedi il confronto nella discussione del passo 3; il primo
  lascia a noi l'accessibilità dei componenti complessi, il secondo pesa di più e si
  riconosce a colpo d'occhio.

## Conseguenze

- Il bundle è circa 146 kB compressi, quasi tutti React DOM e Radix; con la PWA si scarica
  una volta sola.
- Gli aggiornamenti dei componenti shadcn non arrivano da soli: si rigenerano con la CLI
  quando serve, confrontando le modifiche.

## Aggiornamento (10/10/2026): tendine e menu sul telefono

Le tendine e i menu di Radix sono pensati per il mouse: voci alte 24 px, e il sottomenu
"Assegna a…" che sul telefono si apriva di lato, fuori schermo o sotto il dito.

- **Pannello dal basso sotto i 640 px.** `Picker` (tendine) e `ActionMenu` (menu ⋮) sul
  computer restano Select e DropdownMenu di Radix; sul telefono aprono uno `Sheet` che sale
  dal basso, con voci alte 48 px e la ricerca oltre 8 voci. Il sottomenu diventa una seconda
  schermata del pannello, con la freccia per tornare indietro. Lo `Sheet` è il Dialog di
  Radix con un altro stile: niente dipendenze nuove, e focus, Esc e lettori di schermo
  già gestiti. Scartati il `<select>` nativo (niente ricerca, e non risolve i menu) e il
  solo ingrandimento (sottomenu e liste lunghe restavano scomodi).
- **Misure al tocco con `pointer-coarse`.** Su uno schermo touch pulsanti, campi e caselle
  crescono (40 px invece di 32); con il mouse restano compatti. Il criterio è diverso dal
  pannello di proposito: un tablet ha spazio per una tendina, ma la tocca col dito.
