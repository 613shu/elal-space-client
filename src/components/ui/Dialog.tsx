import * as RD from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { clsx } from 'clsx'
import { Close } from './Icons'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
  /** אל תציג את כפתור הסגירה (לחלון שחייבים לענות עליו) */
  hideClose?: boolean
  /** חלון מהצד (למובייל: נפתח מלמטה) */
  placement?: 'center' | 'sheet'
}

export function Dialog({ open, onOpenChange, title, description, children, className, hideClose, placement = 'center' }: DialogProps) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm data-[state=open]:animate-[fade-in_0.25s_ease-out]" />
        <RD.Content
          className={clsx(
            'fixed z-50 max-h-[90dvh] overflow-y-auto border border-border-strong bg-surface shadow-lift focus-visible:outline-none',
            placement === 'center'
              ? 'left-1/2 top-1/2 w-[min(92vw,40rem)] -translate-x-1/2 -translate-y-1/2 rounded-panel p-6 sm:p-8'
              : 'inset-x-0 bottom-0 rounded-t-panel p-6 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,44rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-panel sm:p-8 ',
            'data-[state=open]:animate-[dialog-in_0.35s_var(--ease-cinematic)]',
            className,
          )}
        >
          <RD.Title className="font-display text-title text-foreground">{title}</RD.Title>
          {description ? (
            <RD.Description className="mt-2 text-foreground-muted">{description}</RD.Description>
          ) : (
            <RD.Description className="sr-only">{title}</RD.Description>
          )}
          <div className="mt-5">{children}</div>
          {!hideClose && (
            <RD.Close
              aria-label="סגירה"
              className="absolute end-4 top-4 grid size-10 place-items-center rounded-full text-foreground-muted transition hover:bg-primary-soft hover:text-foreground"
            >
              <Close className="size-5" />
            </RD.Close>
          )}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}
