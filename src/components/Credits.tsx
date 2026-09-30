import { ShareApp } from '@/components/ShareApp'

const link = 'font-medium text-foreground underline-offset-4 hover:underline'

/** Chi ha fatto Duetrack e come contattarlo: nel footer e nella schermata di accesso. */
export function Credits() {
  return (
    <p className="text-sm text-muted-foreground">
      Duetrack è un progetto di{' '}
      <a className={link} href="https://federicodiluca.com/" target="_blank" rel="noopener">
        Federico Di Luca
      </a>
      . Scopri gli{' '}
      <a className={link} href="https://federicodiluca.com/progetti/" target="_blank" rel="noopener">
        altri progetti
      </a>{' '}
      o scrivi a{' '}
      <a className={link} href="mailto:duetrack@federicodiluca.com">
        duetrack@federicodiluca.com
      </a>
      .{' '}
      <a className={link} href="/privacy/">
        Privacy
      </a>
      {' · '}
      <ShareApp className={link} />
    </p>
  )
}
