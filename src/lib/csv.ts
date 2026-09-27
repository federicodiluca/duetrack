/**
 * Un CSV che Excel in italiano apre bene: separatore punto e virgola (la virgola è il
 * separatore decimale) e BOM iniziale, senza il quale Excel non riconosce l'UTF-8 e
 * rovina le lettere accentate.
 */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (value: string | number) => {
    const text = String(value)
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return '﻿' + rows.map((row) => row.map(cell).join(';')).join('\r\n')
}

/** Numero con la virgola decimale, come lo vuole un foglio di calcolo italiano. */
export function decimal(value: number, digits = 2): string {
  return value.toFixed(digits).replace('.', ',')
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}
