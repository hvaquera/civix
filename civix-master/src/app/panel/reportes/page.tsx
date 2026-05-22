'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  UserPlus,
  CheckCircle,
  XCircle,
  Layers,
  Download,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

// Mock data — includes reabierto entries so all dashboard cards show results
const mockReports = [
  { id: '1', folio: 'CIV-2024-00456', category: 'Baches', colonia: 'Centro', address: 'Av. Constitución 500', status: 'nuevo', internalStatus: 'sin_asignar', area: null, assignee: null, slaStatus: 'expired', priority: 'alta', created_at: '2024-01-15T08:00:00Z' },
  { id: '2', folio: 'CIV-2024-00455', category: 'Alumbrado', colonia: 'Centro', address: 'Calle Morelos 123', status: 'en_proceso', internalStatus: 'asignado', area: 'Servicios Públicos', assignee: 'Juan Pérez', slaStatus: 'warning', priority: 'media', created_at: '2024-01-15T10:00:00Z' },
  { id: '3', folio: 'CIV-2024-00454', category: 'Basura', colonia: 'Obispado', address: 'Av. Venustiano Carranza 800', status: 'en_proceso', internalStatus: 'en_campo', area: 'Limpia', assignee: 'María García', slaStatus: 'ok', priority: 'media', created_at: '2024-01-15T09:00:00Z' },
  { id: '4', folio: 'CIV-2024-00453', category: 'Agua', colonia: 'Mitras Centro', address: 'Calle Platón 456', status: 'recibido', internalStatus: 'nuevo', area: null, assignee: null, slaStatus: 'ok', priority: 'baja', created_at: '2024-01-15T11:00:00Z' },
  { id: '5', folio: 'CIV-2024-00452', category: 'Parques', colonia: 'Del Valle', address: 'Parque Hundido', status: 'en_proceso', internalStatus: 'programado', area: 'Parques', assignee: 'Carlos López', slaStatus: 'warning', priority: 'media', created_at: '2024-01-15T07:00:00Z' },
  { id: '6', folio: 'CIV-2024-00451', category: 'Baches', colonia: 'Centro', address: 'Calle Zaragoza 789', status: 'resuelto', internalStatus: 'resuelto', area: 'Servicios Públicos', assignee: 'Juan Pérez', slaStatus: 'ok', priority: 'alta', created_at: '2024-01-14T14:00:00Z' },
  { id: '7', folio: 'CIV-2024-00450', category: 'Alumbrado', colonia: 'Cumbres', address: 'Av. Lincoln 1200', status: 'no_procede', internalStatus: 'no_procede', area: 'Servicios Públicos', assignee: 'Ana Martínez', slaStatus: 'ok', priority: 'baja', created_at: '2024-01-14T10:00:00Z' },
  { id: '8', folio: 'CIV-2024-00449', category: 'Drenaje', colonia: 'Centro', address: 'Calle Hidalgo 234', status: 'en_proceso', internalStatus: 'esperando_material', area: 'Agua y Drenaje', assignee: 'Roberto Sánchez', slaStatus: 'expired', priority: 'alta', created_at: '2024-01-13T16:00:00Z' },
  { id: '9', folio: 'CIV-2024-00448', category: 'Baches', colonia: 'Cumbres', address: 'Av. Lincoln 900', status: 'recibido', internalStatus: 'sin_asignar', area: null, assignee: null, slaStatus: 'warning', priority: 'alta', created_at: '2024-01-13T12:00:00Z' },
  { id: '10', folio: 'CIV-2024-00447', category: 'Alumbrado', colonia: 'Del Valle', address: 'Calle Río Amazonas 345', status: 'revision_solicitada', internalStatus: 'reabierto', area: 'Servicios Públicos', assignee: 'Juan Pérez', slaStatus: 'expired', priority: 'media', created_at: '2024-01-12T09:00:00Z' },
  { id: '11', folio: 'CIV-2024-00446', category: 'Basura', colonia: 'Mitras Centro', address: 'Calle Platón 200', status: 'revision_solicitada', internalStatus: 'reabierto', area: 'Limpia', assignee: 'María García', slaStatus: 'warning', priority: 'media', created_at: '2024-01-12T14:00:00Z' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'sin_asignar', label: 'Sin asignar' },
  { value: 'asignado', label: 'Asignado' },
  { value: 'en_campo', label: 'En campo' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'no_procede', label: 'No procede' },
  { value: 'reabierto', label: 'Reabierto' },
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'baches', label: 'Baches' },
  { value: 'alumbrado', label: 'Alumbrado' },
  { value: 'basura', label: 'Basura' },
  { value: 'agua', label: 'Agua' },
  { value: 'drenaje', label: 'Drenaje' },
  { value: 'parques', label: 'Parques' },
]

const AREA_OPTIONS = [
  { value: 'all', label: 'Todas las áreas' },
  { value: 'servicios', label: 'Servicios Públicos' },
  { value: 'limpia', label: 'Limpia' },
  { value: 'agua', label: 'Agua y Drenaje' },
  { value: 'parques', label: 'Parques' },
]

