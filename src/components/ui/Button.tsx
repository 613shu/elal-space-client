import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-[background,box-shadow,transform,color,border-color] duration-300 ease-cinematic select-none disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-px focus-visible:shadow-focus'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-glow hover:bg-primary-hover hover:shadow-glow-accent active:bg-primary-pressed',
  secondary:
    'border border-border-strong bg-surface/70 text-foreground backdrop-blur hover:border-primary hover:bg-surface-raised',
  ghost: 'text-foreground-muted hover:bg-primary-soft hover:text-foreground',
  gold: 'bg-gold text-gold-foreground shadow-gold hover:brightness-110',
  danger: 'border border-destructive/50 bg-destructive-soft text-destructive hover:bg-destructive/20',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-caption',
  md: 'h-11 px-5 text-body',
  lg: 'h-14 px-8 text-lead',
}

/** גם לקישורים: <Link className={buttonClasses({variant:'primary'})}> */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
  block,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  block?: boolean
} = {}) {
  return clsx(base, variants[variant], sizes[size], block && 'w-full', className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  block?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, block, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  )
})
