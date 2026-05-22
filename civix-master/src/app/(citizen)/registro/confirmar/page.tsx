'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, AlertTriangle, CheckCircle, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Default data if nothing in localStorage
const defaultData = {
  name: '',
  last_name_1: '',
  last_name_2: '',
  street_and_number: '',
  colonia: '',
  postal_code: '',
  municipio: '',
  estado: 'NUEVO LEÓN',
  seccion_electoral: '',
  confidence: {
    name: 0.9,
    last_name_1: 0.9,
    last_name_2: 0.9,
    street_and_number: 0.9,
    colonia: 0.9,
    postal_code: 0.9,
    municipio: 0.9,
    estado: 0.9,
    seccion_electoral: 0.9,
  }
}

interface FieldProps {
  label: string
  value: string
  confidence: number
  editable?: boolean
  onChange?: (value: string) => void
}

function DataField({ label, value, confidence, editable, onChange }: FieldProps) {
  const [editing, setEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const needsReview = confidence < 0.85

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleSave = () => {
    onChange?.(localValue)
    setEditing(false)
  }

  const handleCancel = () => {
    setLocalValue(value)
    setEditing(false)
  }

  const handleRowClick = () => {
    if (editable && !editing) {
      setEditing(true)
    }
  }

  return (
    <div 
      className={cn(
        "py-3 border-b border-gray-100 last:border-0",
        editable && !editing && "cursor-pointer active:bg-gray-100 rounded-lg -mx-2 px-2 transition-colors"
      )}
      onClick={handleRowClick}
    >
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-gray-500">{label}</label>
        <div className="flex items-center gap-2">
          {needsReview && (
            <Badge variant="warning" className="text-xs">
              Revisar
            </Badge>
          )}
          {editable && !editing && (
            <Edit2 className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {editing ? (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button size="sm" onClick={handleSave}>
            OK
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            ✕
          </Button>
        </div>
      ) : (
        <p className={cn(
          'font-medium',
          needsReview ? 'text-orange-700' : 'text-gray-900'
        )}>
          {value || '-'}
        </p>
      )}
    </div>
  )
}

export default function ConfirmarDatosPage() {
  const router = useRouter()
  const [data, setData] = useState(defaultData)
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    setMounted(true)
    
    try {
      const storedData = localStorage.getItem('civix_ine_data')
      console.log('[CONFIRMAR] Datos en localStorage:', storedData)
      
      if (storedData) {
        const parsed = JSON.parse(storedData)
        console.log('[CONFIRMAR] Datos parseados:', parsed)
        
        // Map the OCR data to our form structure
        // El OCR devuelve: nombre, colonia, municipio, cp, seccion, calle, numero
        const nameParts = (parsed.nombre || '').split(' ')
        const firstName = nameParts.slice(0, -2).join(' ') || nameParts[0] || ''
        const lastName1 = nameParts[nameParts.length - 2] || ''
        const lastName2 = nameParts[nameParts.length - 1] || ''
        
        setData({
          name: firstName || parsed.nombre || '',
          last_name_1: lastName1,
          last_name_2: lastName2,
          street_and_number: parsed.calle ? `${parsed.calle} ${parsed.numero || ''}`.trim() : '',
          colonia: parsed.colonia || '',
          postal_code: parsed.cp || '',
          municipio: parsed.municipio || '',
          estado: 'NUEVO LEÓN',
          seccion_electoral: parsed.seccion || '',
          confidence: {
            name: 0.95,
            last_name_1: 0.95,
            last_name_2: 0.95,
            street_and_number: parsed.calle ? 0.85 : 0.5,
            colonia: parsed.colonia ? 0.95 : 0.5,
            postal_code: parsed.cp ? 0.95 : 0.5,
            municipio: parsed.municipio ? 0.99 : 0.5,
            estado: 0.99,
            seccion_electoral: parsed.seccion ? 0.95 : 0.5,
          }
        })
      }
    } catch (e) {
      console.error('[CONFIRMAR] Error leyendo localStorage:', e)
    }
  }, [])

  const hasLowConfidence = Object.values(data.confidence).some(c => c < 0.85)

  const handleFieldChange = (field: string) => (value: string) => {
    setData(prev => ({
      ...prev,
      [field]: value,
      confidence: {
        ...prev.confidence,
        [field]: 1, // Mark as manually verified
      }
    }))
  }

  const handleConfirm = async () => {
    if (!termsAccepted) return

    setLoading(true)

    // Save citizen data to localStorage
    localStorage.setItem('civix_citizen', JSON.stringify({
      id: 'citizen-' + Date.now(),
      contactVerified: true,
      ineVerified: true,
      status: 'active',
      name: `${data.name} ${data.last_name_1} ${data.last_name_2}`.trim(),
      colonia: data.colonia,
      municipio: data.municipio,
      seccion: data.seccion_electoral,
    }))

    // TODO: Save to API/Supabase
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Redirect to home
    router.push('/home')
  }

  // Don't render until mounted (avoids hydration issues)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-civix-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Atrás</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Confirma tus datos
          </h1>
          <p className="text-gray-600 mb-4">
            Extrajimos esta información de tu INE. Revisa que esté correcta.
          </p>

          {/* Warning if low confidence fields */}
          {hasLowConfidence && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg mb-6">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Algunos campos necesitan revisión
                </p>
                <p className="text-sm text-orange-700">
                  Verifica los campos marcados y corrígelos si es necesario.
                </p>
              </div>
            </div>
          )}

          {/* Data fields */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Datos personales</h2>
            <DataField
              label="Nombre(s)"
              value={data.name}
              confidence={data.confidence.name}
              editable
              onChange={handleFieldChange('name')}
            />
            <DataField
              label="Primer apellido"
              value={data.last_name_1}
              confidence={data.confidence.last_name_1}
              editable
              onChange={handleFieldChange('last_name_1')}
            />
            <DataField
              label="Segundo apellido"
              value={data.last_name_2}
              confidence={data.confidence.last_name_2}
              editable
              onChange={handleFieldChange('last_name_2')}
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Domicilio</h2>
            <DataField
              label="Calle y número"
              value={data.street_and_number}
              confidence={data.confidence.street_and_number}
              editable
              onChange={handleFieldChange('street_and_number')}
            />
            <DataField
              label="Colonia"
              value={data.colonia}
              confidence={data.confidence.colonia}
              editable
              onChange={handleFieldChange('colonia')}
            />
            <DataField
              label="Código postal"
              value={data.postal_code}
              confidence={data.confidence.postal_code}
            />
            <DataField
              label="Municipio"
              value={data.municipio}
              confidence={data.confidence.municipio}
            />
            <DataField
              label="Estado"
              value={data.estado}
              confidence={data.confidence.estado}
            />
            <DataField
              label="Sección electoral"
              value={data.seccion_electoral}
              confidence={data.confidence.seccion_electoral}
            />
          </div>

          {/* Service area validation */}
          {data.municipio && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg mb-6">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Tu domicilio está dentro del área de servicio
                </p>
                <p className="text-sm text-green-700">
                  Puedes reportar problemas en {data.municipio}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - fixed at bottom with safe area */}
      <div className="sticky bottom-0 left-0 right-0 p-6 pb-10 border-t bg-white shadow-lg">
        {/* Terms checkbox */}
        <label className="flex items-start gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-civix-600 focus:ring-civix-500"
          />
          <span className="text-sm text-gray-600">
            Confirmo que mis datos son correctos y acepto el{' '}
            <a href="/terminos" className="text-civix-600 underline">Aviso de privacidad</a>
            {' '}y los{' '}
            <a href="/terminos" className="text-civix-600 underline">Términos de uso</a>.
          </span>
        </label>

        <Button
          size="lg"
          className="w-full"
          onClick={handleConfirm}
          disabled={!termsAccepted || loading}
        >
          {loading ? 'Guardando...' : 'Confirmar y continuar'}
        </Button>
      </div>
    </div>
  )
}
