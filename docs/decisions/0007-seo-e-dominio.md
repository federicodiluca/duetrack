# 0007 — SEO sul sito principale, app non indicizzabile

## Contesto

Il progetto deve portare visibilità a federicodiluca.com. L'app però contiene solo dati
privati dietro login, e Google tratta i sottodomini quasi come siti separati.

## Decisione

- L'app sta su **duetrack.federicodiluca.com** (GitHub Pages, DNS su Cloudflare) ed è
  **non indicizzabile**: `<meta name="robots" content="noindex, nofollow">` e `robots.txt`
  con `Disallow: /`. GitHub Pages non permette header HTTP personalizzati, quindi niente
  `X-Robots-Tag`.
- La **pagina pubblica** del progetto sta sul sito principale (Astro), con testi, screenshot
  su dati finti e dati strutturati `SoftwareApplication`. Il README rimanda lì.

## Conseguenze

- Il valore SEO resta sul dominio principale invece di disperdersi sul sottodominio.
- Sul server non c'è nessun dato privato: l'app pubblicata è un guscio vuoto.
