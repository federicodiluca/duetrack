Fare ripetizioni è bello. Tenere i conti, meno.

Segnavo ogni lezione sul calendario e poi rifacevo i calcoli a mano: quante ore con questo cliente, a che tariffa, chi ha già pagato. Ho scritto Duetrack per togliermi il secondo passaggio.

Funziona così: un calendario dedicato, con il nome del cliente come titolo dell'evento. Duetrack legge gli eventi, calcola quanto ti deve ogni cliente da durata e tariffa oraria, e ti lascia segnare i pagamenti, una sessione alla volta o a blocchi. Il calendario resta l'unica cosa da aggiornare.

Qualche dettaglio che mi è servito davvero:
• tariffe con storico: un aumento vale da una data in poi, il passato resta com'era
• «pagare da»: per chi salda dopo un periodo, un tocco e tutto il blocco è pagato
• un promemoria già scritto da copiare e mandare al cliente
• gli eventi che non corrispondono a nessun cliente non spariscono: diventano un cliente nuovo, un alias o un titolo da ignorare

Tecnicamente: React, TypeScript, Tailwind e shadcn/ui, nessun server. L'app gira nel browser, i dati stanno sul dispositivo e in un file su Google Drive che solo Duetrack può vedere; il calendario viene solo letto. Una nota onesta: l'app OAuth non è verificata da Google (scelta voluta), quindi al primo accesso compare un avviso.

È gratuita: duetrack.federicodiluca.com

#react #typescript #googlecalendar #freelance #pwa
