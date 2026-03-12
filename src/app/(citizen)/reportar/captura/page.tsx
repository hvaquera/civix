'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  ChevronLeft, 
  Camera, 
  Mic, 
  MicOff,
  MapPin, 
  X, 
  Plus,
  Play,
  Pause,
  Trash2,
  Navigation,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

export default function ReportarCapturaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoria = searchParams.get('categoria') || 'otro'

  // Form state
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(true)
  const [locationError, setLocationError] = useState('')
  const [address, setAddress] = useState('')
  const [reference, setReference] = useState('')
  const [mounted, setMounted] = useState(false)

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const photoInputRef = useRef<HTMLInputElement>(null)

  // Mount and get location
  useEffect(() => {
    setMounted(true)
    getLocation()
    
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const getLocation = () => {
    setLocationLoading(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocation(coords)
        
        // Reverse geocode usando Nominatim (gratis)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } }
          )
          const data = await response.json()
          
          if (data.address) {
            const addr = data.address
            const street = addr.road || addr.street || ''
            const number = addr.house_number || ''
            const colonia = addr.neighbourhood || addr.suburb || ''
            const city = addr.city || addr.town || addr.municipality || ''
            
            const parts = [
              street && number ? `${street} ${number}` : street,
              colonia,
              city
            ].filter(Boolean)
            
            setAddress(parts.join(', ') || 'Ubicación obtenida')
          } else {
            setAddress('Ubicación obtenida')
          }
        } catch (err) {
          console.log('Geocode error:', err)
          setAddress('Ubicación obtenida')
        }
        
        setLocationLoading(false)
      },
      (error) => {
        console.log('Geolocation error:', error)
        let errorMsg = 'No pudimos obtener tu ubicación.'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Permiso de ubicación denegado. Activa el GPS en configuración.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Ubicación no disponible. Verifica tu conexión.'
            break
          case error.TIMEOUT:
            errorMsg = 'Tiempo agotado. Intenta de nuevo.'
            break
        }
        
        setLocationError(errorMsg)
        setLocationLoading(false)
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000,
        maximumAge: 60000 // Cache por 1 minuto
      }
    )
  }

  // Photo handling
  const handlePhotoCapture = () => {
    photoInputRef.current?.click()
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (photos.length >= 5) return

      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotos((prev) => {
          if (prev.length >= 5) return prev
          return [...prev, reader.result as string]
        })
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  // Audio recording
  const startRecording = async () => {
    setAudioError('')
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      
      streamRef.current = stream
      
      // Check for supported mime types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err: any) {
      console.error('Audio error:', err)
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setAudioError('Permiso de micrófono denegado. Actívalo en configuración.')
      } else if (err.name === 'NotFoundError') {
        setAudioError('No se encontró micrófono en tu dispositivo.')
      } else {
        setAudioError('No pudimos acceder al micrófono.')
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const deleteAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setIsPlaying(false)
  }

  const togglePlayAudio = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Validation - always show button, just disable if not valid
  const canContinue = (description.trim().length > 0 || audioBlob || photos.length > 0) && (location || !locationLoading)

  const handleContinue = () => {
    // Save data to localStorage for the confirm page
    const reportData = {
      categoria,
      description,
      photos,
      audioBlob: audioBlob ? true : false,
      location,
      address,
      reference,
      timestamp: Date.now()
    }
    
    localStorage.setItem('civix_report_draft', JSON.stringify({
      ...reportData,
      photos: photos // Keep photos in localStorage
    }))
    
    router.push(`/reportar/confirmar?categoria=${categoria}`)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-civix-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">{CATEGORY_LABELS[categoria]}</h1>
            <p className="text-sm text-gray-500">Paso 2 de 3</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-6 pb-40">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe el problema
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntanos qué está pasando y dónde exactamente..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-civix-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              También puedes grabar un audio o solo subir fotos.
            </p>
          </div>

          {/* Audio recording */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje de voz (opcional)
            </label>
            
            {audioError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg mb-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{audioError}</p>
              </div>
            )}
            
            {!audioBlob ? (
              <Card className={cn(
                'p-4 flex items-center justify-center gap-4',
                isRecording && 'bg-red-50 border-red-200'
              )}>
                {isRecording ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={stopRecording}
                    >
                      <MicOff className="w-4 h-4 mr-1" />
                      Detener
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={startRecording}
                    className="w-full"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Grabar audio
                  </Button>
                )}
              </Card>
            ) : (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayAudio}
                    className="p-2 bg-civix-100 rounded-full text-civix-600"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-civix-500 w-1/3" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(recordingTime)}</p>
                  </div>
                  <button
                    onClick={deleteAudio}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPlaying(false)} />
              </Card>
            )}
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotos (opcional)
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {photos.length < 5 && (
                <button
                  onClick={handlePhotoCapture}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Agregar</span>
                </button>
              )}
            </div>
            
            <p className="text-xs text-gray-400 mt-2">
              Máximo 5 fotos. JPG, PNG o HEIC.
            </p>
            
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación del problema
            </label>
            
            <Card className="p-4">
              {locationLoading ? (
                <div className="flex items-center gap-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Obteniendo ubicación...</span>
                </div>
              ) : locationError ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">{locationError}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={getLocation}>
                    <Navigation className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              ) : location ? (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-civix-100 rounded-lg flex-shrink-0">
                    <MapPin className="w-5 h-5 text-civix-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{address}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={getLocation} className="flex-shrink-0">
                    Actualizar
                  </Button>
                </div>
              ) : null}
            </Card>
            
            <p className="text-xs text-gray-400 mt-2">
              Asegúrate de estar cerca del problema para una ubicación precisa.
            </p>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencia (opcional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: Frente al Oxxo de la esquina"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-civix-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Fixed bottom button - always visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="p-4 pb-12">
          <Button
            size="lg"
            className="w-full"
            disabled={!canContinue}
            onClick={handleContinue}
          >
            Continuar
          </Button>
          {/* Always reserve space for help text to prevent layout jump */}
          <p className={cn(
            "text-xs text-center mt-2 h-4",
            canContinue ? "text-transparent" : "text-gray-400"
          )}>
            {!location && !locationLoading && !locationError 
              ? 'Esperando ubicación...'
              : 'Agrega una descripción, audio o foto para continuar.'}
          </p>
        </div>
      </div>
    </div>
  )
}
