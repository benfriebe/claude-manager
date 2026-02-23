import { cn } from '../../lib/cn'

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  small?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'border-neon-green/40 text-neon-green hover:bg-neon-green/10 hover:border-neon-green/70',
  ghost:
    'border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary hover:border-border-bright',
  danger:
    'border-neon-red/30 text-neon-red hover:bg-neon-red/10 hover:border-neon-red/60',
}

export function Button({
  variant = 'ghost',
  small,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'cursor-pointer border font-mono transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
        small ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1.5 text-xs',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
