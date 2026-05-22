'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  MapPin, 
  Clock,
  CheckCircle,
  Circle,
  User,
  MessageSquare,
  Image,
  Mic,
  UserPlus,
  XCircle,
  StickyNote,
  ExternalLink,
  Layers,
  AlertTriangle,
  Phone,
  Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'

// Mock data
const mockReport = {
  id: '1',
  folio: 'CIV-2024-00456',
  category: 'Baches',
  internalStatus: 'asignado',
  citizenStatus: 'en_proceso',
  priority: 'alta',
  description: 'Hay un bache grande en la esquina de Constitución y Morelos. Es peligroso para los carros y las motos. Ya vi que varios carros se han dañado las llantas.',
  hasAudio: true,
  address: 'Av. Constitución 500, esquina con Morelos',
  colonia: 'Centro',
  municipio: 'Monterrey',
  location: { lat: 25.6866, lng: -100.3161 },
  reference: 'Frente al Oxxo de la esquina',
  photos: ['/placeholder-1.jpg', '/placeholder-2.jpg'],
  created_at: '2024-01-15T08:00:00Z',
  area: { id: '1', name: 'Servicios Públicos' },
  assignee: { id: '1', name: 'Juan Pérez', role: 'Operador' },
  sla: {
    firstResponse: { deadline: '2024-01-16T08:00:00Z', status: 'ok', completedAt: '2024-01-15T10:30:00Z' },
    resolution: { deadline: '2024-01-17T08:00:00Z', status: 'warning', remaining: '4h 30m' },
  },
  citizen: {
    id: '1',
    name: 'María García López',
    contact_method: 'whatsapp',
    contact_value: '8112345678',
    colonia: 'Centro',
    verified: true,
    reports_count: 5,
  },
  groupedIssue: null,
}

const mockTimeline = [
  { id: '1', type: 'created', title: 'Reporte creado', user: 'Sistema', timestamp: '2024-01-15T08:00:00Z', icon: Circle },
  { id: '2', type: 'received', title: 'Reporte recibido en sistema', user: 'Sistema', timestamp: '2024-01-15T08:01:00Z', icon: CheckCircle },
  { id: '3', type: 'assigned', title: 'Asignado a Servicios Públicos', user: 'María López (Admin)', timestamp: '2024-01-15T10:30:00Z', icon: UserPlus, details: 'Responsable: Juan Pérez' },
  { id: '4', type: 'note', title: 'Nota interna agregada', user: 'Juan Pérez', timestamp: '2024-01-15T14:00:00Z', icon: StickyNote, details: 'Programada visita para mañana temprano. Se requiere material de bacheo.' },
  { id: '5', type: 'status', title: 'Estado cambiado a "Programado"', user: 'Juan Pérez', timestamp: '2024-01-15T14:05:00Z', icon: Clock },
]

const mockNotes = [
  { id: '1', user: 'Juan Pérez', timestamp: '2024-01-15T14:00:00Z', text: 'Programada visita para mañana temprano. Se requiere material de bacheo.' },
  { id: '2', user: 'María López', timestamp: '2024-01-15T10:35:00Z', text: 'Bache reportado anteriormente, verificar si es el mismo.' },
]

const INTERNAL_STATUS_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'sin_asignar', label: 'Sin asignar' },
  { value: 'asignado', label: 'Asignado' },
  { value: 'programado', label: 'Programado' },
  { value: 'en_campo', label: 'En campo' },
  { value: 'esperando_material', label: 'Esperando material' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'no_procede', label: 'No procede' },
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
}

const PRIORITY_LABELS: Record<string, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

const PRIORITY_COLORS: Record<string, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-yellow-100 text-yellow-700',
  baja: 'bg-gray-100 text-gray-600',
}

