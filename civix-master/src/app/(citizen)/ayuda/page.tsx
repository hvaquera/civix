'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronDown, MessageCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const faqs = [
  {
    category: 'Cuenta y registro',
    items: [
      {
        question: '¿Por qué necesito verificar mi INE?',
        answer: 'Verificamos tu INE para asegurar que los reportes vengan de ciudadanos reales de Monterrey. Solo extraemos tu nombre, colonia y municipio - nunca guardamos tu CURP, clave de elector ni foto de tu INE.'
      },
      {
        question: '¿Mis datos están seguros?',
        answer: 'Sí. Tus datos personales están encriptados y nunca los compartimos con terceros. Solo usamos tu ubicación general (colonia) para dirigir tu reporte al área correcta del municipio.'
      },
      {
        question: '¿Puedo usar la app si no vivo en Monterrey?',
        answer: 'Actualmente CIVIX solo está disponible para ciudadanos con domicilio verificado en el municipio de Monterrey. Pronto expandiremos a más municipios del área metropolitana.'
      },
    ]
  },
  {
    category: 'Reportes',
    items: [
      {
        question: '¿Qué tipo de problemas puedo reportar?',
        answer: 'Puedes reportar baches, alumbrado público, basura, fugas de agua, banquetas dañadas, semáforos, parques en mal estado, y otros problemas de infraestructura pública.'
      },
      {
        question: '¿Cuánto tiempo tardan en resolver mi reporte?',
        answer: 'El tiempo varía según el tipo de problema. Problemas urgentes como fugas de agua se atienden en 24-48 horas. Reparaciones mayores como baches pueden tomar 1-2 semanas. Siempre te notificamos el avance.'
      },
      {
        question: '¿Puedo reportar de forma anónima?',
        answer: 'Tu nombre no se muestra públicamente, pero el municipio sí puede ver quién hizo el reporte para darte seguimiento. No ofrecemos reportes completamente anónimos.'
      },
      {
        question: '¿Qué pasa si mi reporte no se resuelve?',
        answer: 'Si pasan más de 30 días sin resolución, tu reporte se escala automáticamente a un supervisor. También puedes contactar soporte directamente.'
      },
    ]
  },
  {
    category: 'Notificaciones',
    items: [
      {
        question: '¿Cómo me entero del avance de mi reporte?',
        answer: 'Te enviamos notificaciones por WhatsApp o correo (según elegiste) cada vez que hay un cambio de estado en tu reporte: recibido, en proceso, resuelto.'
      },
      {
        question: '¿Puedo desactivar las notificaciones?',
        answer: 'Sí, puedes configurar qué notificaciones recibir desde tu perfil en la sección de Notificaciones.'
      },
    ]
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-medium text-gray-900 pr-4">{question}</span>
        <ChevronDown className={cn(
          'w-5 h-5 text-gray-400 flex-shrink-0 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>
      {isOpen && (
        <p className="pb-4 text-gray-600 text-sm leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  )
}

export default function AyudaPage() {
  const router = useRouter()

  const handleContactWhatsApp = () => {
    window.open('https://wa.me/528112345678?text=Hola,%20necesito%20ayuda%20con%20CIVIX', '_blank')
  }

  const handleContactEmail = () => {
    window.location.href = 'mailto:soporte@civix.mx?subject=Ayuda%20con%20CIVIX'
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Atrás</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ayuda
          </h1>
          <p className="text-gray-600 mb-6">
            Encuentra respuestas a las preguntas más comunes.
          </p>

          {/* FAQ Sections */}
          {faqs.map((section) => (
            <div key={section.category} className="mb-6">
              <h2 className="text-sm font-semibold text-civix-600 uppercase tracking-wide mb-3">
                {section.category}
              </h2>
              <div className="bg-gray-50 rounded-xl px-4">
                {section.items.map((item) => (
                  <FAQItem key={item.question} {...item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="p-6 border-t bg-gray-50">
        <p className="text-sm text-gray-600 text-center mb-4">
          ¿No encontraste lo que buscabas?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleContactWhatsApp}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleContactEmail}
          >
            <Mail className="w-4 h-4 mr-2" />
            Correo
          </Button>
        </div>
      </div>
    </div>
  )
}
