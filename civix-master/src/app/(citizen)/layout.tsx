'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, PlusCircle, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home', icon: Home, label: 'Inicio' },
  { href: '/reportar', icon: PlusCircle, label: 'Reportar' },
  { href: '/mis-reportes', icon: FileText, label: 'Reportes' },
  { href: '/perfil', icon: User, label: 'Perfil' },
]

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Hide nav on onboarding and registro flows
  const hideNav = pathname.startsWith('/onboarding') || pathname.startsWith('/registro')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <main className={cn('pb-20', hideNav && 'pb-0')}>
        {children}
      </main>

      {/* Bottom navigation */}
      {!hideNav && (
        <nav className="bottom-nav">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                    isActive ? 'text-civix-600' : 'text-gray-400'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
