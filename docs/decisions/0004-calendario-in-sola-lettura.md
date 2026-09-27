# 0004 — Il calendario si legge soltanto, non si scrive

## Contesto

Lo stato "pagato" potrebbe essere scritto negli eventi (colore, descrizione, proprietà
estese) oppure tenuto solo nei dati dell'app.

## Decisione

L'app chiede solo permessi di **lettura** sul calendario. Lo stato dei pagamenti sta nei dati
dell'app (ADR 0003).

## Conseguenze

- Permessi minimi e nessun rischio di rovinare gli eventi.
- Un pagamento può coprire più sessioni, cosa che un singolo evento non sa rappresentare.
- Se un evento già pagato viene spostato o cancellato, l'app non lo elimina: lo segnala
  come anomalia da rivedere.
