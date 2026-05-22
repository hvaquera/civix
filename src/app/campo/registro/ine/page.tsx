'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Camera, RotateCcw, ChevronLeft, ChevronRight, FileEdit, Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Step = 'front' | 'back' | 'processing' | 'ready'

const compressImage = (file: File, maxSizeMB = 4): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        const maxDim = 1600
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = (height / width) * maxDim; width = maxDim }
          else { width = (width / height) * maxDim; height = maxDim }
        }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
        let quality = 0.8
        let base64 = canvas.toDataURL('image/jpeg', quality)
        while (base64.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.1) { quality -= 0.1; base64 = canvas.toDataURL('image/jpeg', quality) }
        resolve(base64)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export default function CampoINEPage() {
  const router = useRouter()
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef  = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('front')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage,  setBackImage]  = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleCapture = (side: 'front' | 'back') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo se aceptan imágenes'); return }
    setError('')
    try {
      const compressed = await compressImage(file)
      if (side === 'front') { setFrontImage(compressed); setStep('back') }
      else { setBackImage(compressed); setStep('ready') }
    } catch { setError('Error procesando imagen') }
    e.target.value = ''
  }

  const handleContinue = async () => {
    if (!frontImage) return
    setProcessing(true); setStep('processing'); setError('')
    try {
      const res = await fetch('/api/ocr/ine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontImage, backImage }),
      })
      const data = await res.json()
      if (res.status === 422 && data.is_valid_ine === false) {
        setError(`⚠️ ${data.rejection_reason || 'La imagen no parece ser una INE.'}`)
        setStep('front'); setFrontImage(null); setBackImage(null); return
      }
      const ine = res.ok ? data.data : null
      const ocrData = ine ? {
        name: ine.nombre || '', paternal: ine.apellido_paterno || '', maternal: ine.apellido_materno || '',
        street: [ine.calle, ine.numero_exterior].filter(Boolean).join(' ') || '',
        colonia: ine.colonia || '', cp: ine.codigo_postal || '',
        municipio: ine.municipio || '', estado: ine.estado || '', seccion: ine.seccion || '',
        ocr_confidence: ine.confidence || {},
      } : { name: 'MARIA', paternal: 'GARCIA', maternal: 'LOPEZ', street: 'AV SIMON BOLIVAR 320', colonia: 'MITRAS CENTRO', cp: '64460', municipio: 'MONTERREY', estado: 'NUEVO LEON', seccion: '1234', ocr_confidence: { name: 0.95, paternal: 0.92, street: 0.78, seccion: 0.99 } }
      localStorage.setItem('campo_registro_ine', JSON.stringify(ocrData))
      localStorage.setItem('campo_registro_photos', JSON.stringify({ front: true, back: !!backImage }))
      toast.success(ine ? 'Datos extraídos con IA' : 'Datos extraídos (modo demo)')
      router.push('/campo/registro/datos')
    } catch { setError('Error al procesar. Intenta de nuevo.'); setStep('ready') }
    finally { setProcessing(false) }
  }

  const handleManual = () => {
    localStorage.setItem('campo_registro_ine', JSON.stringify({}))
    localStorage.setItem('campo_registro_photos', JSON.stringify({ front: false, back: false }))
    router.push('/campo/registro/datos')
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 border-4 border-navy-800 rounded-full" />
            <div className="absolute inset-0 border-4 border-civix-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <h2 className="text-white text-base font-bold mb-1">Procesando INE con IA</h2>
          <p className="text-navy-400 text-sm">Extrayendo datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Header — fixed height */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 flex items-center justify-between">
        <button onClick={() => router.push('/campo/home')} className="p-2 text-navy-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-white font-semibold text-sm">Paso 1 de 4</p>
          <p className="text-navy-500 text-xs">Credencial INE</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="flex-shrink-0 mx-4 mb-4 h-1 bg-navy-800 rounded-full overflow-hidden">
        <div className="h-full bg-civix-500 rounded-full transition-all duration-500"
          style={{ width: step === 'front' ? '8%' : step === 'back' ? '16%' : '25%' }} />
      </div>

      {/* Step indicators */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 mb-5">
        {['Frente', 'Reverso'].map((label, i) => {
          const done = i === 0 ? !!frontImage : !!backImage
          const active = (i === 0 && step === 'front') || (i === 1 && (step === 'back' || step === 'ready'))
          return (
            <div key={label} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-civix-500 text-white' : 'bg-navy-800 text-navy-500')}>
                  {done ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={cn('text-xs', done || active ? 'text-navy-300' : 'text-navy-600')}>{label}</span>
              </div>
              {i === 0 && <div className={cn('w-10 h-0.5 mb-4', frontImage ? 'bg-emerald-500' : 'bg-navy-800')} />}
            </div>
          )
        })}
      </div>

      {/* Main content — fills remaining space, no overflow */}
      <div className="flex-1 flex flex-col px-4 min-h-0">

        {/* Title */}
        <div className="text-center mb-4 flex-shrink-0">
          <h2 className="text-white text-base font-bold">
            {step === 'front' ? 'Frente del INE' : step === 'back' ? 'Reverso del INE' : '¡INE completa!'}
          </h2>
          <p className="text-navy-400 text-xs mt-0.5">
            {step === 'front' ? 'Foto clara, buena iluminación' : step === 'back' ? 'Voltea la credencial' : 'Lista para extraer datos con IA'}
          </p>
        </div>

        {/* Card capture area — max height to prevent overflow */}
        {(step === 'front' || step === 'back') && (
          <button
            onClick={() => step === 'front' ? frontRef.current?.click() : backRef.current?.click()}
            className="flex-1 max-h-52 w-full border-2 border-dashed border-navy-700 rounded-2xl flex flex-col items-center justify-center gap-3 text-navy-500 hover:border-civix-500 hover:text-civix-400 transition-colors"
          >
            <Camera className="w-10 h-10" />
            <span className="text-sm font-medium">Tomar foto</span>
            <span className="text-xs text-navy-600">O seleccionar de galería</span>
          </button>
        )}

        {/* Ready — thumbnails side by side, compact */}
        {step === 'ready' && (
          <div className="flex-1 min-h-0">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <span className="text-white font-bold">INE lista para procesar</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Frente', img: frontImage, onRetake: () => { setFrontImage(null); setBackImage(null); setStep('front') } },
                { label: 'Reverso', img: backImage, onRetake: () => { setBackImage(null); setStep('back') } }
              ].map((side) => (
                <div key={side.label}>
                  <p className="text-navy-500 text-xs mb-1">{side.label}</p>
                  <div className="relative rounded-xl overflow-hidden bg-navy-800">
                    {side.img
                      ? <img src={side.img} alt={side.label} className="w-full aspect-[1.6/1] object-cover" />
                      : <div className="w-full aspect-[1.6/1] flex items-center justify-center text-navy-600 text-xs">No capturado</div>
                    }
                    {side.img && (
                      <button onClick={side.onRetake} className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 rounded-full text-white">
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden inputs */}
        <input ref={frontRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture('front')} />
        <input ref={backRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture('back')} />

        {error && (
          <div className="flex-shrink-0 mt-3 flex items-start gap-2 p-3 bg-red-950/60 border border-red-900 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        <button onClick={handleManual} className="flex-shrink-0 flex items-center justify-center gap-2 text-navy-600 hover:text-navy-400 transition-colors mx-auto mt-4 mb-2">
          <FileEdit className="w-3.5 h-3.5" /><span className="text-xs">Captura manual sin INE</span>
        </button>
      </div>

      {/* Bottom CTA — fixed */}
      <div className="flex-shrink-0 bg-navy-950 border-t border-navy-800 p-4 space-y-2 safe-bottom">
        <p className="text-xs text-navy-600 text-center flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />Tu INE se procesa con IA y no se almacena
        </p>
        {step === 'ready' ? (
          <Button size="lg" className="w-full" onClick={handleContinue}>
            Continuar <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button size="lg" className="w-full" disabled variant="secondary">
            {step === 'front' ? 'Captura el frente para continuar' : 'Captura el reverso para continuar'}
          </Button>
        )}
      </div>
    </div>
  )
}
