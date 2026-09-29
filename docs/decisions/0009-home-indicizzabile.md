# 0009 — Home indicizzabile sul sottodominio

Sostituisce lo [0007](0007-seo-e-dominio.md).

## Contesto

Lo 0007 rendeva l'app non indicizzabile perché era "un guscio privato dietro login", e
contava su una pagina pubblica del progetto su federicodiluca.com. Le cose sono cambiate:

- la schermata di accesso è diventata una home pubblica con contenuti veri (cosa fa l'app,
  per chi è, perché chiede i permessi Google), richiesta anche dalla schermata di consenso;
- la pagina sul sito principale non è mai stata fatta: lì Duetrack ha solo la scheda
  nell'elenco dei progetti, quindi oggi non si trova da nessuna parte;
- Listo, sullo stesso dominio, indicizza le sue pagine pubbliche e tiene fuori solo l'app.

## Decisione

- **Home e informativa privacy indicizzabili**: `robots.txt` aperto con sitemap, canonical,
  `hreflang` tra le due versioni della privacy.
- Le sezioni dell'app stanno dopo il `#` (ADR 0008), quindi per i motori di ricerca esiste
  una sola pagina, `/`; i dati privati restano dietro il login e sul Drive dell'utente.
- **La home è scritta nell'HTML durante la build** (plugin `prerenderHome` in
  `vite.config.ts`, che usa `src/prerender.tsx`): chi non esegue JavaScript, come molti
  motori e assistenti AI, legge comunque il testo. Nel browser React la ridisegna identica.
- **Dati strutturati** `WebApplication` (con l'autore) e `FAQPage`; le domande frequenti
  hanno una sola fonte, `src/app/faq.ts`, mostrata anche nella pagina.

## Conseguenze

- Il valore SEO resta su un sottodominio invece che sul sito principale: accettato, perché
  è l'unica pagina che descrive davvero l'app, e rimanda a federicodiluca.com nei crediti.
- **Il tetto dei 100 utenti** dell'app OAuth non verificata si raggiunge prima se arriva
  traffico da Google. Superato quello, serve la verifica ([docs/oauth-verification.md](../oauth-verification.md)).
- Il prerender vale solo per la home: una pagina pubblica nuova va aggiunta allo stesso
  meccanismo e alla sitemap.
