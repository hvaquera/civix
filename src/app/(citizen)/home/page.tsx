'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Construction, Lightbulb, Trash2, TreePine, Droplets, ShieldAlert,
  ChevronRight, Bell, Flame, Star, TrendingUp, Wifi, WifiOff, User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_CITIZEN_LABELS, formatRelativeTime } from '@/lib/utils'

const mockUser = { name: 'Juan', colonia: 'Centro', xp: 320, level: 3, streak: 5 }

const mockRecentReports = [
  {
    id: '1', folio: 'CIV-2024-00123', category: 'Baches', categoryIcon: Construction,
    status: 'en_proceso', colonia: 'Centro', operator: 'Juan Pérez — Servicios Públicos',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(), hasUpdate: true,
  },
  {
    id: '2', folio: 'CIV-2024-00098', category: 'Alumbrado', categoryIcon: Lightbulb,
    status: 'resuelto', colonia: 'Centro', operator: 'Ana García — Alumbrado',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(), hasUpdate: false,
  },
]

const categories = [
  { id: 'baches',    label: 'Baches',    icon: Construction, bg: 'bg-orange-100', color: 'text-orange-600' },
  { id: 'alumbrado', label: 'Alumbrado', icon: Lightbulb,    bg: 'bg-yellow-100', color: 'text-yellow-600' },
  { id: 'basura',    label: 'Basura',    icon: Trash2,       bg: 'bg-green-100',  color: 'text-green-600'  },
  { id: 'parques',   label: 'Parques',   icon: TreePine,     bg: 'bg-emerald-100',color: 'text-emerald-600'},
  { id: 'agua',      label: 'Agua',      icon: Droplets,     bg: 'bg-blue-100',   color: 'text-blue-600'   },
  { id: 'seguridad', label: 'Seguridad', icon: ShieldAlert,  bg: 'bg-red-100',    color: 'text-red-600'    },
]

const STATUS_VARIANT: Record<string, any> = {
  recibido: 'info', en_proceso: 'purple', resuelto: 'success',
  no_procede: 'danger', revision_solicitada: 'orange',
}

export default function HomeCiudadanoPage() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const xpPct = Math.round(((mockUser.xp % 500) / 500) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="bg-navy-900 px-5 pt-12 pb-20">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-navy-400 text-sm">Bienvenido,</p>
            <h1 className="text-xl font-bold text-white mt-0.5">{mockUser.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Connectivity indicator */}
            <div className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium',
              isOnline ? 'bg-emerald-900/60 text-emerald-400' : 'bg-amber-900/60 text-amber-400'
            )}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Sin conexión'}
            </div>
            {/* Notifications */}
            <Link href="/notificaciones">
              <button className="relative w-9 h-9 bg-navy-800 rounded-xl flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-navy-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-navy-900" />
              </button>
            </Link>
          </div>
        </div>

        {/* XP / Gamification bar */}
        <div className="bg-navy-800/60 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-civix-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white text-xs font-semibold">Nivel {mockUser.level} · {mockUser.xp} XP</span>
              <div className="flex items-center gap-1 text-amber-400 text-xs font-medium">
                <Flame className="w-3 h-3" />{mockUser.streak} días
              </div>
            </div>
            <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
              <div className="h-full bg-civix-500 rounded-full transition-all" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* CTA card — overlaps hero */}
      <div className="px-4 -mt-10">
        <Link href="/reportar">
          <Card className="shadow-lg shadow-navy-900/10 border-0 overflow-hidden">
            <div className="bg-civix-500 p-4 flex items-center gap-4">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Hacer un reporte</p>
                <p className="text-civix-200 text-xs mt-0.5">Baches, alumbrado, basura y más</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Quick categories */}
      <div className="px-4 mt-5">
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Acceso rápido</p>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/reportar?categoria=${cat.id}`}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cat.bg)}>
                    <cat.icon className={cn('w-5 h-5', cat.color)} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight">{cat.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Community stats */}
      <div className="px-4 mt-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Tu colonia — {mockUser.colonia}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { value: '156', label: 'Reportes este mes', color: 'text-civix-600' },
              { value: '89%', label: 'Resueltos', color: 'text-emerald-600' },
              { value: '2.3d', label: 'Promedio', color: 'text-gray-700' },
            ].map((s) => (
              <div key={s.label}>
                <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent reports */}
      <div className="px-4 mt-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-900 text-sm">Mis reportes recientes</p>
          <Link href="/mis-reportes" className="text-xs text-civix-600 font-medium">Ver todos →</Link>
        </div>
        <div className="space-y-2">
          {mockRecentReports.map((r) => (
            <Link key={r.id} href={`/mis-reportes/${r.id}`}>
              <Card className={cn('overflow-hidden card-lift', r.hasUpdate && 'border-civix-200')}>
                {r.hasUpdate && <div className="accent-bar" />}
                <div className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <r.categoryIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{r.category}</span>
                      {r.hasUpdate && <span className="w-1.5 h-1.5 bg-civix-500 rounded-full animate-pulse-soft" />}
                    </div>
                    <Badge variant={STATUS_VARIANT[r.status]} className="mb-2">
                      {STATUS_CITIZEN_LABELS[r.status]}
                    </Badge>
                    {/* Real-time operator tracking */}
                    {r.status === 'en_proceso' && r.operator && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-4 h-4 bg-civix-100 rounded-full flex items-center justify-center">
                          <User className="w-2.5 h-2.5 text-civix-600" />
                        </div>
                        <p className="text-xs text-civix-700 font-medium truncate">{r.operator}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{r.folio} · {formatRelativeTime(r.created_at)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
