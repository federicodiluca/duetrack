# 0002 — Calendario Google dedicato, titolo = nome del cliente

## Contesto

Le sessioni di lavoro sono già eventi di Google Calendar con la durata reale. Bisogna
distinguerle dagli altri eventi e capire a quale cliente appartengono.

## Decisione

- Le sessioni stanno in un **calendario dedicato** (es. "Ripetizioni"), scelto nell'app.
  Ogni evento di quel calendario è una sessione.
- Il titolo contiene **solo il nome del cliente**, con un'emoji facoltativa che il parsing
  ignora: `📚 Davide`, `Giovanni G.`.
- Ogni cliente ha un nome visualizzato e una lista di **alias** (confronto senza maiuscole,
  accenti ed emoji). Un titolo che non corrisponde a nessun cliente, o a più di uno, finisce
  in una lista **"da classificare"**: non viene mai assegnato a caso o scartato in silenzio.

## Alternative scartate

- **Calendario principale + pattern nel titolo** (`📚 ripetizioni Davide`): serve una regex
  su tutti gli eventi, con falsi positivi, e l'app dovrebbe leggere anche la vita privata.

## Conseguenze

- Il filtro è gratuito (un solo calendario) e il permesso richiesto può essere il più stretto
  possibile. Lo scope esatto (`calendar.events.owned.readonly` o `calendar.readonly`) si
  verifica nello spike del passo 1.
- Gli omonimi vanno distinti nel titolo (`Filippo`, `Filippo O.`): gli alias lo rendono
  esplicito invece che fragile.
