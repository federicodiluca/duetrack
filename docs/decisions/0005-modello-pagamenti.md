# 0005 — Modello di sessioni, importi e pagamenti

## Contesto

Alcuni clienti pagano a ogni sessione, altri dopo un periodo arbitrario (non per forza a
fine mese). Serve anche poter correggere a mano: sessioni non in calendario, eventi che non
sono sessioni, prezzi concordati diversi, errori di marcatura.

## Decisione

- **Cliente**: nome, alias, **storico delle tariffe** orarie (ognuna valida da una data), e
  un **"pagare da"** memorizzato (data facoltativa).
- **Sessione**: un evento del calendario oppure una sessione inserita a mano. Non si salva:
  si ricava a ogni lettura del calendario, così i nuovi eventi compaiono da soli.
- **Correzioni** per sessione, salvate a parte: assegnazione manuale a un cliente,
  esclusione ("non era una lezione"), importo concordato.
- **Importo** = durata × tariffa in vigore quel giorno, in proporzione (1h30 a 20 €/h = 30 €).
  Calcolato in **centesimi interi**, mai in virgola mobile. Senza tariffa per quella data
  l'importo resta indefinito e viene segnalato, non contato come zero.
- **Pagamento**: raggruppa una o più sessioni e ne salva una **fotografia** (inizio, durata,
  importo). Annullarlo libera tutte le sue sessioni in un colpo.
- **Vista per cliente**: di default tutte le sessioni non pagate; con "pagare da" impostato,
  solo quelle da quella data in poi, con totale di ore ed euro. Le non pagate precedenti
  restano contate a parte, non spariscono.
- **Azioni rapide**: "pagate N lezioni" (le N più vecchie della vista), "pagare da questa
  data", "escludi", "assegna a…".
- **Anomalie**: un evento pagato che è stato cancellato o ha cambiato durata viene segnalato
  confrontandolo con la fotografia; mai corretto in automatico.

## Alternative scartate

- **Flag `pagato` su ogni sessione**: non permette di annullare un pagamento di gruppo, di
  sapere quali sessioni sono state saldate insieme, né di accorgersi di modifiche successive.
- **Modalità fissa "a lezione" / "a fine mese"**: "pagare da" copre entrambi i casi con un
  solo strumento.
- **Tariffa unica per cliente**: un aumento ricalcolerebbe anche le sessioni passate non
  ancora pagate.

## Conseguenze

- La logica sta in `src/core` come funzioni pure (stato in ingresso, stato nuovo in uscita),
  testabili senza browser né API.
- Un'anomalia su un evento fuori dal periodo letto non può essere rilevata: si confronta
  solo ciò che è stato caricato.
