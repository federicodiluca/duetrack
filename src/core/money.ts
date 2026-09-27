// Gli importi sono centesimi interi. In virgola mobile 0.1 + 0.2 fa 0.30000000000000004:
// con i centesimi le somme sono esatte e si arrotonda una volta sola, per sessione.

/** Importo di una sessione: durata × tariffa oraria, in proporzione, al centesimo. */
export function amountForDuration(durationMinutes: number, centsPerHour: number): number {
  return Math.round((durationMinutes * centsPerHour) / 60)
}

/**
 * Legge un importo scritto a mano, in centesimi: "25", "25,5", "25,50 €", "1.250,00".
 * Restituisce undefined se il testo non è un importo valido.
 */
export function parseMoney(input: string): number | undefined {
  const text = input.replace(/[€\s]/g, '')
  // Formato italiano (il punto separa le migliaia, la virgola i decimali), oppure il
  // punto come separatore decimale quando non può indicare le migliaia.
  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(text) ?? /^(\d+)\.(\d{1,2})$/.exec(text)
  if (!match) return undefined
  const units = Number(match[1].replace(/\./g, ''))
  const cents = Number((match[2] ?? '').padEnd(2, '0'))
  return units * 100 + cents
}

/** Centesimi → testo modificabile in un campo: 2550 → "25,50", 2500 → "25". */
export function centsToInput(cents: number): string {
  const units = Math.floor(cents / 100)
  const rest = cents % 100
  return rest === 0 ? String(units) : `${units},${String(rest).padStart(2, '0')}`
}

export function formatMoney(cents: number, currency = 'EUR', locale = 'it-IT'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100)
}
