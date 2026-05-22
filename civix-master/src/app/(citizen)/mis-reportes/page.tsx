'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronRight, 
  Construction, 
  Lightbulb, 
  Trash2, 
  Search,
  Plus,
  CloudOff,
  Droplets,
  TreePine,
  AlertTriangle,
  ShieldAlert,
  PawPrint,
  HelpCircle,
  Signpost
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_CITIZEN_LABELS, formatRelativeTime } from '@/lib/utils'

// Mock data
const mockReports = [
  {
    id: '1',
    folio: 'CIV-2024-00123',
    category: 'Baches',
    categoryCode: 'baches',
    status: 'en_proceso',
    colonia: 'Centro',
    address: 'Av. Constitución 500',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    hasUpdate: true,
  },
  {
    id: '2',
    folio: 'CIV-2024-00098',
    category: 'Alumbrado',
    categoryCode: 'alumbrado',
    status: 'resuelto',
    colonia: 'Centro',
    address: 'Calle Morelos 123',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    hasUpdate: false,
  },
  {
    id: '3',
    folio: 'CIV-2024-00085',
    category: 'Basura',
    categoryCode: 'basura',
    status: 'recibido',
    colonia: 'Obispado',
    address: 'Av. Venustiano Carranza 800',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    hasUpdate: false,
  },
  {
    id: '4',
    folio: 'CIV-2024-00070',
    category: 'Baches',
    categoryCode: 'baches',
    status: 'no_procede',
    colonia: 'Centro',
    address: 'Calle Zaragoza 456',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    hasUpdate: false,
  },
]

const CATEGORY_ICONS: Record<string, any> = {
  baches: Construction,
  alumbrado: Lightbulb,
  basura: Trash2,
  agua: Droplets,
  parques: TreePine,
  drenaje: AlertTriangle,
  seguridad: ShieldAlert,
  animales: PawPrint,
  senalizacion: Signpost,
  otro: HelpCircle,
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'resolved', label: 'Resueltos' },
  { value: 'drafts', label: 'Sin enviar' },
  { value: 'rejected', label: 'No procede' },
]

const STATUS_VARIANTS: Record<string, 'info' | 'purple' | 'success' | 'danger' | 'warning' | 'gray' | 'orange'> = {
  borrador: 'gray',
  pendiente_envio: 'warning',
  recibido: 'info',
  en_proceso: 'purple',
  resuelto: 'success',
  no_procede: 'danger',
  revision_solicitada: 'orange',
}

interface LocalReport {
  id: string
  folio: string
  categoria: string
  description: string
  photos: string[]
  hasAudio: boolean
  location: { lat: number; lng: number } | null
  address: string
  reference: string
  status: string
  created_at: string
}

export default function MisReportesPage() {
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [localReports, setLocalReports] = useState<LocalReport[]>([])
  const [hasDraft, setHasDraft] = useState(false)

  // Load reports from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('civix_my_reports')
    if (saved) {
      try {
        setLocalReports(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading reports:', e)
      }
    }
    
    // Check for draft
    const draft = localStorage.getItem('civix_report_draft')
    setHasDraft(!!draft)
  }, [])

  // Combine mock + local reports
  const allReports = [
    ...localReports.map(r => ({
      id: r.id,
      folio: r.folio,
      category: CATEGORY_LABELS[r.categoria] || r.categoria,
      categoryCode: r.categoria,
      status: r.status,
      colonia: '',
      address: r.address || 'Sin dirección',
      created_at: r.created_at,
      hasUpdate: false,
    })),
    ...mockReports,
  ]

  const filteredReports = allReports.filter((report) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!report.folio.toLowerCase().includes(q) && 
          !report.address.toLowerCase().includes(q)) {
        return false
      }
    }
    
    if (filter === 'pending') return ['recibido', 'en_proceso'].includes(report.status)
    if (filter === 'resolved') return report.status === 'resuelto'
    if (filter === 'rejected') return report.status === 'no_procede'
    if (filter === 'drafts') return false
    return true
  })

  const showDrafts = filter === 'all' || filter === 'drafts'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900">Mis reportes</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por folio o dirección"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-civix-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                filter === option.value
                  ? 'bg-civix-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Draft banner */}
        {showDrafts && hasDraft && (
          <div className="mb-5">
            <Link href="/reportar">
              <Card className="p-4 border-dashed border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-200 rounded-lg">
                    <CloudOff className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">Reporte sin terminar</p>
                    <p className="text-sm text-amber-700">Toca para continuar</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-400" />
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Reports list */}
        {filteredReports.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredReports.map((report) => {
              const Icon = CATEGORY_ICONS[report.categoryCode] || Construction
              const iconBg =
                report.status === 'resuelto' ? 'bg-green-100' :
                report.status === 'no_procede' ? 'bg-red-100' :
                report.status === 'en_proceso' ? 'bg-purple-100' :
                'bg-gray-100'
              const iconColor =
                report.status === 'resuelto' ? 'text-green-600' :
                report.status === 'no_procede' ? 'text-red-600' :
                report.status === 'en_proceso' ? 'text-purple-600' :
                'text-gray-500'

              return (
                <Link key={report.id} href={`/mis-reportes/${report.id}`}className="block">
                  <div className={cn(
                    'bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99] overflow-hidden',
                    report.hasUpdate && 'border-civix-200 shadow-civix-100'
                  )}>
                    {/* Update indicator bar */}
                    {report.hasUpdate && (
                      <div className="h-0.5 bg-gradient-to-r from-civix-400 to-civix-600" />
                    )}

                    <div className="p-4 flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn('p-3 rounded-xl flex-shrink-0 mt-0.5', iconBg)}>
                        <Icon className={cn('w-5 h-5', iconColor)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Top row: category + badge */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-semibold text-gray-900 text-base leading-tight">
                            {report.category}
                          </span>
                          {report.hasUpdate && (
                            <span className="w-2 h-2 bg-civix-500 rounded-full animate-pulse flex-shrink-0" />
                          )}
                        </div>

                        {/* Badge */}
                        <div className="mb-2">
                          <Badge variant={STATUS_VARIANTS[report.status]}>
                            {STATUS_CITIZEN_LABELS[report.status]}
                          </Badge>
                        </div>

                        {/* Address */}
                        <p className="text-sm text-gray-500 truncate mb-2">
                          {report.address}
                        </p>

                        {/* Footer: folio + time */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="font-mono tracking-tight">{report.folio}</span>
                          <span>·</span>
                          <span>{formatRelativeTime(report.created_at)}</span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Construction className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">
              {filter === 'all' 
                ? 'Todavía no tienes reportes.' 
                : 'No hay reportes con este filtro.'}
            </p>
            {filter === 'all' && (
              <Link href="/reportar">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear reporte
                </Button>
              </Link>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  baches: 'Baches',
  alumbrado: 'Alumbrado público',
  basura: 'Basura',
  parques: 'Parques y jardines',
  agua: 'Agua potable',
  drenaje: 'Drenaje',
  senalizacion: 'Señalización',
  seguridad: 'Seguridad',
  animales: 'Animales',
  otro: 'Otro',
}