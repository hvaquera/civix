'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Building2, 
  Users, 
  Settings, 
  BarChart3,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Map,
  Brain,
  Sparkles,
  Shield,
  MessageCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/panel/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/panel/reportes', icon: FileText, label: 'Reportes' },
  { href: '/panel/issues', icon: Layers, label: 'Issues agrupados' },
  { href: '/panel/territorial', icon: Map, label: 'Mapa Territorial' },
  { href: '/panel/inteligencia', icon: Brain, label: 'Inteligencia IA' },
  { href: '/panel/copilot', icon: Sparkles, label: 'Copilot Electoral' },
  { href: '/panel/warroom', icon: Shield, label: 'War Room Día D' },
  { href: '/panel/campanas', icon: MessageCircle, label: 'Campañas' },
  { href: '/panel/areas', icon: Building2, label: 'Áreas' },
  { href: '/panel/usuarios', icon: Users, label: 'Usuarios' },
  { href: '/panel/configuracion', icon: Settings, label: 'Configuración' },
  { href: '/panel/metricas', icon: BarChart3, label: 'Métricas' },
]

// Mock user
const mockUser = {
  name: 'María López',
  email: 'maria.lopez@monterrey.gob.mx',
  role: 'Admin Municipal',
  municipality: 'Monterrey',
}

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Don't show layout on login page
  if (pathname === '/panel/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link href="/panel/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-civix-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">GobPanel</span>
              <span className="text-xs text-gray-500 block">CIVIX</span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-civix-50 text-civix-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {mockUser.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{mockUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{mockUser.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-full px-4 flex items-center justify-between gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar folio, colonia, calle o ciudadano"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-civix-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Municipality badge */}
              <div className="hidden sm:block px-3 py-1 bg-civix-50 text-civix-700 rounded-full text-sm font-medium">
                {mockUser.municipality}
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {mockUser.name.charAt(0)}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
                      <div className="p-3 border-b">
                        <p className="font-medium text-gray-900">{mockUser.name}</p>
                        <p className="text-sm text-gray-500">{mockUser.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/panel/perfil"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Mi perfil
                        </Link>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                          onClick={() => {
                            setUserMenuOpen(false)
                            // TODO: Logout
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
