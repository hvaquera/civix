'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronRight, MapPin, Bell, CheckCircle } from 'lucide-react'

const slides = [
  {
    icon: MapPin,
    title: 'Reporta problemas en tu colonia',
    description: 'Baches, alumbrado, basura... Solo toma una foto y nosotros nos encargamos.',
    color: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: Bell,
    title: 'Recibe actualizaciones',
    description: 'Te avisamos cuando tu reporte avance y cuando esté resuelto.',
    color: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    icon: CheckCircle,
    title: 'Ve el impacto',
    description: 'Tu voz importa. Juntos hacemos que el municipio responda.',
    color: 'bg-green-100',
    iconColor: 'text-green-600',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      // Mark onboarding as seen and go to registro
      router.push('/registro')
    }
  }

  const handleSkip = () => {
    router.push('/registro')
  }

  const slide = slides[currentSlide]
  const isLast = currentSlide === slides.length - 1

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Skip button */}
      <div className="flex justify-end p-4 pt-6">
        <button
          onClick={handleSkip}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
        >
          Saltar
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <div className={`inline-flex p-6 rounded-full ${slide.color} mb-8`}>
              <slide.icon className={`w-16 h-16 ${slide.iconColor}`} />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-balance">
              {slide.title}
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-lg leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              index === currentSlide ? 'bg-civix-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Action button - with extra padding for safe area */}
      <div className="px-6 pt-4 pb-12">
        <Button
          onClick={handleNext}
          size="lg"
          className="w-full"
        >
          {isLast ? 'Comenzar' : 'Siguiente'}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  )
}
