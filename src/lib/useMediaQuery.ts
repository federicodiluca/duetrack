import { useSyncExternalStore } from 'react'

/**
 * Vero finché la media query è soddisfatta, e si aggiorna se cambia (telefono ruotato,
 * finestra ridimensionata). useSyncExternalStore legge il valore già al primo render,
 * senza il lampo di un useEffect; durante il prerender della home vale false.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Schermo da telefono: sotto il breakpoint `sm` di Tailwind (640 px). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)')
}