const SLA_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'ok', label: 'En tiempo' },
  { value: 'warning', label: 'Por vencer' },
  { value: 'expired', label: 'Vencido' },
]

const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-700',
  sin_asignar: 'bg-orange-100 text-orange-700',
  asignado: 'bg-purple-100 text-purple-700',
  programado: 'bg-indigo-100 text-indigo-700',
  en_campo: 'bg-cyan-100 text-cyan-700',
  esperando_material: 'bg-yellow-100 text-yellow-700',
  en_revision: 'bg-pink-100 text-pink-700',
  resuelto: 'bg-green-100 text-green-700',
  no_procede: 'bg-gray-100 text-gray-700',
  reabierto: 'bg-red-100 text-red-700',
}

const SLA_COLORS: Record<string, string> = {
  ok: 'text-green-600',
  warning: 'text-yellow-600',
  expired: 'text-red-600',
}

const PRIORITY_COLORS: Record<string, string> = {
  alta: 'bg-red-500',
  media: 'bg-yellow-500',
  baja: 'bg-gray-400',
}

// ─── Dashboard → Reportes filter mapping ───────────────────────
// Dashboard cards pass ?filter=unassigned|expiring|expired|reopened
// We translate those to actual status/sla filter values
const DASHBOARD_FILTER_MAP: Record<string, { status?: string; sla?: string }> = {
  unassigned: { status: 'sin_asignar' },
  expiring:   { sla: 'warning' },
  expired:    { sla: 'expired' },
  reopened:   { status: 'reabierto' },
}

function ReportesContent() {
  const searchParams = useSearchParams()
  const dashboardFilter = searchParams.get('filter') || ''

  // Resolve dashboard shortcut → real filter values
  const mapped = DASHBOARD_FILTER_MAP[dashboardFilter]
  const initStatus = mapped?.status || 'all'
  const initSla    = mapped?.sla    || 'all'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [slaFilter, setSlaFilter] = useState(initSla)
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const toggleSelectAll = () => {
    if (selectedReports.length === mockReports.length) {
      setSelectedReports([])
    } else {
      setSelectedReports(mockReports.map(r => r.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const filteredReports = mockReports.filter(report => {
    if (search && !report.folio.toLowerCase().includes(search.toLowerCase()) && 
        !report.address.toLowerCase().includes(search.toLowerCase()) &&
        !report.colonia.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (statusFilter !== 'all' && report.internalStatus !== statusFilter) return false
    if (categoryFilter !== 'all' && report.category.toLowerCase() !== categoryFilter) return false
    if (slaFilter !== 'all' && report.slaStatus !== slaFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">{filteredReports.length} reportes encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por folio, dirección o colonia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-civix-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-civix-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-civix-500"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-civix-500"
            >
              {SLA_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Más filtros
            </Button>
          </div>
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {AREA_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colonia</label>
              <input type="text" placeholder="Filtrar por colonia" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
        )}
      </Card>

      {/* Bulk actions */}
      {selectedReports.length > 0 && (
        <Card className="p-3 bg-civix-50 border-civix-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-civix-700">
              {selectedReports.length} reportes seleccionados
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-1" />
                Asignar
              </Button>
              <Button variant="outline" size="sm">
                <Layers className="w-4 h-4 mr-1" />
                Agrupar
              </Button>
              <Button variant="outline" size="sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Resolver
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Reports table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedReports.length === mockReports.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Folio</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Categoría</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">Ubicación</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Área / Responsable</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">SLA</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">Creado</th>
                <th className="text-right py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => toggleSelect(report.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', PRIORITY_COLORS[report.priority])} title={`Prioridad ${report.priority}`} />
                      <Link href={`/panel/reportes/${report.id}`} className="font-mono text-civix-600 hover:underline">
                        {report.folio}
                      </Link>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{report.category}</td>
                  <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                    <div className="max-w-xs truncate">{report.address}</div>
                    <div className="text-xs text-gray-400">{report.colonia}</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={STATUS_COLORS[report.internalStatus]}>
                      {report.internalStatus.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    {report.area ? (
                      <div>
                        <div className="text-gray-900">{report.area}</div>
                        <div className="text-xs text-gray-400">{report.assignee || 'Sin asignar'}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('font-medium', SLA_COLORS[report.slaStatus])}>
                      {report.slaStatus === 'ok' && '✓ En tiempo'}
                      {report.slaStatus === 'warning' && '⚠ Por vencer'}
                      {report.slaStatus === 'expired' && '✕ Vencido'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">
                    {formatRelativeTime(report.created_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/panel/reportes/${report.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando 1-{filteredReports.length} de {filteredReports.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 bg-civix-50 text-civix-700 rounded text-sm font-medium">1</span>
            <Button variant="outline" size="sm" disabled>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Wrap in Suspense because useSearchParams requires it in Next.js 14
export default function ReportesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Cargando reportes...</div>}>
      <ReportesContent />
    </Suspense>
  )
}
