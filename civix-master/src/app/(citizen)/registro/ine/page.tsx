'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Camera, RotateCcw, ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertCircle, SkipForward, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'front' | 'front_done' | 'back' | 'back_done' | 'processing' | 'ready'

const compressImage = (file: File, maxSizeMB: number = 4): Promise<string> => {
  return new Promise((resolve, reject) => {
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
        while (base64.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1
          base64 = canvas.toDataURL('image/jpeg', quality)
        }
        resolve(base64)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function INECapturePage() {
  const router = useRouter()
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('front')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [activeRef, setActiveRef] = useState<'front' | 'back'>('front')

  useEffect(() => { setMounted(true) }, [])
  const isDev = mounted && typeof window !== 'undefined' && window.location.hostname === 'localhost'

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo se aceptan imágenes (JPG, PNG)'); return }
    setError('')
    try {
      const compressed = await compressImage(file)
      if (activeRef === 'front') {
        setFrontImage(compressed)
        setStep('front_done')
      } else {
        setBackImage(compressed)
        setStep('back_done')
      }
    } catch { setError('Error procesando la imagen') }
    e.target.value = ''
  }

  const openCapture = (side: 'front' | 'back', mode: 'camera' | 'file') => {
    setActiveRef(side)
    if (mode === 'camera') {
      if (side === 'front') frontRef.current?.click()
      else backRef.current?.click()
    } else {
      fileRef.current?.click()
    }
  }

  const handleProcess = async () => {
    if (!frontImage) return
    setStep('processing')
    setError('')

    try {
      const response = await fetch('/api/ocr/ine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontImage, backImage }),
      })
      const data = await response.json()

      // Check if image was rejected as non-INE
      if (response.status === 422 && data.is_valid_ine === false) {
        setError(`${data.rejection_reason || 'La imagen no parece ser una credencial INE.'} Intenta con una foto clara.`)
        setStep('front')
        setFrontImage(null)
        setBackImage(null)
        return
      }

      if (!response.ok) {
        if (isDev) {
          localStorage.setItem('civix_ine_data', JSON.stringify({ nombre: 'Usuario Demo', colonia: 'Centro', municipio: 'Monterrey', cp: '64000' }))
          router.push('/registro/confirmar')
          return
        }
        throw new Error(data.error || 'Error procesando INE')
      }

      if (data.data) {
        const ine = data.data
        let nombre = ine.nombre || ''
        if (ine.apellido_paterno) nombre += ' ' + ine.apellido_paterno
        if (ine.apellido_materno) nombre += ' ' + ine.apellido_materno
        localStorage.setItem('civix_ine_data', JSON.stringify({
          nombre: nombre.trim(), colonia: ine.colonia, municipio: ine.municipio,
          cp: ine.codigo_postal, seccion: ine.seccion, calle: ine.calle, numero: ine.numero_exterior,
        }))
      }
      router.push('/registro/confirmar')
    } catch (err) {
      if (isDev) {
        localStorage.setItem('civix_ine_data', JSON.stringify({ nombre: 'Usuario Demo', colonia: 'Centro', municipio: 'Monterrey', cp: '64000' }))
        router.push('/registro/confirmar')
        return
      }
      setError('No pudimos procesar tu INE. Intenta con una foto más clara.')
      setStep('ready')
    }
  }

  const handleSkipDev = () => {
    localStorage.setItem('civix_citizen', JSON.stringify({ id: 'dev-citizen-001', contactVerified: true, ineVerified: true, status: 'active', name: 'Usuario Demo', colonia: 'Centro', municipio: 'Monterrey' }))
    router.push('/home')
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-civix-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-civix-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Procesando tu INE</h2>
          <p className="text-gray-500">Nuestra IA está leyendo tus datos...</p>
        </div>
      </div>
    )
  }

  const progressWidth = step === 'front' ? '10%' : step === 'front_done' ? '25%' : step === 'back' ? '40%' : step === 'back_done' ? '60%' : '80%'

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-white p-2"><ChevronLeft className="w-5 h-5" /><span className="text-sm">Atrás</span></button>
        <div className="flex items-center gap-1.5">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
            frontImage ? 'bg-green-500 text-white' : step === 'front' ? 'bg-civix-500 text-white ring-2 ring-civix-300' : 'bg-white/20 text-white/50')}>
            {frontImage ? '✓' : '1'}
          </div>
          <div className={cn('w-6 h-0.5', frontImage ? 'bg-green-500' : 'bg-white/20')} />
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
            backImage ? 'bg-green-500 text-white' : (step === 'back' || step === 'back_done') ? 'bg-civix-500 text-white ring-2 ring-civix-300' : 'bg-white/20 text-white/50')}>
            {backImage ? '✓' : '2'}
          </div>
        </div>
      </div>

      <div className="px-6 mb-2">
        <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-medium',
          (step === 'front' || step === 'front_done') ? 'bg-civix-500/20 text-civix-300' : 'bg-purple-500/20 text-purple-300')}>
          {(step === 'front' || step === 'front_done') ? 'Paso 1 de 2' : 'Paso 2 de 2'}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* FRONT: capture */}
        {step === 'front' && (
          <div className="w-full max-w-sm">
            <h1 className="text-xl font-bold text-white mb-2 text-center">Frente de tu INE</h1>
            <p className="text-white/70 text-sm text-center mb-6">Toma una foto clara del frente de tu credencial.</p>
            <div className="w-full aspect-[1.586] bg-white/10 rounded-2xl border-2 border-dashed border-white/30 flex items-center justify-center mb-6">
              <div className="text-center text-white/50"><Camera className="w-12 h-12 mx-auto mb-2" /><p className="text-sm">Selecciona una opción</p></div>
            </div>
            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={() => openCapture('front', 'camera')}><Camera className="w-5 h-5 mr-2" />Tomar foto</Button>
              <Button variant="outline" size="lg" className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10" onClick={() => openCapture('front', 'file')}><Upload className="w-5 h-5 mr-2" />Subir</Button>
            </div>
          </div>
        )}

        {/* FRONT DONE */}
        {step === 'front_done' && frontImage && (
          <div className="w-full max-w-sm text-center">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-green-400 text-lg font-bold mb-2">Frente capturado</h2>
            <img src={frontImage} alt="Frente" className="w-full aspect-[1.6/1] object-cover rounded-xl mb-4" />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800" onClick={() => { setFrontImage(null); setStep('front') }}>
                <RotateCcw className="w-4 h-4 mr-2" />Retomar
              </Button>
              <Button className="flex-1" onClick={() => setStep('back')}>
                Continuar<ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* BACK: capture */}
        {step === 'back' && (
          <div className="w-full max-w-sm">
            <h1 className="text-xl font-bold text-white mb-2 text-center">Reverso de tu INE</h1>
            <p className="text-white/70 text-sm text-center mb-6">Ahora toma la foto del reverso.</p>
            <div className="w-full aspect-[1.586] bg-white/10 rounded-2xl border-2 border-dashed border-white/30 flex items-center justify-center mb-6">
              <div className="text-center text-white/50"><Camera className="w-12 h-12 mx-auto mb-2" /><p className="text-sm">Selecciona una opción</p></div>
            </div>
            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={() => openCapture('back', 'camera')}><Camera className="w-5 h-5 mr-2" />Tomar foto</Button>
              <Button variant="outline" size="lg" className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10" onClick={() => openCapture('back', 'file')}><Upload className="w-5 h-5 mr-2" />Subir</Button>
            </div>
          </div>
        )}

        {/* BACK DONE */}
        {step === 'back_done' && backImage && (
          <div className="w-full max-w-sm text-center">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-green-400 text-lg font-bold mb-2">Reverso capturado</h2>
            <img src={backImage} alt="Reverso" className="w-full aspect-[1.6/1] object-cover rounded-xl mb-4" />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800" onClick={() => { setBackImage(null); setStep('back') }}>
                <RotateCcw className="w-4 h-4 mr-2" />Retomar
              </Button>
              <Button className="flex-1" onClick={() => setStep('ready')}>
                Revisar fotos<ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* READY */}
        {step === 'ready' && (
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-white text-lg font-bold">INE completa</h2>
              <p className="text-gray-400 text-sm mt-1">Listo para verificar tus datos</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <p className="text-gray-500 text-xs mb-1">Frente</p>
                <div className="relative rounded-xl overflow-hidden">
                  <img src={frontImage!} alt="Frente" className="w-full aspect-[1.6/1] object-cover" />
                  <button onClick={() => { setFrontImage(null); setBackImage(null); setStep('front') }} className="absolute top-1 right-1 p-1.5 bg-black/60 rounded-full text-white"><RotateCcw className="w-3 h-3" /></button>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Reverso</p>
                <div className="relative rounded-xl overflow-hidden">
                  <img src={backImage!} alt="Reverso" className="w-full aspect-[1.6/1] object-cover" />
                  <button onClick={() => { setBackImage(null); setStep('back') }} className="absolute top-1 right-1 p-1.5 bg-black/60 rounded-full text-white"><RotateCcw className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
            <Button className="w-full h-12 text-base" onClick={handleProcess}>
              Verificar con IA<ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Hidden inputs */}
        <input ref={frontRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <input ref={backRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

        {error && (
          <div className="mt-4 w-full max-w-sm flex items-center gap-2 p-3 bg-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" /><p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {mounted && isDev && (
        <div className="px-6 pb-4">
          <Button variant="ghost" onClick={handleSkipDev} className="w-full text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10">
            <SkipForward className="w-5 h-5 mr-2" />[DEV] Saltar verificación
          </Button>
        </div>
      )}

      <div className="px-6 pb-8 text-center">
        <p className="text-xs text-white/40">Tu INE se procesa con IA y no se almacena.</p>
      </div>
    </div>
  )
}
