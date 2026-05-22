'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle, Clock, XCircle, RotateCcw, ChevronRight,
  TrendingUp, TrendingDown, Users, Layers, ArrowUpRight,
  Bell, X, Check, Info, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Date-range aware KPIs
const KPI_DATA: Record<string, typeof kpis1d> = {
  '1d': [
    { label: 'Resueltos hoy',         value: '6',    trend: '+2%',  positive: true  },
    { label: 'Promedio 1a respuesta', value: '1.8 h', trend: '-8%',  positive: true  },
    { label: 'Promedio resolución',   value: '14 h',  trend: '-5%',  positive: true  },
    { label: '% dentro de SLA',       value: '92%',   trend: '+5%',  positive: true  },
  ],
  '7d': [
    { label: 'Resueltos hoy',         value: '24',   trend: '+12%', positive: true  },
    { label: 'Promedio 1a respuesta', value: '2.3 h', trend: '-15%', positive: true  },
    { label: 'Promedio resolución',   value: '18 h',  trend: '+5%',  positive: false },
    { label: '% dentro de SLA',       value: '87%',   trend: '+3%',  positive: true  },
  ],
  '30d': [
    { label: 'Resueltos hoy',         value: '312',  trend: '+22%', positive: true  },
    { label: 'Promedio 1a respuesta', value: '3.1 h', trend: '+8%',  positive: false },
    { label: 'Promedio resolución',   value: '22 h',  trend: '+11%', positive: false },
    { label: '% dentro de SLA',       value: '81%',   trend: '-6%',  positive: false },
  ],
}
const kpis1d = KPI_DATA['1d']

