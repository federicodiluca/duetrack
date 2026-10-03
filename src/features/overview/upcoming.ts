import type { IsoDate } from '@/core/model'
import { formatDay, isoToDate } from '@/lib/format'

/** "Oggi", "Domani", altrimenti "mar 07/10". */
export function upcomingDayLabel(date: IsoDate, today: IsoDate): string {
  const tomorrow = isoToDate(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date === today) return 'Oggi'
  if (isoToDate(date).getTime() === tomorrow.getTime()) return 'Domani'
  return formatDay(isoToDate(date))
}
