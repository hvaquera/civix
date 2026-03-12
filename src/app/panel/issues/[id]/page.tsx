'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Layers, 
  MapPin,
  CheckCircle,
  UserPlus,
  StickyNote,
  ExternalLink,
  Clock,
  FileText,
  Plus,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'

// Mock data
const mockIssue = {
  id: '1',
  title: 'Baches múltiples en Centro',
  category: 'Baches',
  colonia: 'Centro',
  status: 'en_proceso',
  area: { id: '1', name: 'Servicios Públicos' },
  assignee: { id: '1', name: 'Juan Pérez' },
  created_at: '2024-01-14T10:00:00Z',
  sla: {
    resolution: { deadline: '2024-01-17T10:00:00Z', status: 'warning', remaining: '12h' },
  },
}

const mockChildReports = [
  { id: '1', folio: 'CIV-2024-00456', address: 'Av. Constitución 500', status: 'asignado', created_at: '2024-01-14T08:00:00Z' },
  { id: '2', folio: 'CIV-2024-00455', address: 'Calle Morelos 123', status: 'asignado', created_at: '2024-01-14T09:00:00Z' },
  { id: '3', folio: 'CIV-2024-00454', address: 'Calle Zaragoza 200', status: 'asignado', created_at: '2024-01-14T10:00:00Z' },
  { id: '4', folio: 'CIV-2024-00453', address: 'Av. Juárez 350', status: 'asignado', created_at: '2024-01-14T11:00:00Z' },
  { id: '5', folio: 'CIV-2024-00452', address: 'Calle Hidalgo 180', status: 'asignado', created_at: '2024-01-14T12:00:00Z' },
]

const mockTimeline = [
  { id: '1', title: 'Issue creado', user: 'Sistema', timestamp: '2024-01-14T10:00:00Z' },
  { id: '2', title: 'Asignado a Servicios Públicos', user: 'María López', timestamp: '2024-01-14T10:30:00Z' },
  { id: '3', title: 'Reporte CIV-00455 agregado', user: 'Sistema', timestamp: '2024-01-14T11:00:00Z' },
  { id: '4', title: 'Estado cambiado a En proceso', user: 'Juan Pérez', timestamp: '2024-01-14T14:00:00Z' },
]

const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-700',
  asignado: 'bg-purple-100 text-purple-700',
  en_proceso: 'bg-cyan-100 text-cyan-700',
  resuelto: 'bg-green-100 text-green-700',
}

export default function IssueDetailPage() {
  const router = useRouter()
  const params = useParams()
  
  const [showResolveDrawer, setShowResolveDrawer] = useState(false)
  const [showAddReportModal, setShowAddReportModal] = useState(false)

  const issue = mockIssue

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-civix-500" />
              <h1 className="text-2xl font-bold text-gray-900">{issue.title}</h1>
              <Badge className={STATUS_COLORS[issue.status]}>
                {issue.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-gray-500">
              {issue.category} • {issue.colonia} • {mockChildReports.length} reportes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAddReportModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar reporte
          </Button>
          {issue.status !== 'resuelto' && (
            <Button onClick={() => setShowResolveDrawer(true)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolver todo
            </Button>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mapa de reportes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                Mapa con {mockChildReports.length} marcadores
              </div>
            </CardContent>
          </Card>

          {/* Child reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Reportes incluidos ({mockChildReports.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddReportModal(true)}>
                + Agregar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockChildReports.map((report) => (
                  <div key={report.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/panel/reportes/${report.id}`}
                          className="font-mono text-civix-600 hover:underline"
                        >
                          {report.folio}
                        </Link>
                        <Badge variant="gray" className="text-xs">
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{report.address}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatRelativeTime(report.created_at)}
                    </p>
                    <button className="p-1 text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asignación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Área</p>
                <p className="font-medium">{issue.area.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Responsable</p>
                <p className="font-medium">{issue.assignee.name}</p>
              </div>
              <Button variant="outline" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Cambiar asignación
              </Button>
            </CardContent>
          </Card>

          {/* SLA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SLA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Resolución</p>
                <Badge variant={issue.sla.resolution.status === 'ok' ? 'success' : 'warning'}>
                  {issue.sla.resolution.status === 'ok' ? 'En tiempo' : 'Por vencer'}
                </Badge>
              </div>
              <p className="text-sm">Vence: {formatDateTime(issue.sla.resolution.deadline)}</p>
              {issue.sla.resolution.remaining && (
                <p className="text-sm text-yellow-600 mt-1">
                  Quedan {issue.sla.resolution.remaining}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTimeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-civix-500" />
                      {index < mockTimeline.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-gray-400">
                        {event.user} • {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolve Drawer */}
      {showResolveDrawer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resolver issue completo</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowResolveDrawer(false)}>
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Esto marcará como resueltos los {mockChildReports.length} reportes incluidos en este issue.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción de la solución
                </label>
                <textarea 
                  rows={4}
                  placeholder="Describe qué se hizo para resolver el problema..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidencia fotográfica
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500">Arrastra fotos o haz clic para subir</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t sticky bottom-0 bg-white">
              <Button className="w-full" onClick={() => setShowResolveDrawer(false)}>
                Resolver {mockChildReports.length} reportes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Report Modal */}
      {showAddReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Agregar reporte al issue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar por folio
                </label>
                <input
                  type="text"
                  placeholder="CIV-2024-..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <p className="text-sm text-gray-500">
                Solo se pueden agregar reportes de la misma categoría ({issue.category}) que no estén asignados a otro issue.
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddReportModal(false)}>
                Cancelar
              </Button>
              <Button>Agregar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
