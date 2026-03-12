'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  MapPin, 
  Clock,
  CheckCircle,
  Circle,
  Star,
  Share2,
  Copy,
  Image,
  MessageSquare,
  Construction,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_CITIZEN_LABELS, formatDateTime, formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

// Mock data
const mockReport = {
  id: '1',
  folio: 'CIV-2024-00123',
  category: 'Baches',
  categoryCode: 'baches',
  status: 'en_proceso',
  description: 'Hay un bache grande en la esquina de Constitución y Morelos. Es peligroso para los carros y las motos.',
  address: 'Av. Constitución 500, esquina con Morelos',
  colonia: 'Centro',
  municipio: 'Monterrey',
  location: { lat: 25.6866, lng: -100.3161 },
  photos: [
    '/placeholder-1.jpg',
    '/placeholder-2.jpg',
  ],
  created_at: '2024-01-15T10:30:00Z',
  submitted_at: '2024-01-15T10:32:00Z',
  rating: null,
  canRate: false,
}

const mockTimeline = [
  {
    id: '1',
    type: 'created',
    title: 'Reporte creado',
    description: 'Tu reporte fue enviado correctamente.',
    timestamp: '2024-01-15T10:32:00Z',
    status: 'completed',
  },
  {
    id: '2',
    type: 'received',
    title: 'Reporte recibido',
    description: 'Tu reporte está en cola de atención.',
    timestamp: '2024-01-15T10:35:00Z',
    status: 'completed',
  },
  {
    id: '3',
    type: 'assigned',
    title: 'Asignado a Servicios Públicos',
    description: 'Tu reporte fue asignado al área correspondiente.',
    timestamp: '2024-01-15T14:20:00Z',
    status: 'completed',
  },
  {
    id: '4',
    type: 'in_progress',
    title: 'En proceso',
    description: 'El personal está trabajando en tu reporte.',
    timestamp: '2024-01-16T09:00:00Z',
    status: 'current',
  },
  {
    id: '5',
    type: 'resolved',
    title: 'Resuelto',
    description: null,
    timestamp: null,
    status: 'pending',
  },
]

const STATUS_VARIANTS: Record<string, 'info' | 'purple' | 'success' | 'danger' | 'warning' | 'gray' | 'orange'> = {
  recibido: 'info',
  en_proceso: 'purple',
  resuelto: 'success',
  no_procede: 'danger',
  revision_solicitada: 'orange',
}

export default function ReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [showAllPhotos, setShowAllPhotos] = useState(false)

  const report = mockReport
  const timeline = mockTimeline

  const handleCopyFolio = () => {
    navigator.clipboard.writeText(report.folio)
    toast.success('Folio copiado')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reporte ${report.folio}`,
          text: `Reporte de ${report.category} en ${report.address}`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopyFolio()
    }
  }

  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps?q=${report.location.lat},${report.location.lng}`
    window.open(url, '_blank')
  }

  const canRate = report.status === 'resuelto' && !report.rating

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-semibold text-gray-900">{report.category}</h1>
              <p className="text-sm text-gray-500 font-mono">{report.folio}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyFolio}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Status card */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Estado actual</p>
              <Badge variant={STATUS_VARIANTS[report.status]} className="text-sm">
                {STATUS_CITIZEN_LABELS[report.status]}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Creado</p>
              <p className="text-sm font-medium">{formatRelativeTime(report.created_at)}</p>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
              <p className="text-gray-600">{report.description}</p>
            </div>
          </div>
        </Card>

        {/* Photos */}
        {report.photos.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-5 h-5 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Fotos ({report.photos.length})
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {report.photos.slice(0, showAllPhotos ? undefined : 2).map((photo, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gray-200 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Construction className="w-8 h-8" />
                  </div>
                </div>
              ))}
            </div>
            {report.photos.length > 2 && !showAllPhotos && (
              <button
                onClick={() => setShowAllPhotos(true)}
                className="mt-2 text-sm text-civix-600 font-medium"
              >
                Ver todas las fotos
              </button>
            )}
          </Card>
        )}

        {/* Location */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-1">Ubicación</p>
              <p className="text-gray-600">{report.address}</p>
              <p className="text-sm text-gray-400">{report.colonia}, {report.municipio}</p>
            </div>
            <button
              onClick={handleOpenMaps}
              className="p-2 text-civix-600 hover:bg-civix-50 rounded-lg"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Seguimiento</p>
          </div>
          
          <div className="space-y-0">
            {timeline.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                {/* Timeline line and dot */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center',
                    event.status === 'completed' && 'bg-green-100',
                    event.status === 'current' && 'bg-civix-100',
                    event.status === 'pending' && 'bg-gray-100'
                  )}>
                    {event.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : event.status === 'current' ? (
                      <Circle className="w-4 h-4 text-civix-600 fill-civix-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-12 -my-1',
                      event.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                    )} />
                  )}
                </div>

                {/* Content */}
                <div className="pb-6">
                  <p className={cn(
                    'font-medium',
                    event.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                  )}>
                    {event.title}
                  </p>
                  {event.description && (
                    <p className="text-sm text-gray-500">{event.description}</p>
                  )}
                  {event.timestamp && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(event.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resolution evidence (when resolved) */}
        {report.status === 'resuelto' && (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 mb-1">Problema resuelto</p>
                <p className="text-sm text-green-700">
                  El municipio atendió tu reporte. Revisa la evidencia y califica el servicio.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Fixed bottom CTA */}
      {canRate && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t safe-bottom">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push(`/mis-reportes/${report.id}/calificar`)}
          >
            <Star className="w-5 h-5 mr-2" />
            Calificar servicio
          </Button>
        </div>
      )}

      {report.status === 'no_procede' && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t safe-bottom">
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/mis-reportes/${report.id}/calificar`)}
          >
            Solicitar revisión
          </Button>
        </div>
      )}
    </div>
  )
}
