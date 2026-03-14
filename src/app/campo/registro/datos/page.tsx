'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Input validation helpers
const lettersOnly = (v: string) => v.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]/g, '')
const numbersOnly = (v: string) => v.replace(/[^0-9]/g, '')
const addressChars = (v: string) => v.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑüÜ\s.,#\-/]/g, '')

type FieldConfig = {
  label: string; field: string; required?: boolean; type?: string; placeholder?: string
  filter?: (v: string) => string; maxLength?: number
}

function Field({ label, field, required, type = 'text', placeholder = '', value, confidence, onChange, filter, maxLength }: 
  FieldConfig & { value: string; confidence: number | undefined; onChange: (field: string, value: string) => void }
) {
  const isLow = confidence !== undefined && confidence < 0.8
  const handleChange = (v: string) => {
    let val = filter ? filter(v) : v
    if (maxLength) val = val.slice(0, maxLength)
    onChange(field, val)
  }
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {isLow && <Badge className="bg-yellow-100 text-yellow-700 text-xs">Revisar</Badge>}
      </label>
      <Input type={type} placeholder={placeholder} value={value} 
        onChange={(e) => handleChange(e.target.value)} 
        className={cn(isLow && 'border-yellow-400 bg-yellow-50')} 
        maxLength={maxLength}
      />
    </div>
  )
}

const SUPPORT_OPTIONS = [
  { value: 'hard_supporter', label: 'Simpatizante', emoji: '💚', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'soft_supporter', label: 'Probable', emoji: '💛', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'undecided', label: 'Indeciso', emoji: '⚪', color: 'bg-gray-100 text-gray-600 border-gray-300' },
  { value: 'opponent', label: 'Opositor', emoji: '🔴', color: 'bg-red-100 text-red-600 border-red-300' },
]

export default function CampoDatosPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', paternal: '', maternal: '', phone: '', email: '', street: '', interior: '', colonia: '', cp: '', municipio: 'Monterrey', estado: 'Nuevo León', seccion: '', support_level: '' })
  const [confidence, setConfidence] = useState<Record<string, number>>({})
  const [duplicate, setDuplicate] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('campo_registro_ine')
    if (stored) {
      const ocr = JSON.parse(stored)
      if (ocr.name) {
        setForm(prev => ({ ...prev, name: ocr.name || '', paternal: ocr.paternal || '', maternal: ocr.maternal || '', street: ocr.street || '', interior: ocr.interior || '', colonia: ocr.colonia || '', cp: ocr.cp || '', municipio: ocr.municipio || 'Monterrey', estado: ocr.estado || 'Nuevo León', seccion: ocr.seccion || '' }))
        if (ocr.ocr_confidence) setConfidence(ocr.ocr_confidence)
      }
    }
  }, [])

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))
  const canContinue = form.name && form.paternal && form.street && form.colonia && form.seccion

  const handleContinue = () => { 
    localStorage.setItem('campo_registro_datos', JSON.stringify(form))
    router.push('/campo/registro/peticion') 
  }

  const fp = (field: string) => ({ field, value: (form as any)[field], confidence: confidence[field], onChange: update })

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center"><p className="font-semibold text-gray-900">Paso 2 de 4</p><p className="text-gray-400 text-xs">Datos del ciudadano</p></div>
        <div className="w-9" />
      </div>
      <div className="px-4 py-2"><div className="h-1 bg-gray-200 rounded-full"><div className="h-full w-2/4 bg-civix-500 rounded-full" /></div></div>
      <div className="flex-1 px-4 pb-28 space-y-6 overflow-auto">
        {duplicate && (
          <Card className="p-3 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-2"><AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-yellow-800">Posible duplicado</p><p className="text-xs text-yellow-700">Un ciudadano con nombre y sección similar ya está registrado.</p><div className="flex gap-2 mt-2"><Button size="sm" variant="outline" onClick={() => setDuplicate(false)}>Es diferente</Button></div></div></div>
          </Card>
        )}

        {/* Datos personales */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos personales</h3>
          <div className="space-y-3">
            <Field label="Nombre(s)" {...fp('name')} required placeholder="Ej: María" filter={lettersOnly} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ap. paterno" {...fp('paternal')} required placeholder="García" filter={lettersOnly} />
              <Field label="Ap. materno" {...fp('maternal')} placeholder="López" filter={lettersOnly} />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contacto</h3>
          <div className="space-y-3">
            <Field label="Teléfono" {...fp('phone')} type="tel" placeholder="10 dígitos" filter={numbersOnly} maxLength={10} />
            <Field label="Email" {...fp('email')} type="email" placeholder="Opcional" />
          </div>
        </div>

        {/* Domicilio */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Domicilio</h3>
          <div className="space-y-3">
            <Field label="Calle y número" {...fp('street')} required placeholder="Av. Simón Bolívar 320" filter={addressChars} />
            <Field label="Interior" {...fp('interior')} placeholder="Depto, piso" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Colonia" {...fp('colonia')} required placeholder="Mitras Centro" filter={lettersOnly} />
              <Field label="CP" {...fp('cp')} placeholder="5 dígitos" filter={numbersOnly} maxLength={5} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Municipio" {...fp('municipio')} required />
              <Field label="Estado" {...fp('estado')} required />
            </div>
          </div>
        </div>

        {/* Datos electorales */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos electorales</h3>
          <div className="space-y-3">
            <Field label="Sección electoral" {...fp('seccion')} required placeholder="4 dígitos del INE" filter={numbersOnly} maxLength={4} />
          </div>
        </div>

        {/* Intención de apoyo */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Intención de apoyo</h3>
          <p className="text-xs text-gray-400 mb-3">¿Cómo percibes a esta persona?</p>
          <div className="grid grid-cols-2 gap-2">
            {SUPPORT_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => update('support_level', opt.value)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all',
                  form.support_level === opt.value ? opt.color : 'border-gray-200 text-gray-500 hover:border-gray-300'
                )}>
                <span className="text-lg">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button className="w-full h-12 text-base" disabled={!canContinue} onClick={handleContinue}>
          Continuar<ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
