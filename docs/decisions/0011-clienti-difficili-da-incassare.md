# 0011 — Clienti difficili da incassare, fuori dal totale

## Contesto

Alcuni clienti non hanno saldato e probabilmente non lo faranno. Il loro dovuto gonfia il
"da incassare" in panoramica, che smette di dire quanto arriverà davvero.

## Decisione

- Si segna il **cliente intero**, dal menu della sua pagina: campo `doubtful` sul cliente,
  assente quando è falso.
- Il suo dovuto resta com'è: se paga, si segna pagato come sempre. Esce però dal totale
  "da incassare", che mostra a parte "in più X € difficili da incassare".
- In panoramica i clienti stanno in tre gruppi: chi deve pagare, i difficili in un riquadro
  giallo, e chi ha pagato tutto, chiuso sotto una freccetta (si apre da solo cercando).

## Alternative scartate

- **Segnare singole sessioni**: più preciso, ma più laborioso, e lo stesso cliente finirebbe in
  due gruppi.
- **Lasciarli nel totale**: il riquadro giallo separerebbe solo visivamente, e il numero in
  alto resterebbe ottimista.
