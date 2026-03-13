'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Camera, RotateCcw, Check, AlertCircle, SkipForward, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type CaptureStep = 'front' | 'back' | 'processing' | 'review'

export default function INECapturePage() {
  const router = useRouter()
  const [step, setStep] = useState<CaptureStep>('front')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Detectar si estamos en el cliente (evita hydration mismatch)
  useEffect(() => {
    setMounted(true)
  }, [])

  // En desarrollo, permitir saltar verificación INE
  const isDev = mounted && typeof window !== 'undefined' && window.location.hostname === 'localhost'

  const handleSkipDev = () => {
    localStorage.setItem('civix_citizen', JSON.stringify({
      id: 'dev-citizen-001',
      contactVerified: true,
      ineVerified: true,
      status: 'active',
      name: 'Usuario Demo',
      colonia: 'Centro',
      municipio: 'Monterrey',
    }))
    router.push('/home')
  }

  // Abrir selector de archivo
  const handleUploadFile = () => {
    fileInputRef.current?.click()
  }

  // Abrir cámara directamente
  const handleOpenCamera = () => {
    cameraInputRef.current?.click()
  }

  // Comprimir imagen para que no exceda 4MB (límite Claude es 5MB)
  const compressImage = (file: File, maxSizeMB: number = 4): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          
          // Reducir dimensiones si es muy grande
          const maxDimension = 1600
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension
              width = maxDimension
            } else {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Empezar con calidad alta e ir bajando si es necesario
          let quality = 0.8
          let base64 = canvas.toDataURL('image/jpeg', quality)
          
          // Reducir calidad hasta que esté bajo el límite
          while (base64.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.1) {
            quality -= 0.1
            base64 = canvas.toDataURL('image/jpeg', quality)
          }
          
          console.log(`[INE] Imagen comprimida: ${(base64.length / 1024 / 1024).toFixed(2)}MB, calidad: ${quality.toFixed(1)}`)
          resolve(base64)
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Verificar que sea imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor sube una imagen (JPG, PNG). Los PDFs no son soportados.')
      return
    }

    try {
      // Comprimir imagen antes de procesarla
      const compressedBase64 = await compressImage(file)
      handleImageCaptured(compressedBase64)
    } catch (err) {
      console.error('Error comprimiendo imagen:', err)
      setError('Error procesando la imagen. Intenta de nuevo.')
    }
    
    e.target.value = ''
  }

  const handleImageCaptured = (base64: string) => {
    setError('')
    if (step === 'front') {
      setFrontImage(base64)
      setStep('back')
    } else if (step === 'back') {
      setBackImage(base64)
      processImages(frontImage!, base64)
    }
  }

  const processImages = async (front: string, back: string) => {
    setStep('processing')
    setProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/ocr/ine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          frontImage: front,
          backImage: back
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (isDev) {
          console.log('[DEV] OCR falló, usando datos simulados:', data)
          localStorage.setItem('civix_ine_data', JSON.stringify({
            nombre: 'Usuario Demo',
            colonia: 'Centro',
            municipio: 'Monterrey',
            cp: '64000',
          }))
          router.push('/registro/confirmar')
          return
        }
        throw new Error(data.error || 'Error procesando INE')
      }

      // Guardar datos extraídos del OCR real
      if (data.data) {
        const ineData = data.data
        console.log('[INE] Datos recibidos del OCR:', ineData)
        
        // Construir nombre completo si hay apellidos separados
        let nombreCompleto = ineData.nombre || ''
        if (ineData.apellido_paterno) {
          nombreCompleto += ' ' + ineData.apellido_paterno
        }
        if (ineData.apellido_materno) {
          nombreCompleto += ' ' + ineData.apellido_materno
        }
        nombreCompleto = nombreCompleto.trim()
        
        const datosParaGuardar = {
          nombre: nombreCompleto,
          colonia: ineData.colonia,
          municipio: ineData.municipio,
          cp: ineData.codigo_postal,
          seccion: ineData.seccion,
          calle: ineData.calle,
          numero: ineData.numero_exterior,
        }
        
        console.log('[INE] Guardando en localStorage:', datosParaGuardar)
        localStorage.setItem('civix_ine_data', JSON.stringify(datosParaGuardar))
      } else {
        console.warn('[INE] No se recibieron datos del OCR')
      }

      router.push('/registro/confirmar')
    } catch (err) {
      console.error('INE processing error:', err)
      
      if (isDev) {
        console.log('[DEV] Error en OCR, continuando con datos mock')
        localStorage.setItem('civix_ine_data', JSON.stringify({
          nombre: 'Usuario Demo',
          colonia: 'Centro', 
          municipio: 'Monterrey',
          cp: '64000',
        }))
        router.push('/registro/confirmar')
        return
      }

      setError('No pudimos procesar tu INE. Asegúrate de subir una imagen clara.')
      setStep('front')
      setFrontImage(null)
      setBackImage(null)
    } finally {
      setProcessing(false)
    }
  }

  const handleRetake = () => {
    if (step === 'back') {
      setStep('front')
      setFrontImage(null)
    }
    setError('')
  }

  const getInstructions = () => {
    if (step === 'front') {
      return {
        title: 'Frente de tu INE',
        description: 'Toma una foto clara del frente de tu credencial.',
        tips: ['Buena luz', 'Sin reflejos', 'Completa'],
      }
    }
    if (step === 'back') {
      return {
        title: 'Reverso de tu INE',
        description: 'Ahora toma la foto del reverso.',
        tips: ['Mismo encuadre', 'Sin dedos', 'Nítida'],
      }
    }
    return {
      title: 'Procesando...',
      description: 'Estamos leyendo los datos de tu INE con IA.',
      tips: [],
    }
  }

  const instructions = getInstructions()

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center w-full max-w-xs mx-auto">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 w-20 h-20 border-4 border-civix-200 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-civix-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Procesando tu INE
          </h1>
          <p className="text-gray-600">
            Nuestra IA está leyendo tus datos...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center text-white/80 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Atrás</span>
        </button>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              frontImage 
                ? 'bg-green-500 text-white' 
                : step === 'front' 
                  ? 'bg-civix-500 text-white ring-2 ring-civix-300' 
                  : 'bg-white/20 text-white/50'
            )}>
              {frontImage ? '✓' : '1'}
            </div>
            <div className={cn(
              'w-6 h-0.5',
              frontImage ? 'bg-green-500' : 'bg-white/20'
            )} />
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              backImage 
                ? 'bg-green-500 text-white' 
                : step === 'back' 
                  ? 'bg-civix-500 text-white ring-2 ring-civix-300' 
                  : 'bg-white/20 text-white/50'
            )}>
              {backImage ? '✓' : '2'}
            </div>
          </div>
        </div>
      </div>

      {/* Step label */}
      <div className="px-6 mb-2">
        <span className={cn(
          'inline-block px-3 py-1 rounded-full text-xs font-medium',
          step === 'front' ? 'bg-civix-500/20 text-civix-300' : 'bg-purple-500/20 text-purple-300'
        )}>
          {step === 'front' ? 'Paso 1 de 2' : 'Paso 2 de 2'}
        </span>
      </div>

      {/* Instructions */}
      <div className="px-6 py-2 text-center">
        <h1 className="text-xl font-bold text-white mb-2">
          {instructions.title}
        </h1>
        <p className="text-white/70 text-sm">
          {instructions.description}
        </p>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="relative w-full max-w-sm aspect-[1.586] bg-white/10 rounded-2xl border-2 border-dashed border-white/30 overflow-hidden">
          {/* Preview of captured image */}
          {((step === 'front' && frontImage) || (step === 'back' && backImage)) ? (
            <>
              <img
                src={step === 'front' ? frontImage! : backImage!}
                alt="INE preview"
                className="w-full h-full object-cover"
              />
              {/* Success overlay */}
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                <div className="bg-green-500 rounded-full p-3">
                  <Check className="w-8 h-8 text-white" />
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/50">
                <Camera className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Selecciona una opción abajo</p>
              </div>
            </div>
          )}

          {/* Corner guides - only show if no image */}
          {!((step === 'front' && frontImage) || (step === 'back' && backImage)) && (
            <>
              <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-white/50 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-white/50 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-white/50 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-white/50 rounded-br-lg" />
            </>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="px-6 py-2">
        <div className="flex justify-center gap-4">
          {instructions.tips.map((tip, i) => (
            <div key={i} className="flex items-center gap-1.5 text-white/60 text-xs">
              <Check className="w-3 h-3" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-6 mb-4">
          <div className="flex items-center gap-2 p-3 bg-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6 space-y-3">
        {step === 'back' && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleRetake}
            className="w-full bg-transparent border-white/30 text-white hover:bg-white/10"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Retomar frente
          </Button>
        )}
        
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={handleOpenCamera}
            className="flex-1"
          >
            <Camera className="w-5 h-5 mr-2" />
            Tomar foto
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleUploadFile}
            className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10"
          >
            <Upload className="w-5 h-5 mr-2" />
            Subir archivo
          </Button>
        </div>
      </div>

      {/* Dev skip button - solo renderiza en cliente */}
      {mounted && isDev && (
        <div className="px-6 pb-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={handleSkipDev}
            className="w-full text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
          >
            <SkipForward className="w-5 h-5 mr-2" />
            [DEV] Saltar verificación INE
          </Button>
        </div>
      )}

      {/* Hidden file input - para subir archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden camera input - para tomar foto */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Privacy note - with extra padding for safe area */}
      <div className="px-6 pt-2 pb-12 text-center">
        <p className="text-xs text-white/40">
          Tu INE se procesa con IA de forma segura y no se almacena.
        </p>
      </div>
    </div>
  )
}
