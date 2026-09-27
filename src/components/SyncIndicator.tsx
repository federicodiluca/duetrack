import { Cloud, CloudAlert, CloudCheck, CloudOff, CloudUpload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/format'
import { type SyncStatus, useData } from '@/state/data'

function describe(sync: SyncStatus): { icon: typeof Cloud; label: string; title: string } {
  switch (sync.state) {
    case 'synced':
      return { icon: CloudCheck, label: 'Salvato', title: `Salvato su Google Drive alle ${formatTime(sync.at)}` }
    case 'syncing':
      return { icon: CloudUpload, label: 'Salvo…', title: 'Sincronizzazione con Google Drive in corso' }
    case 'pending':
      return { icon: CloudUpload, label: 'Da salvare', title: 'Modifiche non ancora salvate su Google Drive' }
    case 'offline':
      return { icon: CloudOff, label: 'Offline', title: 'Sei offline: le modifiche restano qui e vanno su Drive al ritorno della rete' }
    case 'error':
      return { icon: CloudAlert, label: 'Errore', title: `Sincronizzazione non riuscita: ${sync.message}. Tocca per riprovare.` }
    case 'conflict':
      return { icon: CloudAlert, label: 'Conflitto', title: 'Due versioni diverse dei dati: scegli quale tenere' }
    case 'off':
      return { icon: Cloud, label: 'Solo locale', title: 'Dati salvati solo su questo dispositivo' }
  }
}

/** Dove sono i dati: salvati su Drive, in attesa, offline. Toccandolo si risincronizza. */
export function SyncIndicator() {
  const { sync, syncNow } = useData()
  const { icon: Icon, label, title } = describe(sync)
  const alert = sync.state === 'error' || sync.state === 'conflict'

  return (
    <Button variant="ghost" size="sm" onClick={syncNow} title={title} aria-label={title} className={alert ? 'text-destructive' : undefined}>
      <Icon className={sync.state === 'syncing' ? 'animate-pulse' : undefined} />
      {label}
    </Button>
  )
}
