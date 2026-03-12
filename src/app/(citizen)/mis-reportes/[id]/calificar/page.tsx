'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, Star, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const RATING_TAGS = {
  positive: [
    'Rápido',
    'Buena atención',
    'Trabajo de calidad',
    'Buena comunicación',
    'Superó expectativas',
  ],
  negative: [
    'Tardó mucho',
    'Mala atención',
    'Trabajo incompleto',
    'Sin comunicación',
    'No resolvió el problema',
  ],
}

export default function CalificarPage() {
  const router = useRouter()
  const params = useParams()
  
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [requestReview, setRequestReview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const displayRating = hoveredRating || rating
  const isPositive = rating >= 4
  const isNegative = rating > 0 && rating <= 2
  const availableTags = isPositive ? RATING_TAGS.positive : isNegative ? RATING_TAGS.negative : []

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    setLoading(true)

    // TODO: Submit to API
    await new Promise(resolve => setTimeout(resolve, 1500))

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="inline-flex p-4 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Gracias por tu calificación!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Tu opinión nos ayuda a mejorar el servicio del municipio.
          </p>

          {requestReview && (
            <Card className="p-4 mb-6 bg-orange-50 border-orange-200 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Revisión solicitada</p>
                  <p className="text-sm text-orange-700">
                    Tu caso será revisado nuevamente. Te notificaremos cuando haya novedades.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Button size="lg" className="w-full" onClick={() => router.push('/mis-reportes')}>
            Volver a mis reportes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-gray-900">Calificar servicio</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Rating stars */}
        <Card className="p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            ¿Cómo calificarías la atención?
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Tu opinión ayuda a mejorar el servicio.
          </p>

          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => {
                  setRating(value)
                  setSelectedTags([]) // Reset tags when rating changes
                }}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'w-10 h-10 transition-colors',
                    value <= displayRating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-sm font-medium">
              {rating === 1 && 'Muy malo'}
              {rating === 2 && 'Malo'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bueno'}
              {rating === 5 && 'Excelente'}
            </p>
          )}
        </Card>

        {/* Tags */}
        {rating > 0 && availableTags.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              {isPositive ? '¿Qué te gustó?' : '¿Qué podría mejorar?'}
            </p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedTags.includes(tag)
                      ? isPositive
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                        : 'bg-red-100 text-red-700 ring-2 ring-red-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comment */}
        {rating > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario adicional (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos más sobre tu experiencia..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-civix-500 focus:border-transparent resize-none"
            />
          </div>
        )}

        {/* Request review option for low ratings */}
        {isNegative && (
          <Card className="p-4 bg-orange-50 border-orange-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requestReview}
                onChange={(e) => setRequestReview(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <div>
                <p className="font-medium text-orange-800">Solicitar revisión</p>
                <p className="text-sm text-orange-700">
                  Si crees que el problema no fue resuelto correctamente, podemos revisar tu caso nuevamente.
                </p>
              </div>
            </label>
          </Card>
        )}
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t safe-bottom">
        <Button
          size="lg"
          className="w-full"
          disabled={rating === 0}
          loading={loading}
          onClick={handleSubmit}
        >
          Enviar calificación
        </Button>
      </div>
    </div>
  )
}
