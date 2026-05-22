import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-civix-500 text-white',
        secondary:   'bg-gray-100 text-gray-600',
        destructive: 'bg-red-500 text-white',
        outline:     'border border-current bg-transparent',
        success:     'bg-emerald-50 text-emerald-700',
        warning:     'bg-amber-50 text-amber-700',
        danger:      'bg-red-50 text-red-700',
        info:        'bg-blue-50 text-blue-700',
        purple:      'bg-violet-50 text-violet-700',
        orange:      'bg-orange-50 text-orange-700',
        gray:        'bg-gray-100 text-gray-600',
        navy:        'bg-navy-900 text-white',
        indigo:      'bg-civix-50 text-civix-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
