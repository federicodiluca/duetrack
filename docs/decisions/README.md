# Decisioni architetturali

Ogni file registra una decisione: il contesto, cosa si è scelto, le alternative scartate e le
conseguenze. Formato ADR ([Architecture Decision Record](https://adr.github.io/)), in breve.
Una decisione superata non si cancella: si scrive un nuovo ADR che la sostituisce.

| # | Decisione | Stato |
| --- | --- | --- |
| [0001](0001-local-first-senza-backend.md) | App local-first statica, nessun backend | Accettata |
| [0002](0002-calendario-dedicato.md) | Calendario Google dedicato, titolo = nome del cliente | Accettata |
| [0003](0003-persistenza-drive-utente.md) | Stato su IndexedDB + file JSON sul Drive dell'utente | Accettata |
| [0004](0004-calendario-in-sola-lettura.md) | Il calendario si legge soltanto, non si scrive | Accettata |
| [0005](0005-modello-pagamenti.md) | Modello di sessioni, importi e pagamenti | Accettata |
| [0006](0006-stack-react-vite.md) | React + Vite + TypeScript | Accettata |
| [0007](0007-seo-e-dominio.md) | SEO sul sito principale, app non indicizzabile | Superata dallo 0009 |
| [0008](0008-interfaccia.md) | Interfaccia: shadcn/ui, wouter, indirizzi con # | Accettata |
| [0009](0009-home-indicizzabile.md) | Home indicizzabile, scritta nell'HTML durante la build | Accettata |
