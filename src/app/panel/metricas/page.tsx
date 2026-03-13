'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, TrendingUp, TrendingDown, Download, Calendar,
  FileText, Clock, CheckCircle, Users, MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const TABS = [
  { id: 'summary', label: 'Resumen' },
  { id: 'sla', label: 'SLA' },
  { id: 'comparative', label: 'Comparativos' },
  { id: 'export', label: 'Exportaciones' },
]

const summaryStats = [
  { label: 'Total reportes', value: '1,234', trend: '+12%', positive: true, icon: FileText },
  { label: 'Resueltos', value: '1,089', trend: '+8%', positive: true, icon: CheckCircle },
  { label: 'Tiempo promedio', value: '18.5 h', trend: '-15%', positive: true, icon: Clock },
  { label: 'Ciudadanos activos', value: '3,456', trend: '+23%', positive: true, icon: Users },
]

const categoryStats = [
  { name: 'Baches', count: 345, percentage: 28, color: 'bg-orange-500' },
  { name: 'Alumbrado', count: 287, percentage: 23, color: 'bg-yellow-500' },
  { name: 'Basura', count: 234, percentage: 19, color: 'bg-green-500' },
  { name: 'Agua', count: 178, percentage: 14, color: 'bg-blue-500' },
  { name: 'Parques', count: 112, percentage: 9, color: 'bg-emerald-500' },
  { name: 'Otros', count: 78, percentage: 7, color: 'bg-gray-500' },
]

const areaStats = [
  { name: 'Servicios Públicos', total: 456, resolved: 412, slaOk: 89 },
  { name: 'Limpia', total: 234, resolved: 221, slaOk: 94 },
  { name: 'Agua y Drenaje', total: 178, resolved: 156, slaOk: 87 },
  { name: 'Parques', total: 112, resolved: 98, slaOk: 91 },
]

const coloniaStats = [
  { name: 'Centro', count: 234 },
  { name: 'Obispado', count: 156 },
  { name: 'Cumbres', count: 123 },
  { name: 'Mitras Centro', count: 98 },
  { name: 'Del Valle', count: 87 },
]

// ─── Chart data ──────────────────────────────────────────
const trendData = [
  { day: '1 Ene', reportes: 38, resueltos: 32 },
  { day: '2 Ene', reportes: 42, resueltos: 35 },
  { day: '3 Ene', reportes: 35, resueltos: 33 },
  { day: '4 Ene', reportes: 50, resueltos: 41 },
  { day: '5 Ene', reportes: 47, resueltos: 44 },
  { day: '6 Ene', reportes: 28, resueltos: 30 },
  { day: '7 Ene', reportes: 22, resueltos: 25 },
  { day: '8 Ene', reportes: 44, resueltos: 38 },
  { day: '9 Ene', reportes: 52, resueltos: 42 },
  { day: '10 Ene', reportes: 48, resueltos: 45 },
  { day: '11 Ene', reportes: 55, resueltos: 48 },
  { day: '12 Ene', reportes: 41, resueltos: 40 },
  { day: '13 Ene', reportes: 30, resueltos: 35 },
  { day: '14 Ene', reportes: 25, resueltos: 28 },
  { day: '15 Ene', reportes: 46, resueltos: 42 },
]

const comparativeMonthData = [
  { category: 'Baches', este_mes: 345, mes_anterior: 298 },
  { category: 'Alumbrado', este_mes: 287, mes_anterior: 310 },
  { category: 'Basura', este_mes: 234, mes_anterior: 215 },
  { category: 'Agua', este_mes: 178, mes_anterior: 192 },
  { category: 'Parques', este_mes: 112, mes_anterior: 95 },
]

const comparativeAreaData = [
  { area: 'Serv. Públicos', total: 456, resueltos: 412, pendientes: 44 },
  { area: 'Limpia', total: 234, resueltos: 221, pendientes: 13 },
  { area: 'Agua y Drenaje', total: 178, resueltos: 156, pendientes: 22 },
  { area: 'Parques', total: 112, resueltos: 98, pendientes: 14 },
  { area: 'Seguridad', total: 68, resueltos: 55, pendientes: 13 },
]