export default function ReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  
  const [showAssignDrawer, setShowAssignDrawer] = useState(false)
  const [showResolveDrawer, setShowResolveDrawer] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [newNote, setNewNote] = useState('')

  const report = mockReport

  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps?q=${report.location.lat},${report.location.lng}`
    window.open(url, '_blank')
  }

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
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{report.folio}</h1>
              <Badge className={STATUS_COLORS[report.internalStatus]}>
                {report.internalStatus.replace(/_/g, ' ')}
              </Badge>
              <Badge className={PRIORITY_COLORS[report.priority]}>
                {PRIORITY_LABELS[report.priority]}
              </Badge>
            </div>
            <p className="text-gray-500">{report.category} • {report.colonia}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAssignDrawer(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            {report.assignee ? 'Reasignar' : 'Asignar'}
          </Button>
          <Button variant="outline" onClick={() => setShowNoteModal(true)}>
            <StickyNote className="w-4 h-4 mr-2" />
            Agregar nota
          </Button>
          {report.internalStatus !== 'resuelto' && report.internalStatus !== 'no_procede' && (
            <Button onClick={() => setShowResolveDrawer(true)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolver
            </Button>
          )}
        </div>
      </div>

      {/* SLA Alert */}
      {report.sla.resolution.status === 'warning' && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">SLA de resolución por vencer</p>
              <p className="text-sm text-yellow-700">
                Quedan {report.sla.resolution.remaining} para cumplir el SLA de resolución.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Report details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descripción del ciudadano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                <p className="text-gray-700">{report.description}</p>
              </div>
              
              {report.hasAudio && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mic className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Audio adjunto</p>
                    <p className="text-xs text-gray-500">0:45</p>
                  </div>
                  <Button variant="outline" size="sm">Reproducir</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          {report.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fotos ({report.photos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {report.photos.map((photo, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                      <Image className="w-8 h-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ubicación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{report.address}</p>
                    <p className="text-sm text-gray-500">{report.colonia}, {report.municipio}</p>
                    {report.reference && (
                      <p className="text-sm text-gray-400 mt-1">Ref: {report.reference}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {report.location.lat.toFixed(6)}, {report.location.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleOpenMaps}>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ver mapa
                </Button>
              </div>
              {/* Map placeholder */}
              <div className="mt-4 aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                Mapa
              </div>
            </CardContent>
          </Card>

          {/* Internal notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Notas internas</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowNoteModal(true)}>
                + Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {mockNotes.length > 0 ? (
                <div className="space-y-4">
                  {mockNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <p className="text-gray-700">{note.text}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {note.user} • {formatDateTime(note.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay notas internas.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Assignment info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asignación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Área</p>
                <p className="font-medium">{report.area?.name || 'Sin asignar'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Responsable</p>
                <p className="font-medium">{report.assignee?.name || 'Sin asignar'}</p>
                {report.assignee && (
                  <p className="text-xs text-gray-400">{report.assignee.role}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado interno</p>
                <select 
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={report.internalStatus}
                >
                  {INTERNAL_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* SLA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SLA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Primera respuesta</p>
                  <Badge variant={report.sla.firstResponse.status === 'ok' ? 'success' : 'danger'}>
                    {report.sla.firstResponse.status === 'ok' ? 'Cumplido' : 'Vencido'}
                  </Badge>
                </div>
                <p className="text-sm">
                  {report.sla.firstResponse.completedAt 
                    ? `Completado: ${formatDateTime(report.sla.firstResponse.completedAt)}`
                    : `Vence: ${formatDateTime(report.sla.firstResponse.deadline)}`
                  }
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Resolución</p>
                  <Badge variant={report.sla.resolution.status === 'ok' ? 'success' : report.sla.resolution.status === 'warning' ? 'warning' : 'danger'}>
                    {report.sla.resolution.status === 'ok' ? 'En tiempo' : report.sla.resolution.status === 'warning' ? 'Por vencer' : 'Vencido'}
                  </Badge>
                </div>
                <p className="text-sm">Vence: {formatDateTime(report.sla.resolution.deadline)}</p>
                {report.sla.resolution.remaining && (
                  <p className="text-sm text-yellow-600">Quedan {report.sla.resolution.remaining}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Citizen info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ciudadano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{report.citizen.name}</p>
                  <div className="flex items-center gap-1">
                    {report.citizen.verified && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {report.citizen.reports_count} reportes
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {report.citizen.contact_method === 'whatsapp' ? (
                    <Phone className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Mail className="w-4 h-4 text-gray-400" />
                  )}
                  <span>****{report.citizen.contact_value.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{report.citizen.colonia}</span>
                </div>
              </div>
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
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <event.icon className="w-3 h-3 text-gray-500" />
                      </div>
                      {index < mockTimeline.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 -my-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      {event.details && (
                        <p className="text-sm text-gray-600">{event.details}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
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

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Agregar nota interna</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe una nota..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-civix-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowNoteModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => { setShowNoteModal(false); setNewNote(''); }}>
                Guardar nota
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Assignment Drawer */}
      {showAssignDrawer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Asignar reporte</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAssignDrawer(false)}>
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option>Servicios Públicos</option>
                  <option>Limpia</option>
                  <option>Agua y Drenaje</option>
                  <option>Parques</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option>Juan Pérez</option>
                  <option>María García</option>
                  <option>Carlos López</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                <textarea 
                  rows={3}
                  placeholder="Instrucciones o contexto adicional..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t sticky bottom-0 bg-white">
              <Button className="w-full" onClick={() => setShowAssignDrawer(false)}>
                Asignar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Drawer */}
      {showResolveDrawer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resolver reporte</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowResolveDrawer(false)}>
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resultado</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="result" value="resolved" defaultChecked className="text-civix-600" />
                    <div>
                      <p className="font-medium">Resuelto</p>
                      <p className="text-sm text-gray-500">El problema fue atendido correctamente.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="result" value="no_procede" className="text-civix-600" />
                    <div>
                      <p className="font-medium">No procede</p>
                      <p className="text-sm text-gray-500">El reporte no aplica o está fuera de competencia.</p>
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la solución</label>
                <textarea 
                  rows={3}
                  placeholder="Describe qué se hizo para resolver el problema..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Evidencia fotográfica</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Arrastra fotos o haz clic para subir</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t sticky bottom-0 bg-white">
              <Button className="w-full" onClick={() => setShowResolveDrawer(false)}>
                Marcar como resuelto
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