const alertCards = [
  { id: 'unassigned', label: 'Sin asignar',       value: 12, desc: 'Reportes sin responsable', icon: Users,    color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  { id: 'expiring',   label: 'Por vencer SLA',     value: 8,  desc: 'Requieren atención hoy',  icon: Clock,    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'expired',    label: 'SLA vencido',         value: 3,  desc: 'Fuera de tiempo',         icon: XCircle,  color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  { id: 'reopened',   label: 'Revisión solicitada', value: 2,  desc: 'Ciudadanos solicitaron',  icon: RotateCcw,color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
]

const priorityQueue = [
  { id: '1', folio: 'CIV-00456', status: 'vencido',    category: 'Baches',    area: 'Servicios Públicos', assignee: null,           sla: 'Venció hace 6h' },
  { id: '2', folio: 'CIV-00455', status: 'por_vencer', category: 'Alumbrado', area: 'Servicios Públicos', assignee: 'Juan Pérez',   sla: 'Faltan 2h' },
  { id: '3', folio: 'CIV-00454', status: 'reabierto',  category: 'Basura',    area: 'Limpia',             assignee: 'María García', sla: 'En tiempo' },
  { id: '4', folio: 'CIV-00453', status: 'sin_asignar',category: 'Agua',      area: 'Agua y Drenaje',     assignee: null,           sla: 'Faltan 8h' },
  { id: '5', folio: 'CIV-00452', status: 'por_vencer', category: 'Parques',   area: 'Parques',            assignee: 'Carlos López', sla: 'Faltan 4h' },
]

const STATUS_CFG: Record<string, { label: string; variant: any }> = {
  vencido:     { label: 'SLA vencido', variant: 'danger' },
  por_vencer:  { label: 'Por vencer',  variant: 'warning' },
  reabierto:   { label: 'Reabierto',   variant: 'purple' },
  sin_asignar: { label: 'Sin asignar', variant: 'orange' },
}

const recentActivity = [
  { id: '1', text: 'CIV-10234 asignado a Juan Pérez',  time: '5 min' },
  { id: '2', text: 'CIV-10210 marcado como Resuelto',  time: '12 min' },
  { id: '3', text: 'CIV-10188 reabierto por revisión', time: '25 min' },
  { id: '4', text: 'Nuevo reporte CIV-10245 recibido', time: '30 min' },
]

const groupingSuggestions = [
  { id: 's1', colonia: 'Centro',   category: 'Baches',    count: 5, radius: 85 },
  { id: 's2', colonia: 'Obispado', category: 'Alumbrado', count: 3, radius: 120 },
]

// Notifications — hardcoded but realistic
const NOTIFICATIONS = [
  { id: '1', type: 'urgent',  icon: AlertCircle, title: 'SLA vencido — CIV-00449',         body: 'Drenaje en Calle Hidalgo lleva 8h sin asignar.',        time: 'Hace 5 min',  read: false },
  { id: '2', type: 'info',    icon: Info,        title: 'Nuevo reporte — CIV-00450',        body: 'Bache reportado en Av. Lincoln 900, Cumbres.',           time: 'Hace 12 min', read: false },
  { id: '3', type: 'success', icon: Check,       title: 'Reporte resuelto — CIV-00447',     body: 'Alumbrado en Del Valle marcado como resuelto.',          time: 'Hace 30 min', read: false },
  { id: '4', type: 'info',    icon: Info,        title: 'Revisión solicitada — CIV-00446',  body: 'Ciudadano rechazó resolución. Requiere seguimiento.',    time: 'Hace 1h',     read: true  },
  { id: '5', type: 'urgent',  icon: AlertCircle, title: '8 reportes por vencer hoy',        body: 'Tienen menos de 3h para cumplir SLA. Revisa la cola.',  time: 'Hace 2h',     read: true  },
]

const NOTIF_COLORS: Record<string, string> = {
  urgent:  'text-red-500 bg-red-50',
  info:    'text-blue-500 bg-blue-50',
  success: 'text-emerald-500 bg-emerald-50',
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState('7d')
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState(NOTIFICATIONS)

  const kpis = KPI_DATA[dateRange]
  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  return (
    <div className="space-y-5 max-w-7xl relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm">Resumen operativo · Monterrey</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range */}
          {['1d', '7d', '30d'].map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className={cn('px-3 py-1.5 rounded-xl text-sm font-medium transition-colors',
                dateRange === r ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              {r}
            </button>
          ))}
          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <Bell className="w-4 h-4 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifs && (
              <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <p className="font-semibold text-gray-900 text-sm">Notificaciones</p>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-civix-600 hover:underline">Marcar todas leídas</button>
                    )}
                    <button onClick={() => setShowNotifs(false)} className="p-1 text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                  {notifications.map((n) => {
                    const Icon = n.icon
                    const colorCls = NOTIF_COLORS[n.type]
                    return (
                      <div key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn('flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors', !n.read && 'bg-civix-50/30')}>
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', colorCls)}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-semibold text-gray-900 leading-snug">{n.title}</p>
                            {!n.read && <span className="w-1.5 h-1.5 bg-civix-500 rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                          <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-50 text-center">
                  <p className="text-xs text-gray-400">Las reglas de notificaciones se configuran en Configuración →</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {alertCards.map((card) => (
          <Link key={card.id} href={`/panel/reportes?filter=${card.id}`}>
            <Card className={cn('card-lift border', card.border)}>
              <CardContent className="p-4">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', card.bg)}>
                  <card.icon className={cn('w-4 h-4', card.color)} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* KPIs — reactive to date range */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <div className={cn('flex items-center gap-1 text-xs font-medium mt-1', kpi.positive ? 'text-emerald-600' : 'text-red-500')}>
                {kpi.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.trend} vs periodo anterior
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Priority queue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Cola de atención prioritaria</CardTitle>
                <Link href="/panel/reportes" className="text-xs text-civix-600 font-medium flex items-center gap-1 hover:underline">
                  Ver todos <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <div className="divide-y divide-gray-50">
              {priorityQueue.map((item) => {
                const cfg = STATUS_CFG[item.status]
                return (
                  <Link key={item.id} href={`/panel/reportes/${item.id}`}>
                    <div className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-400">{item.folio}</span>
                          {cfg && <Badge variant={cfg.variant}>{cfg.label}</Badge>}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{item.category}</p>
                        <p className="text-xs text-gray-400">
                          {item.area} · {item.assignee || <span className="text-amber-600 font-medium">Sin asignar</span>}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0">{item.sla}</p>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* AI grouping suggestions — linked to issues */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-civix-500" />Grupos sugeridos
                </CardTitle>
                <Badge variant="indigo">IA</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupingSuggestions.map((g) => (
                  <div key={g.id} className="p-3 bg-civix-50 border border-civix-100 rounded-xl">
                    <p className="text-sm font-semibold text-gray-900">{g.colonia} — {g.category}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{g.count} reportes en radio {g.radius}m</p>
                    <Link href={`/panel/issues?suggestion=${g.id}`}>
                      <Button size="sm" variant="outline" className="w-full mt-2 h-8 text-xs">
                        Ver agrupación →
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader className="pb-3"><CardTitle>Actividad reciente</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-civix-400 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Hace {a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Click outside to close notifs */}
      {showNotifs && <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />}
    </div>
  )
}
