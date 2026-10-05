import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface FieldShellProps {
  label: string
  hint?: string
  error?: string
  id: string
  children: ReactNode
  className?: string
  optional?: boolean
}

function FieldShell({ label, hint, error, id, children, className, optional }: FieldShellProps) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-caption font-medium text-foreground-muted">
        <span>{label}</span>
        {optional && <span className="text-micro text-foreground-subtle">אופציונלי</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption text-foreground-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="flex items-center gap-1.5 text-caption text-destructive">
          <svg viewBox="0 0 20 20" className="size-4 shrink-0" fill="currentColor" aria-hidden="true">
            <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-.9 4h1.8v5H9.1V6Zm0 6.6h1.8v1.8H9.1v-1.8Z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

const inputBase =
  'h-12 w-full rounded-control border bg-surface-sunken/80 px-4 text-body text-foreground placeholder:text-foreground-subtle transition-[border-color,box-shadow] duration-200 hover:border-primary focus-visible:border-accent focus-visible:shadow-focus disabled:opacity-50'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  /** מספרים, אימייל, קודים: להציג משמאל לימין */
  ltr?: boolean
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, optional, ltr, className, ...rest },
  ref,
) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        dir={ltr ? 'ltr' : undefined}
        className={clsx(inputBase, error ? 'border-destructive' : 'border-control', ltr && 'text-start [text-align:left]')}
        {...rest}
      />
    </FieldShell>
  )
})

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  optional?: boolean
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, optional, className, children, ...rest },
  ref,
) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={clsx(inputBase, 'appearance-none pe-4 ps-10', error ? 'border-destructive' : 'border-control')}
          {...rest}
        >
          {children}
        </select>
        <svg viewBox="0 0 20 20" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </FieldShell>
  )
})

interface CheckProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
}

export const Check = forwardRef<HTMLInputElement, CheckProps>(function Check({ label, className, ...rest }, ref) {
  return (
    <label className={clsx('group flex cursor-pointer items-center gap-3 text-body text-foreground-muted', className)}>
      <input ref={ref} type="checkbox" className="peer sr-only" {...rest} />
      <span className="grid size-5 shrink-0 place-items-center rounded-md border border-control bg-surface-sunken transition peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:shadow-focus peer-checked:[&>svg]:opacity-100">
        <svg viewBox="0 0 16 16" className="size-3.5 text-primary-foreground opacity-0 transition" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="m3 8.5 3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="group-hover:text-foreground">{label}</span>
    </label>
  )
})