export default function MetricasPage() {
  const [activeTab, setActiveTab] = useState('summary')
  const [dateRange, setDateRange] = useState('30d')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Métricas y reportes</h1>
          <p className="text-gray-500">Análisis de desempeño del municipio</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="year">Este año</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-civix-500 text-civix-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-5 h-5 text-gray-400" />
                    <span className={cn(
                      'text-xs font-medium flex items-center gap-0.5',
                      stat.positive ? 'text-green-600' : 'text-red-600'
                    )}>
                      {stat.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By category */}
            <Card>
              <CardHeader>
                <CardTitle>Por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryStats.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{cat.name}</span>
                        <span className="text-sm text-gray-500">{cat.count} ({cat.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn('h-full rounded-full', cat.color)}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By colonia */}
            <Card>
              <CardHeader>
                <CardTitle>Top colonias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coloniaStats.map((col, i) => (
                    <div key={col.name} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-civix-100 text-civix-600 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{col.name}</p>
                      </div>
                      <span className="text-gray-600 font-medium">{col.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend chart — Recharts */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de reportes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="reportes" 
                    name="Nuevos"
                    stroke="#0ea5e9" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resueltos" 
                    name="Resueltos"
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SLA Tab */}
      {activeTab === 'sla' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">87%</p>
                <p className="text-sm text-green-700">Dentro de SLA</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">8%</p>
                <p className="text-sm text-yellow-700">Por vencer</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-600">5%</p>
                <p className="text-sm text-red-700">Vencidos</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>SLA por área</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Área</th>
                      <th className="text-center py-3 px-4 font-medium">Total</th>
                      <th className="text-center py-3 px-4 font-medium">Resueltos</th>
                      <th className="text-center py-3 px-4 font-medium">% en SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areaStats.map((area) => (
                      <tr key={area.name} className="border-b">
                        <td className="py-3 px-4 font-medium">{area.name}</td>
                        <td className="py-3 px-4 text-center">{area.total}</td>
                        <td className="py-3 px-4 text-center">{area.resolved}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={area.slaOk >= 90 ? 'success' : area.slaOk >= 80 ? 'warning' : 'danger'}>
                            {area.slaOk}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparative Tab — Recharts */}
      {activeTab === 'comparative' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo por período</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparativeMonthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  />
                  <Legend />
                  <Bar dataKey="este_mes" name="Este mes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mes_anterior" name="Mes anterior" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparativo por área</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparativeAreaData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis dataKey="area" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={110} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  />
                  <Legend />
                  <Bar dataKey="resueltos" name="Resueltos" fill="#22c55e" radius={[0, 4, 4, 0]} stackId="a" />
                  <Bar dataKey="pendientes" name="Pendientes" fill="#f59e0b" radius={[0, 4, 4, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exportar datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha inicio</label>
                  <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha fin</label>
                  <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de reporte</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option>Todos los reportes</option>
                  <option>Solo resueltos</option>
                  <option>Solo pendientes</option>
                  <option>Vencidos de SLA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Formato</label>
                <div className="flex gap-2">
                  <Button variant="outline">Excel (.xlsx)</Button>
                  <Button variant="outline">CSV</Button>
                  <Button variant="outline">PDF</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reportes programados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Configura reportes automáticos que se envían por correo.
              </p>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">Resumen semanal</p>
                    <p className="text-sm text-gray-500">Lunes 8:00 AM → admin@municipio.gob.mx</p>
                  </div>
                  <Badge variant="success">Activo</Badge>
                </div>
                <div className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">SLA vencidos diario</p>
                    <p className="text-sm text-gray-500">Diario 7:00 AM → coordinadores</p>
                  </div>
                  <Badge variant="success">Activo</Badge>
                </div>
              </div>
              <Button variant="outline" className="mt-4">
                <Calendar className="w-4 h-4 mr-2" />
                Nuevo reporte programado
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
