'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Layers, 
  MapPin, 
  ChevronRight,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

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

const mockSuggestions = [
  {
    id: 's1',
    category: 'Baches',
    colonia: 'Mitras Centro',
    reportsCount: 3,
    radius: 150,
    reportIds: ['101', '102', '103'],
  },
  {
    id: 's2',
    category: 'Alumbrado',
    colonia: 'Del Valle',
    reportsCount: 2,
    radius: 80,
    reportIds: ['104', '105'],
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues agrupados</h1>
          <p className="text-gray-500">Reportes similares agrupados por zona y categoría</p>
        </div>
        <Button>
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
                    <Button size="sm" variant="outline" className="flex-1">
                      Ver en mapa
                    </Button>
                    <Button size="sm" className="flex-1">
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
                    ? 'bg-civix-500 text-white' 
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
        {mockIssues.map((issue) => (
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
    </div>
  )
}
