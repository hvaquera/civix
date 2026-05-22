'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, AlertTriangle, Search, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

const lettersOnly = (v: string) => v.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]/g, '')
const numbersOnly = (v: string) => v.replace(/[^0-9]/g, '')
const addressChars = (v: string) => v.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑüÜ\s.,#\-/]/g, '')

// Autocomplete hook
function useAutocomplete(type: 'street' | 'colonia') {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setSuggestions([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/autocomplete?type=${type}&q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.results || [])
      } catch { setSuggestions([]) }
      setLoading(false)
    }, 300)
  }, [type])

  const clear = () => setSuggestions([])

  return { suggestions, loading, search, clear }
}

// Autocomplete input component
function AutocompleteField({ label, value, onChange, type, placeholder, required, filter, maxLength, onSelect }: {
  label: string; value: string; onChange: (v: string) => void; type: 'street' | 'colonia'
  placeholder?: string; required?: boolean; filter?: (v: string) => string; maxLength?: number
  onSelect?: (item: any) => void
}) {
  const { suggestions, loading, search, clear } = useAutocomplete(type)
  const [focused, setFocused] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleChange = (v: string) => {
    let val = filter ? filter(v) : v
    if (maxLength) val = val.slice(0, maxLength)
    onChange(val)
    search(val)
  }

  const handleSelect = (item: any) => {
    onChange(item.label || item.value)
    clear()
    setFocused(false)
    onSelect?.(item)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const showDropdown = focused && suggestions.length > 0

  return (
    <div ref={wrapperRef} className="relative">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          className="pr-8"
          maxLength={maxLength}
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-civix-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && value.length >= 2 && (
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto">
          {suggestions.map((item, i) => (
            <button
              key={i}
              className="w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-start gap-2 border-b border-gray-100 last:border-0"
              onClick={() => handleSelect(item)}
            >
              <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-900 truncate">{item.label || item.value}</p>
                {item.cp && <p className="text-xs text-gray-400">CP {item.cp}</p>}
                {item.context && <p className="text-xs text-gray-400 truncate">{item.context}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Regular field
function Field({ label, value, onChange, required, type = 'text', placeholder, filter, maxLength, confidence }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string
  placeholder?: string; filter?: (v: string) => string; maxLength?: number; confidence?: number
}) {
  const isLow = confidence !== undefined && confidence < 0.8
  const handleChange = (v: string) => {
    let val = filter ? filter(v) : v
    if (maxLength) val = val.slice(0, maxLength)
    onChange(val)
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
  const [form, setForm] = useState({
    name: '', paternal: '', maternal: '', phone: '', email: '',
    street: '', interior: '', colonia: '', cp: '',
    municipio: 'Monterrey', estado: 'Nuevo León', seccion: '',
    support_level: '',
  })
  const [confidence, setConfidence] = useState<Record<string, number>>({})

  useEffect(() => {
    const stored = localStorage.getItem('campo_registro_ine')
    if (stored) {
      try {
        const ocr = JSON.parse(stored)
        if (ocr.name) {
          setForm(prev => ({
            ...prev,
            name: ocr.name || '', paternal: ocr.paternal || '', maternal: ocr.maternal || '',
            street: ocr.street || '', interior: ocr.interior || '', colonia: ocr.colonia || '',
            cp: ocr.cp || '', municipio: ocr.municipio || 'Monterrey',
            estado: ocr.estado || 'Nuevo León', seccion: ocr.seccion || '',
          }))
          if (ocr.ocr_confidence) setConfidence(ocr.ocr_confidence)
        }
      } catch {}
    }
  }, [])

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))
  const canContinue = form.name && form.paternal && form.street && form.colonia && form.seccion

  const handleColoniaSelect = (item: any) => {
    update('colonia', item.label || item.value)
    if (item.cp) update('cp', item.cp)
  }

  const handleStreetSelect = (item: any) => {
    update('street', item.label || item.value)
  }

  const handleContinue = () => {
    localStorage.setItem('campo_registro_datos', JSON.stringify(form))
    router.push('/campo/registro/peticion')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center"><p className="font-semibold text-gray-900">Paso 2 de 4</p><p className="text-gray-400 text-xs">Datos del ciudadano</p></div>
        <div className="w-9" />
      </div>
      <div className="px-4 py-2"><div className="h-1 bg-gray-200 rounded-full"><div className="h-full w-2/4 bg-civix-500 rounded-full" /></div></div>

      <div className="flex-1 px-4 pb-28 space-y-6 overflow-auto">
        {/* Datos personales */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos personales</h3>
          <div className="space-y-3">
            <Field label="Nombre(s)" value={form.name} onChange={(v) => update('name', v)} required placeholder="Ej: María" filter={lettersOnly} confidence={confidence.name} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ap. paterno" value={form.paternal} onChange={(v) => update('paternal', v)} required placeholder="García" filter={lettersOnly} confidence={confidence.paternal} />
              <Field label="Ap. materno" value={form.maternal} onChange={(v) => update('maternal', v)} placeholder="López" filter={lettersOnly} />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contacto</h3>
          <div className="space-y-3">
            <Field label="Teléfono" value={form.phone} onChange={(v) => update('phone', v)} type="tel" placeholder="10 dígitos" filter={numbersOnly} maxLength={10} />
            <Field label="Email" value={form.email} onChange={(v) => update('email', v)} type="email" placeholder="Opcional" />
          </div>
        </div>

        {/* Domicilio — with autocomplete */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Domicilio</h3>
          <div className="space-y-3">
            <AutocompleteField
              label="Calle y número"
              value={form.street}
              onChange={(v) => update('street', v)}
              type="street"
              required
              placeholder="Empieza a escribir la calle..."
              filter={addressChars}
              onSelect={handleStreetSelect}
            />
            <Field label="Interior" value={form.interior} onChange={(v) => update('interior', v)} placeholder="Depto, piso" />
            <div className="grid grid-cols-2 gap-3">
              <AutocompleteField
                label="Colonia"
                value={form.colonia}
                onChange={(v) => update('colonia', v)}
                type="colonia"
                required
                placeholder="Buscar colonia..."
                onSelect={handleColoniaSelect}
              />
              <Field label="CP" value={form.cp} onChange={(v) => update('cp', v)} placeholder="5 dígitos" filter={numbersOnly} maxLength={5} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Municipio" value={form.municipio} onChange={(v) => update('municipio', v)} required />
              <Field label="Estado" value={form.estado} onChange={(v) => update('estado', v)} required />
            </div>
          </div>
        </div>

        {/* Electoral */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos electorales</h3>
          <Field label="Sección electoral" value={form.seccion} onChange={(v) => update('seccion', v)} required placeholder="4 dígitos del INE" filter={numbersOnly} maxLength={4} confidence={confidence.seccion} />
        </div>

        {/* Support level */}
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
                <span className="text-lg">{opt.emoji}</span>{opt.label}
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
