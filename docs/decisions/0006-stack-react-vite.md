# 0006 — React + Vite + TypeScript

## Contesto

L'app è interamente interattiva e sta dietro login, quindi il framework non incide sul SEO
(vedi ADR 0007). Contano la qualità dell'interfaccia e la manutenzione nel tempo libero.

## Decisione

React + Vite + TypeScript, con oxlint come linter (il default del template Vite attuale).

## Alternative scartate

- **Svelte 5**: bundle più leggero e reattività più semplice, ma meno componenti pronti e
  accessibili; la differenza di peso sparisce con una PWA in cache.
- **Astro con isole**: ottimo per siti di contenuti, aggiunge poco a un'app tutta interattiva.

## Conseguenze

- Ecosistema più ricco per un'interfaccia curata e accessibile (dialog, date picker, liste
  selezionabili).
- Stessa base di altri progetti dell'autore: meno attrito di manutenzione.
