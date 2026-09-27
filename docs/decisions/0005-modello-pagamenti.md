# 0005 — Modello di sessioni, importi e pagamenti

## Contesto

Alcuni clienti pagano a ogni sessione, altri dopo un periodo arbitrario (non per forza a
fine mese). Serve anche poter correggere a mano: sessioni non in calendario, prezzi
concordati diversi, errori di marcatura.

## Decisione

- **Cliente**: nome, alias, tariffa oraria, e un **"pagare da"** memorizzato (data facoltativa).
- **Sessione**: collegata a un evento del calendario oppure inserita a mano; durata, importo
  calcolato, eventuale **importo corretto a mano**, eventuale esclusione.
- **Importo** = durata × tariffa oraria, in proporzione (1h30 a 20 €/h = 30 €). Calcolato in
  **centesimi interi**, mai in virgola mobile.
- **Pagamento**: un record che raggruppa una o più sessioni. "Segna pagate" sulla vista
  filtrata crea un pagamento; annullarlo libera tutte le sue sessioni in un colpo.
- **Vista per cliente**: di default tutte le sessioni non pagate con i loro importi; con
  "pagare da" impostato, solo quelle da quella data in poi, con totale di ore ed euro.

## Alternative scartate

- **Flag `pagato` su ogni sessione**: non permette di annullare un pagamento di gruppo né di
  sapere quali sessioni sono state saldate insieme.
- **Modalità fissa "a lezione" / "a fine mese"**: "pagare da" copre entrambi i casi con un
  solo strumento.

## Conseguenze

- La logica di calcolo è fatta di funzioni pure, testabili senza browser né API.
- Se la tariffa cambia, il cambio vale per le sessioni da quel momento in poi; lo storico
  delle tariffe si aggiunge solo se serve.
