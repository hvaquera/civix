'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, UserPlus, FolderSync, Search, User, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/campo/home', icon: Home, label: 'Inicio' },
  { href: '/campo/registro/ine', icon: UserPlus, label: 'Registrar' },
  { href: '/campo/registros', icon: FolderSync, label: 'Mis registros' },
  { href: '/campo/buscar', icon: Search, label: 'Buscar' },
  { href: '/campo/perfil', icon: User, label: 'Perfil' },
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
      <div className={cn('h-1 w-full transition-colors duration-300', isOnline ? 'bg-green-500' : 'bg-orange-500')} />
      <main className={cn(!hideNav && !isCoordinator && 'pb-20')}>
        {children}
      </main>
      {!hideNav && !isCoordinator && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href} className={cn('flex flex-col items-center justify-center w-full h-full gap-1 transition-colors', isActive ? 'text-civix-600' : 'text-gray-400')}>
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
