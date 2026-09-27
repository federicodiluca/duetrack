import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useData } from '@/state/data'

/**
 * Compare quando questo dispositivo e Google Drive hanno modifiche diverse che non si
 * possono unire da sole: capita solo con modifiche lasciate a metà da una sessione precedente.
 */
export function ConflictDialog() {
  const { sync, resolveConflict } = useData()

  return (
    <AlertDialog open={sync.state === 'conflict'}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Due versioni diverse dei dati</AlertDialogTitle>
          <AlertDialogDescription>
            Su questo dispositivo ci sono modifiche non ancora salvate, e intanto i dati su Google Drive sono cambiati da un
            altro dispositivo. Scegli quale versione tenere: l’altra verrà sostituita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => resolveConflict('device')}>Tieni questo dispositivo</AlertDialogCancel>
          <AlertDialogAction onClick={() => resolveConflict('drive')}>Tieni Google Drive</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
