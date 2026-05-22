import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civix-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default:     'bg-civix-500 text-white hover:bg-civix-600 shadow-sm shadow-civix-200',
        navy:        'bg-navy-900 text-white hover:bg-navy-800',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline:     'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        secondary:   'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ghost:       'text-gray-600 hover:bg-gray-100',
        link:        'text-civix-600 underline-offset-4 hover:underline p-0 h-auto',
        success:     'bg-emerald-500 text-white hover:bg-emerald-600',
        warning:     'bg-amber-500 text-white hover:bg-amber-600',
      },
      size: {
        sm:   'h-9  px-3.5 text-xs  rounded-lg',
        md:   'h-11 px-4   text-sm  rounded-xl',
        lg:   'h-12 px-5   text-sm  rounded-xl',
        xl:   'h-14 px-6   text-base rounded-2xl',
        icon: 'h-10 w-10 rounded-xl',
        'icon-sm': 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
