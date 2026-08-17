import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { audio } from '@/lib/audio'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  /** 클릭음을 끄고 싶을 때 */
  silent?: boolean
  full?: boolean
}

const VARIANT: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

const SIZE: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: '',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'ghost', size = 'md', icon, silent, full, className, onClick, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(VARIANT[variant], SIZE[size], full && 'w-full', className)}
      onClick={(event) => {
        if (!silent) audio.play('click')
        onClick?.(event)
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
})
