// Il titolo di un evento è il nome del cliente, con un'emoji facoltativa (ADR 0002).
// Due funzioni: una per mostrarlo, una per confrontarlo con nomi e alias.

// Emoji e loro "collanti": i selettori di variante (U+FE0F) e lo zero-width joiner
// (U+200D) che unisce più emoji in una sola, come 👨‍🏫.
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu

/** Il titolo senza emoji e spazi superflui, con maiuscole e accenti originali. */
export function displayTitle(title: string): string {
  return title.replace(EMOJI, '').replace(/\s+/g, ' ').trim()
}

/**
 * Chiave di confronto: minuscolo, senza accenti, emoji né punteggiatura.
 * "📚 Niccolò G." e "niccolo g" producono la stessa chiave.
 */
export function titleKey(title: string): string {
  return (
    displayTitle(title)
      // NFD separa la lettera dal suo accento ("ò" → "o" + "̀"): poi gli accenti
      // (categoria Unicode "Mark") si tolgono con una regex.
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
  )
}
