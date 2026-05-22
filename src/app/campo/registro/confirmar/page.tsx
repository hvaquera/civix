'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, CheckCircle, UserPlus, MapPin, FileText, Wifi, WifiOff, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function CampoConfirmarPage() {
  const router = useRouter()
  const [datos, setDatos] = useState<any>({})
  const [peticion, setPeticion] = useState<any>({})
  const [photos, setPhotos] = useState<any>({})
  const [isOnline, setIsOnline] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    const d = localStorage.getItem('campo_registro_datos'); if (d) setDatos(JSON.parse(d))
    const p = localStorage.getItem('campo_registro_peticion'); if (p) setPeticion(JSON.parse(p))
    const ph = localStorage.getItem('campo_registro_photos'); if (ph) setPhotos(JSON.parse(ph))
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const fullName = [datos.name, datos.paternal, datos.maternal].filter(Boolean).join(' ')
  const assignment = { seccion: datos.seccion || '—', colonia: datos.colonia || '—', manzanero: datos.seccion === '1234' ? 'Roberto Sánchez' : null, coordinador: 'Laura Hernández' }

  const handleSave = async (andAnother: boolean) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))

    // ── Build the record ──
    const record = {
      id: (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)),
      name: fullName || 'Sin nombre',
      seccion: datos.seccion || '',
      colonia: datos.colonia || '',
      phone: datos.phone || '',
      street: datos.street || '',
      municipio: datos.municipio || '',
      estado: datos.estado || '',
      peticion: peticion.text || '',
      categories: peticion.categories || [],
      urgency: peticion.urgency || 'media',
      note: peticion.note || '',
      has_ine: !!photos.front,
      event: null, // TODO: link to active event
      captured_at: new Date().toISOString(),
      sync_status: isOnline ? 'synced' : 'pending',
    }

    // ── Persist to localStorage array ──
    const existing = JSON.parse(localStorage.getItem('campo_registros') || '[]')
    existing.unshift(record) // newest first
    localStorage.setItem('campo_registros', JSON.stringify(existing))

    // ── Clean up form data ──
    localStorage.removeItem('campo_registro_ine')
    localStorage.removeItem('campo_registro_datos')
    localStorage.removeItem('campo_registro_peticion')
    localStorage.removeItem('campo_registro_photos')

    const regId = `CAM-${Date.now().toString().slice(-6)}`
    toast.success(isOnline ? 'Registro enviado correctamente' : 'Guardado localmente', {
      description: isOnline ? `ID: ${regId}` : 'Se enviará cuando tengas conexión'
    })

    setSaving(false)
    router.push(andAnother ? '/campo/registro/ine' : '/campo/home')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="p-4 flex items-center justify-between border-b bg-white sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center"><p className="font-semibold text-gray-900">Paso 4 de 4</p><p className="text-gray-400 text-xs">Confirmar</p></div>
        <div className="w-9" />
      </div>
      <div className="px-4 py-2 bg-white"><div className="h-1 bg-gray-200 rounded-full"><div className="h-full w-full bg-civix-500 rounded-full" /></div></div>
      <div className="flex-1 px-4 py-4 space-y-4 overflow-auto pb-40">
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900 flex items-center gap-2"><UserPlus className="w-4 h-4 text-civix-500" />Ciudadano</h3><button onClick={() => router.push('/campo/registro/datos')} className="text-civix-600"><Edit2 className="w-4 h-4" /></button></div>
          <div className="space-y-1 text-sm"><p className="font-medium text-gray-900">{fullName || 'Sin nombre'}</p>{datos.phone && <p className="text-gray-500">Tel: {datos.phone}</p>}<p className="text-gray-500">{datos.street}, {datos.colonia}</p><p className="text-gray-500">CP {datos.cp}, {datos.municipio}, {datos.estado}</p></div>
        </CardContent></Card>

        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-civix-500" />INE</h3></div>
          <div className="flex items-center gap-3 text-sm"><p className="text-gray-500">Sección: <span className="font-medium text-gray-900">{datos.seccion || '—'}</span></p><Badge className={photos.front ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{photos.front ? 'INE capturada' : 'Pendiente de OCR'}</Badge></div>
        </CardContent></Card>

        {peticion.text && <Card><CardContent className="p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-civix-500" />Petición</h3><button onClick={() => router.push('/campo/registro/peticion')} className="text-civix-600"><Edit2 className="w-4 h-4" /></button></div>
          <p className="text-sm text-gray-700 mb-2">{peticion.text}</p>
          {peticion.categories?.length > 0 && <div className="flex flex-wrap gap-1 mb-2">{peticion.categories.map((c: string) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}</div>}
          {peticion.urgency && <Badge className={cn('text-xs', peticion.urgency === 'alta' ? 'bg-red-100 text-red-700' : peticion.urgency === 'media' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700')}>Urgencia: {peticion.urgency}</Badge>}
        </CardContent></Card>}

        <Card className="border-civix-200 bg-civix-50"><CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-civix-500" />Asignación territorial</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Sección</p><p className="font-medium">{assignment.seccion}</p></div>
            <div><p className="text-gray-500">Colonia</p><p className="font-medium">{assignment.colonia}</p></div>
            <div><p className="text-gray-500">Manzanero</p><p className="font-medium">{assignment.manzanero || <span className="text-orange-600">Sin asignar</span>}</p></div>
            <div><p className="text-gray-500">Coordinador</p><p className="font-medium">{assignment.coordinador}</p></div>
          </div>
        </CardContent></Card>

        <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', isOnline ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700')}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {isOnline ? 'Se enviará ahora al servidor' : 'Se guardará localmente y se enviará con conexión'}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t space-y-2">
        <Button className="w-full h-12 text-base" disabled={saving} onClick={() => handleSave(false)}>{saving ? 'Guardando...' : <><CheckCircle className="w-4 h-4 mr-2" />Guardar registro</>}</Button>
        <button onClick={() => handleSave(true)} disabled={saving} className="w-full text-center text-sm text-civix-600 font-medium py-2">Guardar y registrar otro</button>
      </div>
    </div>
  )
}
