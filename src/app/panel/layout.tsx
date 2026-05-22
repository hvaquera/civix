'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, FileText, Layers, Building2, Users, Settings,
  BarChart3, Bell, Menu, X, ChevronDown, LogOut, Map, Brain,
  Sparkles, Shield, MessageCircle, GitCommit
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/panel/dashboard',   icon: LayoutDashboard, label: 'Dashboard',          group: 'ops' },
  { href: '/panel/reportes',    icon: FileText,         label: 'Reportes',           group: 'ops' },
  { href: '/panel/issues',      icon: Layers,           label: 'Issues agrupados',   group: 'ops' },
  { href: '/panel/territorial', icon: Map,              label: 'Mapa territorial',   group: 'intel' },
  { href: '/panel/inteligencia',icon: Brain,            label: 'Inteligencia IA',    group: 'intel' },
  { href: '/panel/copilot',     icon: Sparkles,         label: 'Copilot Electoral',  group: 'intel' },
  { href: '/panel/warroom',     icon: Shield,           label: 'War Room',           group: 'intel' },
  { href: '/panel/campanas',    icon: MessageCircle,    label: 'Campañas',           group: 'intel' },
  { href: '/panel/promesas',    icon: GitCommit,        label: 'Promesas',           group: 'intel' },
  { href: '/panel/areas',       icon: Building2,        label: 'Áreas',              group: 'config' },
  { href: '/panel/usuarios',    icon: Users,            label: 'Usuarios',           group: 'config' },
  { href: '/panel/metricas',    icon: BarChart3,        label: 'Métricas',           group: 'config' },
  { href: '/panel/configuracion',icon: Settings,        label: 'Configuración',      group: 'config' },
]

const groups = [
  { key: 'ops',    label: 'Operaciones' },
  { key: 'intel',  label: 'Inteligencia' },
  { key: 'config', label: 'Administración' },
]

const mockUser = { name: 'María López', email: 'maria.lopez@monterrey.gob.mx', role: 'Admin Municipal', municipality: 'Monterrey' }

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  if (pathname === '/panel/login') return <>{children}</>

  const initials = mockUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full w-60 bg-navy-900 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-civix-500 rounded-lg flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">CIVIX</span>
            <span className="text-navy-500 text-xs">Panel</span>
          </div>
          <button className="lg:hidden text-navy-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
          {groups.map((group) => {
            const items = navItems.filter(n => n.group === group.key)
            return (
              <div key={group.key} className="mb-4">
                <p className="px-4 text-navy-600 text-xs font-semibold uppercase tracking-widest mb-1">{group.label}</p>
                {items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 mx-2 px-3 py-2 rounded-xl text-sm transition-colors',
                        isActive
                          ? 'bg-civix-500 text-white font-medium'
                          : 'text-navy-400 hover:text-white hover:bg-navy-800'
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-navy-800 p-3">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-navy-800 transition-colors"
          >
            <div className="w-8 h-8 bg-civix-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white text-xs font-semibold truncate">{mockUser.name}</p>
              <p className="text-navy-500 text-xs truncate">{mockUser.role}</p>
            </div>
            <ChevronDown className={cn('w-3.5 h-3.5 text-navy-500 transition-transform', userMenuOpen && 'rotate-180')} />
          </button>
          {userMenuOpen && (
            <div className="mt-1 mx-1 bg-navy-800 rounded-xl overflow-hidden">
              <Link href="/panel/login" className="flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-navy-700 text-xs transition-colors">
                <LogOut className="w-3.5 h-3.5" />Cerrar sesión
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-30">
          <button className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 px-2 hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {navItems.find(n => pathname.startsWith(n.href))?.label || 'Panel'}
            </p>
            <p className="text-xs text-gray-400">{mockUser.municipality}</p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-8 h-8 bg-civix-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
