'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Layers, 
  MapPin, 
  ChevronRight,
  Plus,
  Search,
  Filter,
  X,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

// Dynamic import for Leaflet map (can't SSR)
const IssueMap = dynamic(() => import('@/components/panel/IssueMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center bg-gray-50 rounded-lg" style={{ minHeight: 350 }}>
      <p className="text-gray-400 text-sm">Cargando mapa...</p>
    </div>
  ),
})

// Mock data
const mockIssues = [
  {
    id: '1',
    title: 'Baches múltiples en Centro',
    category: 'Baches',
    colonia: 'Centro',
    reportsCount: 5,
    status: 'en_proceso',
    area: 'Servicios Públicos',
    assignee: 'Juan Pérez',
    created_at: '2024-01-14T10:00:00Z',
    slaStatus: 'warning',
  },
  {
    id: '2',
    title: 'Falla de alumbrado Obispado',
    category: 'Alumbrado',
    colonia: 'Obispado',
    reportsCount: 3,
    status: 'asignado',
    area: 'Servicios Públicos',
    assignee: 'María García',
    created_at: '2024-01-15T08:00:00Z',
    slaStatus: 'ok',
  },
  {
    id: '3',
    title: 'Basura acumulada Cumbres',
    category: 'Basura',
    colonia: 'Cumbres',
    reportsCount: 4,
    status: 'resuelto',
    area: 'Limpia',
    assignee: 'Carlos López',
    created_at: '2024-01-13T14:00:00Z',
    slaStatus: 'ok',
  },
]

// Suggestions with real coordinates for Monterrey colonias
const mockSuggestions = [
  {
    id: 's1',
    category: 'Baches',
    colonia: 'Mitras Centro',
    reportsCount: 3,
    radius: 150,
    reportIds: ['101', '102', '103'],
    markers: [
      { id: '101', label: 'CIV-2024-00460 — Av. Simón Bolívar 320', lat: 25.6930, lng: -100.3350 },
      { id: '102', label: 'CIV-2024-00461 — Calle Río Mississippi 150', lat: 25.6945, lng: -100.3370 },
      { id: '103', label: 'CIV-2024-00462 — Av. Chapultepec 800', lat: 25.6920, lng: -100.3325 },
    ],
  },
  {
    id: 's2',
    category: 'Alumbrado',
    colonia: 'Del Valle',
    reportsCount: 2,
    radius: 80,
    reportIds: ['104', '105'],
    markers: [
      { id: '104', label: 'CIV-2024-00463 — Av. Alfonso Reyes 1500', lat: 25.6550, lng: -100.3380 },
      { id: '105', label: 'CIV-2024-00464 — Calle Río Amazonas 200', lat: 25.6535, lng: -100.3360 },
    ],
  },
]

const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-700',
  asignado: 'bg-purple-100 text-purple-700',
  en_proceso: 'bg-cyan-100 text-cyan-700',
  resuelto: 'bg-green-100 text-green-700',
}

const SLA_COLORS: Record<string, string> = {
  ok: 'text-green-600',
  warning: 'text-yellow-600',
  expired: 'text-red-600',
}

