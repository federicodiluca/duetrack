import * as React from "react"
import { cn } from "cn"
import { Dialog as DialogPrimitive } from "radix-ui"

/*
 * Pannello che sale dal basso, per il telefono: le voci stanno sotto il pollice e sono
 * grandi. È un Dialog di Radix con un altro stile, quindi ne eredita focus, Esc, tocco
 * fuori per chiudere e lettori di schermo.
 */

function Sheet(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetContent({
  className,
  children,
  title,
  description,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-black/30 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        // Senza descrizione Radix vuole il valore esplicito, altrimenti avvisa in console.
        {...(!description && { "aria-describedby": undefined })}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-popover pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-200 outline-none data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
          className
        )}
        {...props}
      >
        <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        <DialogPrimitive.Title className="shrink-0 px-4 pt-3 pb-2 font-heading text-base font-medium">
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="shrink-0 px-4 pb-2 text-sm text-muted-foreground">
            {description}
          </DialogPrimitive.Description>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** Una voce del pannello: alta 48 px, comoda per il dito. */
function SheetItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"button"> & { variant?: "default" | "destructive" }) {
  return (
    <button
      type="button"
      data-slot="sheet-item"
      data-variant={variant}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-base outline-none active:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50 data-[variant=destructive]:text-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        className
      )}
      {...props}
    />
  )
}

export { Sheet, SheetContent, SheetItem }
