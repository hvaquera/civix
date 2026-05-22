'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, PlusCircle, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home',        icon: Home,       label: 'Inicio' },
  { href: '/reportar',    icon: PlusCircle,  label: 'Reportar' },
  { href: '/mis-reportes',icon: FileText,    label: 'Reportes' },
  { href: '/perfil',      icon: User,        label: 'Perfil' },
]

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = pathname.startsWith('/onboarding') || pathname.startsWith('/registro')

  return (
    <div className="min-h-screen bg-gray-50">
      <main className={cn(!hideNav && 'pb-20')}>{children}</main>

      {!hideNav && (
        <nav className="bottom-nav">
          <div className="flex items-center h-16">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative',
                    isActive ? 'text-civix-600' : 'text-gray-400'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-civix-500 rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
