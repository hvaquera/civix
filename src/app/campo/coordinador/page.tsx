'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, Target, Calendar, TrendingUp, MapPin, Download, 
  ChevronLeft, AlertTriangle, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const IssueMap = dynamic(() => import('@/components/panel/IssueMap'), {
  ssr: false,
  loading: () => <div className="w-full bg-gray-50 rounded-lg flex items-center justify-center" style={{ minHeight: 350 }}><p className="text-gray-400">Cargando mapa...</p></div>,
})

const mockKPIs = {
  totalRegistros: 342, registrosHoy: 18, brigadistasActivos: 5, metaPct: 68,
}

const mockBrigadistas = [
  { id: '1', name: 'Roberto Sánchez', role: 'Manzanero', today: 7, total: 87, lastCheckin: '10:30 AM', active: true },
  { id: '2', name: 'Ana Gómez', role: 'Manzanero', today: 5, total: 65, lastCheckin: '9:45 AM', active: true },
  { id: '3', name: 'Pedro Ruiz', role: 'Manzanero', today: 4, total: 52, lastCheckin: '11:00 AM', active: true },
  { id: '4', name: 'Sofía Garza', role: 'Manzanero', today: 2, total: 41, lastCheckin: '10:00 AM', active: true },
  { id: '5', name: 'Carlos Pérez', role: 'Manzanero', today: 0, total: 38, lastCheckin: 'Ayer', active: false },
  { id: '6', name: 'María Torres', role: 'Manzanero', today: 0, total: 30, lastCheckin: 'Hace 3 días', active: false },
]

const mockPeticiones = [
  { category: 'Infraestructura', count: 98, pct: 29 },
  { category: 'Seguridad', count: 76, pct: 22 },
  { category: 'Agua', count: 54, pct: 16 },
  { category: 'Servicios públicos', count: 48, pct: 14 },
  { category: 'Empleo', count: 38, pct: 11 },
  { category: 'Otros', count: 28, pct: 8 },
]

const mockMapMarkers = [
  { id: '1', label: 'Registro — Av. Simón Bolívar 320', lat: 25.6930, lng: -100.3350 },
  { id: '2', label: 'Registro — Calle Río Mississippi 150', lat: 25.6945, lng: -100.3370 },
  { id: '3', label: 'Registro — Av. Chapultepec 800', lat: 25.6920, lng: -100.3325 },
  { id: '4', label: 'Registro — Calle Platón 456', lat: 25.6910, lng: -100.3340 },
  { id: '5', label: 'Registro — Av. Simón Bolívar 500', lat: 25.6950, lng: -100.3360 },
  { id: '6', label: 'Registro — Río Amazonas 200', lat: 25.6935, lng: -100.3380 },
]

const COLORS = ['bg-orange-500', 'bg-red-500', 'bg-blue-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-gray-500']

export default function CampoCoordinadorPage() {
  const [tab, setTab] = useState<'mapa' | 'brigadistas' | 'peticiones'>('mapa')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/campo/home" className="p-1 text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Panel de Coordinador</h1>
              <p className="text-xs text-gray-500">Laura Hernández • Jefe de Colonia • Mitras Centro</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => toast.success('Exportando CSV...')}>
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total registros', value: mockKPIs.totalRegistros, icon: Target, color: 'text-civix-600' },
            { label: 'Registros hoy', value: mockKPIs.registrosHoy, icon: TrendingUp, color: 'text-green-600' },
            { label: 'Brigadistas activos', value: mockKPIs.brigadistasActivos, icon: Users, color: 'text-purple-600' },
            { label: 'Meta cumplida', value: `${mockKPIs.metaPct}%`, icon: BarChart3, color: 'text-orange-600' },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-3">
                <kpi.icon className={cn('w-5 h-5 mb-1', kpi.color)} />
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alert: inactive brigadistas */}
        {mockBrigadistas.filter(b => !b.active).length > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-800">
                <strong>{mockBrigadistas.filter(b => !b.active).length} brigadistas</strong> sin actividad hoy
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'mapa' as const, label: 'Mapa' },
            { id: 'brigadistas' as const, label: 'Brigadistas' },
            { id: 'peticiones' as const, label: 'Peticiones' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === t.id ? 'bg-civix-500 text-white' : 'bg-white text-gray-600 border'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'mapa' && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Registros capturados</CardTitle></CardHeader>
            <CardContent>
              <div style={{ height: 400 }} className="rounded-lg overflow-hidden">
                <IssueMap markers={mockMapMarkers} />
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'brigadistas' && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Nombre</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Hoy</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Último check-in</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockBrigadistas.map((b) => (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{b.name}</p>
                          <p className="text-xs text-gray-400">{b.role}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold">{b.today}</td>
                        <td className="py-3 px-4 text-center">{b.total}</td>
                        <td className="py-3 px-4 text-gray-500">{b.lastCheckin}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                            {b.active ? 'Activo' : 'Sin actividad'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'peticiones' && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Top peticiones por categoría</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPeticiones.map((p, i) => (
                  <div key={p.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{p.category}</span>
                      <span className="text-sm text-gray-500">{p.count} ({p.pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', COLORS[i])} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
