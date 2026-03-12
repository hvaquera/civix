'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  Clock, 
  XCircle, 
  RotateCcw,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Layers,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

// Mock data
const alertCards = [
  { id: 'unassigned', label: 'Sin asignar', value: 12, description: 'Reportes esperando responsable', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'expiring', label: 'Por vencer SLA', value: 8, description: 'Necesitan atención hoy', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'expired', label: 'SLA vencido', value: 3, description: 'Ya están fuera de tiempo', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'reopened', label: 'Revisión solicitada', value: 2, description: 'Ciudadanos pidieron revisar', icon: RotateCcw, color: 'text-purple-600', bg: 'bg-purple-50' },
]

const kpis = [
  { label: 'Resueltos hoy', value: '24', trend: '+12%', positive: true },
  { label: 'Promedio 1a respuesta', value: '2.3 h', trend: '-15%', positive: true },
  { label: 'Promedio resolución', value: '18 h', trend: '+5%', positive: false },
  { label: '% dentro de SLA', value: '87%', trend: '+3%', positive: true },
]

const priorityQueue = [
  { id: '1', folio: 'CIV-2024-00456', status: 'SLA vencido', category: 'Baches', area: 'Servicios Públicos', assignee: 'Sin asignar', sla: 'Venció hace 6h', created: '2024-01-15T08:00:00Z' },
  { id: '2', folio: 'CIV-2024-00455', status: 'Por vencer', category: 'Alumbrado', area: 'Servicios Públicos', assignee: 'Juan Pérez', sla: 'Faltan 2h', created: '2024-01-15T10:00:00Z' },
  { id: '3', folio: 'CIV-2024-00454', status: 'Reabierto', category: 'Basura', area: 'Limpia', assignee: 'María García', sla: 'En tiempo', created: '2024-01-15T09:00:00Z' },
  { id: '4', folio: 'CIV-2024-00453', status: 'Sin asignar', category: 'Agua', area: 'Agua y Drenaje', assignee: null, sla: 'Faltan 8h', created: '2024-01-15T11:00:00Z' },
  { id: '5', folio: 'CIV-2024-00452', status: 'Por vencer', category: 'Parques', area: 'Parques', assignee: 'Carlos López', sla: 'Faltan 4h', created: '2024-01-15T07:00:00Z' },
]

const groupingSuggestions = [
  { id: '1', colonia: 'Centro', category: 'Baches', count: 5, radius: 85 },
  { id: '2', colonia: 'Obispado', category: 'Alumbrado', count: 3, radius: 120 },
]

const recentActivity = [
  { id: '1', text: 'Folio CIV-10234 asignado a Juan Pérez', time: '5 min' },
  { id: '2', text: 'Folio CIV-10210 marcado como Resuelto', time: '12 min' },
  { id: '3', text: 'Folio CIV-10188 reabierto por revisión', time: '25 min' },
  { id: '4', text: 'Nuevo reporte CIV-10245 recibido', time: '30 min' },
]

const STATUS_COLORS: Record<string, string> = {
  'SLA vencido': 'bg-red-100 text-red-700',
  'Por vencer': 'bg-yellow-100 text-yellow-700',
  'Reabierto': 'bg-purple-100 text-purple-700',
  'Sin asignar': 'bg-orange-100 text-orange-700',
  'En tiempo': 'bg-green-100 text-green-700',
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState('7d')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Resumen operativo de Monterrey</p>
        </div>
        <div className="flex items-center gap-2">
          {['Hoy', '7 días', '30 días'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                dateRange === range
                  ? 'bg-civix-500 text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {alertCards.map((card) => (
          <Link key={card.id} href={`/panel/reportes?filter=${card.id}`}>
            <Card className={cn('hover:shadow-md transition-shadow cursor-pointer', card.bg)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.label}</p>
                    <p className={cn('text-3xl font-bold', card.color)}>{card.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                  </div>
                  <card.icon className={cn('w-8 h-8', card.color)} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
                <span className={cn(
                  'text-xs font-medium flex items-center gap-0.5',
                  kpi.positive ? 'text-green-600' : 'text-red-600'
                )}>
                  {kpi.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority queue - takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Cola prioritaria</CardTitle>
            <Link href="/panel/reportes" className="text-sm text-civix-600 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Folio</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Estado</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 hidden sm:table-cell">Categoría</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 hidden md:table-cell">Área</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">SLA</th>
                    <th className="text-right py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {priorityQueue.map((report) => (
                    <tr key={report.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <span className="font-mono text-gray-900">{report.folio}</span>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={STATUS_COLORS[report.status]}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-600 hidden sm:table-cell">{report.category}</td>
                      <td className="py-3 px-2 text-gray-600 hidden md:table-cell">{report.area}</td>
                      <td className="py-3 px-2">
                        <span className={cn(
                          'text-sm',
                          report.sla.includes('Venció') ? 'text-red-600' : 
                          report.sla.includes('Faltan 2h') || report.sla.includes('Faltan 4h') ? 'text-yellow-600' : 
                          'text-green-600'
                        )}>
                          {report.sla}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link href={`/panel/reportes/${report.id}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Grouping suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-civix-500" />
                Sugerencias de agrupación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groupingSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {groupingSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900">
                        Posible issue en {suggestion.colonia}
                      </p>
                      <p className="text-sm text-blue-700">
                        {suggestion.count} reportes similares • {suggestion.category}
                      </p>
                      <p className="text-xs text-blue-600">
                        Radio estimado: {suggestion.radius}m
                      </p>
                      <Button variant="outline" size="sm" className="mt-2 w-full">
                        Revisar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay sugerencias nuevas de agrupación.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-civix-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{activity.text}</p>
                      <p className="text-xs text-gray-400">Hace {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/panel/reportes" className="block mt-4 text-sm text-civix-600 hover:underline text-center">
                Ver historial completo
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
