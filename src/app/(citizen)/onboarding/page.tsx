'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MapPin, Bell, CheckCircle, ChevronRight, ArrowRight } from 'lucide-react'

const slides = [
  {
    icon: MapPin,
    emoji: '📍',
    title: 'Reporta lo que ves en tu colonia',
    description: 'Baches, alumbrado, basura. Solo una foto y un mensaje, nosotros hacemos el resto.',
    color: 'bg-civix-50',
    iconBg: 'bg-civix-500',
  },
  {
    icon: Bell,
    emoji: '🔔',
    title: 'Te avisamos cada vez que avance',
    description: 'Sabrás exactamente qué área atiende tu reporte y cuándo queda resuelto.',
    color: 'bg-emerald-50',
    iconBg: 'bg-emerald-500',
  },
  {
    icon: CheckCircle,
    emoji: '🏆',
    title: 'Acumula puntos y ve tu impacto',
    description: 'Gana XP por cada reporte. Juntos construimos una ciudad que responde.',
    color: 'bg-amber-50',
    iconBg: 'bg-amber-500',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const slide = slides[current]
  const isLast = current === slides.length - 1

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Skip */}
      <div className="flex justify-end p-5 pt-6">
        <button onClick={() => router.push('/registro')} className="text-sm text-gray-400 font-medium px-2 py-1">
          Saltar
        </button>
      </div>

      {/* Slide */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className={cn('w-24 h-24 rounded-3xl flex items-center justify-center mb-8', slide.iconBg)}>
          <slide.icon className="w-12 h-12 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug max-w-xs">{slide.title}</h1>
        <p className="text-gray-500 text-base leading-relaxed max-w-xs">{slide.description}</p>
      </div>

      {/* Dots + CTA */}
      <div className="px-6 pb-12 space-y-6">
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'rounded-full transition-all',
                i === current ? 'w-6 h-2 bg-civix-500' : 'w-2 h-2 bg-gray-200'
              )}
            />
          ))}
        </div>
        <Button
          size="xl"
          className="w-full"
          onClick={() => isLast ? router.push('/registro') : setCurrent(current + 1)}
        >
          {isLast ? 'Comenzar' : 'Siguiente'}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
