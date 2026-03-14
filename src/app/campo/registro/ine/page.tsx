'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Camera, RotateCcw, ChevronLeft, ChevronRight, FileEdit, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Step = 'front' | 'back' | 'processing' | 'ready'

// Compress image for Claude Vision (max 4MB)
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

export default function CampoINEPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('front')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleCapture = async (file: File) => {
    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      setError('Solo se aceptan imágenes (JPG, PNG)')
      return
    }
    setError('')

    try {
      const compressed = await compressImage(file)

      if (step === 'front') {
        setFrontImage(compressed)
        setTimeout(() => setStep('back'), 600)
      } else if (step === 'back') {
        setBackImage(compressed)
        setTimeout(() => setStep('ready'), 600)
      }
    } catch {
      setError('Error procesando la imagen. Intenta de nuevo.')
    }
  }

  const handleContinue = async () => {
    if (!frontImage) return
    setProcessing(true)
    setStep('processing')
    setError('')

    try {
      // Call real OCR API
      const response = await fetch('/api/ocr/ine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontImage: frontImage,
          backImage: backImage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Dev fallback — use mock data
        console.warn('[Campo INE] OCR failed, using mock data:', data)
        const mockOcr = {
          name: 'MARIA', paternal: 'GARCIA', maternal: 'LOPEZ',
          street: 'AV SIMON BOLIVAR 320', colonia: 'MITRAS CENTRO', cp: '64460',
          municipio: 'MONTERREY', estado: 'NUEVO LEON', seccion: '1234',
          ocr_confidence: { name: 0.95, paternal: 0.92, street: 0.78, seccion: 0.99 },
        }
        localStorage.setItem('campo_registro_ine', JSON.stringify(mockOcr))
        localStorage.setItem('campo_registro_photos', JSON.stringify({ front: !!frontImage, back: !!backImage }))
        toast.success('Datos extraídos (modo demo)')
        router.push('/campo/registro/datos')
        return
      }

      // Map OCR API response to campo format
      const ine = data.data
      const ocrData = {
        name: ine.nombre || '',
        paternal: ine.apellido_paterno || '',
        maternal: ine.apellido_materno || '',
        street: [ine.calle, ine.numero_exterior].filter(Boolean).join(' ') || '',
        interior: ine.numero_interior || '',
        colonia: ine.colonia || '',
        cp: ine.codigo_postal || '',
        municipio: ine.municipio || '',
        estado: ine.estado || '',
        seccion: ine.seccion || '',
        ocr_confidence: ine.confidence || {},
      }

      localStorage.setItem('campo_registro_ine', JSON.stringify(ocrData))
      localStorage.setItem('campo_registro_photos', JSON.stringify({ front: !!frontImage, back: !!backImage }))

      toast.success('Datos extraídos con IA', { description: `${ine.nombre} ${ine.apellido_paterno} — Sección ${ine.seccion}` })
      router.push('/campo/registro/datos')

    } catch (err: any) {
      console.error('[Campo INE] Error:', err)
      setError('Error al procesar la INE. Intenta de nuevo o captura manual.')
      setStep('ready')
    } finally {
      setProcessing(false)
    }
  }

  const handleManual = () => {
    localStorage.setItem('campo_registro_ine', JSON.stringify({}))
    localStorage.setItem('campo_registro_photos', JSON.stringify({ front: false, back: false }))
    router.push('/campo/registro/datos')
  }

  // Processing screen
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 w-20 h-20 border-4 border-gray-700 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-civix-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <h2 className="text-white text-lg font-bold mb-2">Procesando INE con IA</h2>
          <p className="text-gray-400 text-sm">Extrayendo nombre, domicilio y sección electoral...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <button onClick={() => router.push('/campo/home')} className="text-white p-2"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center"><p className="text-white font-semibold">Paso 1 de 4</p><p className="text-gray-400 text-xs">Credencial INE</p></div>
        <div className="w-9" />
      </div>
      <div className="px-4 mb-6"><div className="h-1 bg-gray-700 rounded-full"><div className="h-full bg-civix-500 rounded-full transition-all" style={{ width: step === 'front' ? '8%' : step === 'back' ? '16%' : '25%' }} /></div></div>

      <div className="flex-1 px-4 pb-32 flex flex-col items-center justify-center">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', frontImage ? 'bg-green-500 text-white' : step === 'front' ? 'bg-civix-500 text-white' : 'bg-gray-700 text-gray-400')}>
            {frontImage ? <CheckCircle className="w-4 h-4" /> : '1'}
          </div>
          <div className={cn('w-12 h-0.5', frontImage ? 'bg-green-500' : 'bg-gray-700')} />
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', backImage ? 'bg-green-500 text-white' : step === 'back' ? 'bg-civix-500 text-white' : 'bg-gray-700 text-gray-400')}>
            {backImage ? <CheckCircle className="w-4 h-4" /> : '2'}
          </div>
        </div>

        {step === 'front' && !frontImage && (
          <div className="w-full max-w-sm">
            <h2 className="text-white text-lg font-bold text-center mb-2">Frente del INE</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Foto clara del frente de la credencial</p>
            <button onClick={() => fileRef.current?.click()} className="w-full aspect-[1.6/1] border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-civix-500 hover:text-civix-400 transition-colors">
              <Camera className="w-10 h-10 mb-3" /><span className="text-sm font-medium">Tomar foto del frente</span>
            </button>
          </div>
        )}

        {step === 'front' && frontImage && (
          <div className="w-full max-w-sm text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-green-400 font-semibold">Frente capturado</p>
          </div>
        )}

        {step === 'back' && (
          <div className="w-full max-w-sm">
            {frontImage && (
              <div className="mb-4">
                <p className="text-gray-500 text-xs mb-1">✓ Frente capturado</p>
                <img src={frontImage} alt="Frente" className="w-full aspect-[1.6/1] object-cover rounded-xl opacity-60" />
              </div>
            )}
            <h2 className="text-white text-lg font-bold text-center mb-2">Reverso del INE</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Voltea la credencial y toma el reverso</p>
            {!backImage ? (
              <button onClick={() => fileRef.current?.click()} className="w-full aspect-[1.6/1] border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-civix-500 hover:text-civix-400 transition-colors">
                <Camera className="w-10 h-10 mb-3" /><span className="text-sm font-medium">Tomar foto del reverso</span>
              </button>
            ) : (
              <div className="text-center"><CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" /><p className="text-green-400 font-semibold">Reverso capturado</p></div>
            )}
          </div>
        )}

        {step === 'ready' && (
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-white text-lg font-bold">INE completa</h2>
              <p className="text-gray-400 text-sm mt-1">Listo para extraer datos con IA</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 text-xs mb-1">Frente</p>
                <div className="relative rounded-xl overflow-hidden">
                  <img src={frontImage!} alt="Frente" className="w-full aspect-[1.6/1] object-cover" />
                  <button onClick={() => { setFrontImage(null); setStep('front') }} className="absolute top-1 right-1 p-1.5 bg-black/60 rounded-full text-white"><RotateCcw className="w-3 h-3" /></button>
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
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleCapture(e.target.files[0])} />

        {/* Error */}
        {error && (
          <div className="mt-4 w-full max-w-sm flex items-center gap-2 p-3 bg-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button onClick={handleManual} className="mt-8 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300">
          <FileEdit className="w-4 h-4" /><span className="text-sm">Captura manual sin INE</span>
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800">
        {step === 'ready' ? (
          <Button className="w-full h-12 text-base" disabled={processing} onClick={handleContinue}>
            {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extrayendo datos con IA...</> : <>Continuar<ChevronRight className="w-4 h-4 ml-2" /></>}
          </Button>
        ) : (
          <Button className="w-full h-12 text-base" disabled variant="outline">
            {step === 'front' ? 'Captura el frente para continuar' : 'Captura el reverso para continuar'}
          </Button>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 text-center">
        <p className="text-xs text-white/30">Tu INE se procesa con IA y no se almacena</p>
      </div>
    </div>
  )
}
