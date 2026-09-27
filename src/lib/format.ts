import type { IsoDate } from '@/core/model'

const dayFormat = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' })
const dayYearFormat = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' })
const shortDateFormat = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** "mar 30/06", con l'anno solo se non è quello corrente. */
export function formatDay(date: Date): string {
  return (date.getFullYear() === new Date().getFullYear() ? dayFormat : dayYearFormat).format(date)
}

export function formatTime(date: Date): string {
  return timeFormat.format(date)
}

/** Una IsoDate come data locale: new Date('2026-05-26') sarebbe mezzanotte UTC, non locale. */
export function isoToDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "26/05/2026". */
export function formatIsoDate(iso: IsoDate): string {
  return shortDateFormat.format(isoToDate(iso))
}

export function pluralize(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}
