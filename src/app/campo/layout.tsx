'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, UserPlus, FolderSync, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/campo/home',      icon: Home,       label: 'Inicio' },
  { href: '/campo/registro/ine', icon: UserPlus, label: 'Registrar' },
  { href: '/campo/registros', icon: FolderSync,  label: 'Mis registros' },
  { href: '/campo/buscar',    icon: Search,      label: 'Buscar' },
  { href: '/campo/perfil',    icon: User,        label: 'Perfil' },
]

export default function CampoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const hideNav = pathname.startsWith('/campo/login') || pathname.startsWith('/campo/registro/')
  const isCoordinator = pathname.startsWith('/campo/coordinador')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Connectivity stripe */}
      <div className={cn(
        'h-0.5 w-full transition-colors duration-500',
        isOnline ? 'bg-emerald-500' : 'bg-amber-500'
      )} />

      <main className={cn(!hideNav && !isCoordinator && 'pb-20')}>
        {children}
      </main>

      {!hideNav && !isCoordinator && (
        <nav className="bottom-nav">
          <div className="flex items-center h-16">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href.replace('/registro/ine','') + '/')
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
