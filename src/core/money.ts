// Gli importi sono centesimi interi. In virgola mobile 0.1 + 0.2 fa 0.30000000000000004:
// con i centesimi le somme sono esatte e si arrotonda una volta sola, per sessione.

/** Importo di una sessione: durata × tariffa oraria, in proporzione, al centesimo. */
export function amountForDuration(durationMinutes: number, centsPerHour: number): number {
  return Math.round((durationMinutes * centsPerHour) / 60)
}

export function formatMoney(cents: number, currency = 'EUR', locale = 'it-IT'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100)
}