export default function IssuesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMapModal, setShowMapModal] = useState<typeof mockSuggestions[0] | null>(null)
  const [createForm, setCreateForm] = useState({ title: '', category: '', colonia: '' })

  const handleAgrupar = (suggestion: typeof mockSuggestions[0]) => {
    toast.success(`Issue creado: ${suggestion.reportsCount} reportes de ${suggestion.category} en ${suggestion.colonia} agrupados`)
  }

  const handleCreateIssue = () => {
    if (!createForm.title || !createForm.category) return
    toast.success(`Issue "${createForm.title}" creado exitosamente`)
    setShowCreateModal(false)
    setCreateForm({ title: '', category: '', colonia: '' })
  }


 const filteredIssues = mockIssues.filter(issue => {
  const q = search.toLowerCase()
  if (q && !issue.title.toLowerCase().includes(q) && !issue.colonia.toLowerCase().includes(q)) return false
  if (filter === 'activos' && issue.status === 'resuelto') return false
  if (filter === 'resueltos' && issue.status !== 'resuelto') return false
  return true
})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues agrupados</h1>
          <p className="text-gray-500">Reportes similares agrupados por zona y categoría</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Crear issue manual
        </Button>
      </div>

      {/* AI Suggestions */}
      {mockSuggestions.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Layers className="w-5 h-5" />
              Sugerencias de agrupación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-4">
              La IA detectó reportes similares que podrían agruparse:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {suggestion.reportsCount} reportes de {suggestion.category}
                      </p>
                      <p className="text-sm text-gray-500">
                        {suggestion.colonia} • Radio ~{suggestion.radius}m
                      </p>
                    </div>
                    <Badge variant="info">{suggestion.reportsCount} reportes</Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowMapModal(suggestion)}
                    >
                      Ver en mapa
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAgrupar(suggestion)}
                    >
                      Agrupar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, colonia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'resolved'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium',
                  filter === f 
                    ? 'bg-navy-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Resueltos'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Issues list */}
      <div className="space-y-4">
        {filteredIssues.map((issue) => (
          <Link key={issue.id} href={`/panel/issues/${issue.id}`}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-civix-100 rounded-lg">
                  <Layers className="w-6 h-6 text-civix-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                    <Badge className={STATUS_COLORS[issue.status]}>
                      {issue.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{issue.category}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {issue.colonia}
                    </span>
                    <span className="font-medium text-civix-600">
                      {issue.reportsCount} reportes
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gray-500">
                      {issue.area} • {issue.assignee}
                    </span>
                    <span className={cn('font-medium', SLA_COLORS[issue.slaStatus])}>
                      {issue.slaStatus === 'ok' && '✓ En tiempo'}
                      {issue.slaStatus === 'warning' && '⚠ Por vencer'}
                      {issue.slaStatus === 'expired' && '✕ Vencido'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">
                    {formatRelativeTime(issue.created_at)}
                  </p>
                  <ChevronRight className="w-5 h-5 text-gray-300 mt-2 ml-auto" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {mockIssues.length === 0 && (
        <Card className="p-8 text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay issues agrupados.</p>
        </Card>
      )}

      {/* ──── Crear issue manual Modal ──── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <Card className="w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Crear issue manual</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Crea un issue agrupado manualmente para consolidar reportes similares (ej. reporte recibido por teléfono o en persona).
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título del issue</label>
                <input
                  type="text"
                  placeholder="Ej: Baches múltiples en Av. Constitución"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-civix-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-civix-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Baches">Baches</option>
                    <option value="Alumbrado">Alumbrado</option>
                    <option value="Basura">Basura</option>
                    <option value="Agua">Agua</option>
                    <option value="Parques">Parques</option>
                    <option value="Drenaje">Drenaje</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colonia</label>
                  <input
                    type="text"
                    placeholder="Ej: Centro"
                    value={createForm.colonia}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, colonia: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-civix-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setShowCreateModal(false); setCreateForm({ title: '', category: '', colonia: '' }) }}>
                Cancelar
              </Button>
              <Button 
                disabled={!createForm.title || !createForm.category}
                onClick={handleCreateIssue}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Crear issue
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ──── Ver en mapa Modal — Real Leaflet Map ──── */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMapModal(null)}>
          <Card className="w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{showMapModal.reportsCount} reportes de {showMapModal.category}</h3>
                <p className="text-sm text-gray-500">{showMapModal.colonia} • Radio ~{showMapModal.radius}m</p>
              </div>
              <button onClick={() => setShowMapModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div style={{ height: 400 }} className="rounded-lg overflow-hidden border border-gray-200">
              <IssueMap markers={showMapModal.markers} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowMapModal(null)}>Cerrar</Button>
              <Button onClick={() => {
                handleAgrupar(showMapModal)
                setShowMapModal(null)
              }}>
                <Layers className="w-4 h-4 mr-2" />
                Agrupar estos reportes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
