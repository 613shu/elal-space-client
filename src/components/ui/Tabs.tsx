import * as RT from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export const Tabs = RT.Root

export function TabList({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  return (
    <RT.List aria-label={label} className={clsx('inline-flex gap-1 rounded-full border border-border bg-surface/70 p-1 backdrop-blur', className)}>
      {children}
    </RT.List>
  )
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RT.Trigger
      value={value}
      className="rounded-full px-5 py-2 text-caption font-medium text-foreground-muted transition hover:text-foreground focus-visible:shadow-focus data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow"
    >
      {children}
    </RT.Trigger>
  )
}

export const TabPanel = RT.Content
