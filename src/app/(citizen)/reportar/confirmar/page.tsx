'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  MapPin, 
  FileText,
  Mic,
  Image,
  CheckCircle,
  Edit2,
  Send
} from 'lucide-react'

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

interface ReportDraft {
  categoria: string
  description: string
  photos: string[]
  audioBlob: boolean
  location: { lat: number; lng: number } | null
  address: string
  reference: string
}

export default function ReportarConfirmarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const categoria = searchParams.get('categoria') || 'otro'
  
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [folio, setFolio] = useState('')
  const [draft, setDraft] = useState<ReportDraft | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedDraft = localStorage.getItem('civix_report_draft')
    if (savedDraft) {
      try {
        setDraft(JSON.parse(savedDraft))
      } catch (e) {
        console.error('Error loading draft:', e)
      }
    }
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const generatedFolio = `CIV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
      
      const existingReports = JSON.parse(localStorage.getItem('civix_my_reports') || '[]')
      const newReport = {
        id: Date.now().toString(),
        folio: generatedFolio,
        categoria,
        description: draft?.description || '',
        photos: draft?.photos || [],
        hasAudio: draft?.audioBlob || false,
        location: draft?.location,
        address: draft?.address || '',
        reference: draft?.reference || '',
        status: 'recibido',
        created_at: new Date().toISOString(),
      }
      existingReports.unshift(newReport)
      localStorage.setItem('civix_my_reports', JSON.stringify(existingReports))
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setFolio(generatedFolio)
      setSubmitted(true)
      localStorage.removeItem('civix_report_draft')
    } catch (error) {
      console.error('Error creating report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-civix-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="text-center w-full max-w-sm">
          <div className="inline-flex p-4 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Reporte enviado!</h1>
          <p className="text-gray-600 mb-6">Tu reporte fue recibido y será atendido pronto.</p>
          <Card className="p-4 mb-8 text-left">
            <p className="text-sm text-gray-500 mb-1">Tu folio de seguimiento</p>
            <p className="text-xl font-bold text-civix-600 font-mono">{folio}</p>
            <p className="text-xs text-gray-400 mt-2">Guarda este folio para dar seguimiento.</p>
          </Card>
          <div className="space-y-3">
            <Button size="lg" className="w-full" onClick={() => router.push('/mis-reportes')}>
              Ver mis reportes
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => router.push('/home')}>
              Ir al inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">Confirmar reporte</h1>
            <p className="text-sm text-gray-500">Paso 3 de 3</p>
          </div>
        </div>
      </div>

      {/* Content - scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Revisa tu reporte antes de enviarlo</h2>

        {/* Category */}
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Categoría</p>
              <p className="font-medium text-gray-900 text-sm">{CATEGORY_LABELS[categoria]}</p>
            </div>
            <button onClick={() => router.push('/reportar')} className="p-1.5 text-gray-400 hover:text-gray-600">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* Content summary */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Contenido del reporte</p>
            <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-600">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            {draft?.description && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Descripción incluida</span>
                <Badge variant="success" className="text-xs">✓</Badge>
              </div>
            )}
            {draft?.audioBlob && (
              <div className="flex items-center gap-2 text-sm">
                <Mic className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Audio incluido</span>
                <Badge variant="success" className="text-xs">✓</Badge>
              </div>
            )}
            {(draft?.photos?.length || 0) > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Image className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{draft?.photos.length} foto{(draft?.photos?.length || 0) > 1 ? 's' : ''}</span>
                <Badge variant="success" className="text-xs">✓</Badge>
              </div>
            )}
            {!draft?.description && !draft?.audioBlob && !(draft?.photos?.length) && (
              <p className="text-sm text-gray-400">Sin contenido agregado</p>
            )}
          </div>
        </Card>

        {/* Location */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Ubicación</p>
            <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-600">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-civix-100 rounded-lg flex-shrink-0">
              <MapPin className="w-4 h-4 text-civix-600" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm">{draft?.address || 'Ubicación obtenida'}</p>
              {draft?.reference && <p className="text-xs text-gray-500">Ref: {draft.reference}</p>}
              {draft?.location && (
                <p className="text-xs text-gray-400">{draft.location.lat.toFixed(5)}, {draft.location.lng.toFixed(5)}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Info */}
        <Card className="p-3 bg-civix-50 border-civix-200">
          <p className="text-xs text-civix-800">
            <strong>¿Qué sigue?</strong> Tu reporte será asignado al área correspondiente y te notificaremos.
          </p>
        </Card>
      </div>

      {/* Fixed button area - part of flex layout, not fixed position */}
      <div className="flex-shrink-0 bg-white border-t px-4 py-3 pb-20">
        <Button size="lg" className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Enviar reporte
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
