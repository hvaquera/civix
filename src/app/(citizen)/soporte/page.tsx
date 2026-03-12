'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  ChevronLeft, 
  MessageCircle, 
  Mail, 
  FileText,
  Send,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SupportOption = 'whatsapp' | 'email' | 'ticket' | null

export default function SoportePage() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<SupportOption>(null)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleWhatsApp = () => {
    window.open(
      'https://wa.me/528112345678?text=Hola,%20necesito%20ayuda%20con%20CIVIX',
      '_blank'
    )
  }

  const handleEmail = () => {
    window.location.href = 'mailto:soporte@civix.mx?subject=Ayuda%20con%20CIVIX'
  }

  const handleTicketSubmit = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) return

    setLoading(true)
    
    // Simular envío de ticket
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setTicketSubmitted(true)
    setLoading(false)
  }

  if (ticketSubmitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-4 border-b">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Atrás</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="inline-flex p-4 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Ticket enviado!
            </h1>
            <p className="text-gray-600 mb-2">
              Número de ticket: <span className="font-mono font-bold">TKT-{Date.now().toString().slice(-6)}</span>
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Te responderemos en menos de 24 horas por WhatsApp o correo.
            </p>
            <Button onClick={() => router.push('/home')}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
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
            Soporte
          </h1>
          <p className="text-gray-600 mb-6">
            ¿Cómo prefieres contactarnos?
          </p>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {/* WhatsApp */}
            <button
              onClick={() => setSelectedOption('whatsapp')}
              className={cn(
                'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
                selectedOption === 'whatsapp'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className={cn(
                'p-3 rounded-lg',
                selectedOption === 'whatsapp' ? 'bg-green-500' : 'bg-gray-100'
              )}>
                <MessageCircle className={cn(
                  'w-6 h-6',
                  selectedOption === 'whatsapp' ? 'text-white' : 'text-gray-600'
                )} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">WhatsApp</div>
                <div className="text-sm text-gray-500">Respuesta inmediata</div>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                <Clock className="w-3 h-3" />
                &lt; 5 min
              </div>
            </button>

            {/* Email */}
            <button
              onClick={() => setSelectedOption('email')}
              className={cn(
                'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
                selectedOption === 'email'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className={cn(
                'p-3 rounded-lg',
                selectedOption === 'email' ? 'bg-blue-500' : 'bg-gray-100'
              )}>
                <Mail className={cn(
                  'w-6 h-6',
                  selectedOption === 'email' ? 'text-white' : 'text-gray-600'
                )} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Correo electrónico</div>
                <div className="text-sm text-gray-500">Para temas detallados</div>
              </div>
              <div className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                <Clock className="w-3 h-3" />
                &lt; 24 hrs
              </div>
            </button>

            {/* Ticket */}
            <button
              onClick={() => setSelectedOption('ticket')}
              className={cn(
                'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
                selectedOption === 'ticket'
                  ? 'border-civix-500 bg-civix-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className={cn(
                'p-3 rounded-lg',
                selectedOption === 'ticket' ? 'bg-civix-500' : 'bg-gray-100'
              )}>
                <FileText className={cn(
                  'w-6 h-6',
                  selectedOption === 'ticket' ? 'text-white' : 'text-gray-600'
                )} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Crear ticket</div>
                <div className="text-sm text-gray-500">Seguimiento con número</div>
              </div>
              <div className="flex items-center gap-1 text-civix-600 text-xs font-medium">
                <Clock className="w-3 h-3" />
                &lt; 24 hrs
              </div>
            </button>
          </div>

          {/* WhatsApp action */}
          {selectedOption === 'whatsapp' && (
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-sm text-green-800 mb-4">
                Te conectaremos con un agente de soporte por WhatsApp. 
                Horario de atención: Lun-Vie 8am-8pm, Sáb 9am-2pm.
              </p>
              <Button 
                onClick={handleWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Abrir WhatsApp
              </Button>
            </Card>
          )}

          {/* Email action */}
          {selectedOption === 'email' && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-800 mb-4">
                Se abrirá tu app de correo con nuestra dirección. 
                Describe tu problema con el mayor detalle posible.
              </p>
              <Button 
                onClick={handleEmail}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-5 h-5 mr-2" />
                Abrir correo
              </Button>
            </Card>
          )}

          {/* Ticket form */}
          {selectedOption === 'ticket' && (
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Nuevo ticket de soporte
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto
                  </label>
                  <Input
                    placeholder="Ej: No puedo ver mis reportes"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Describe tu problema
                  </label>
                  <textarea
                    placeholder="Cuéntanos qué está pasando con el mayor detalle posible..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-civix-500 focus:border-transparent resize-none"
                  />
                </div>

                <Button
                  onClick={handleTicketSubmit}
                  disabled={!ticketSubject.trim() || !ticketMessage.trim()}
                  loading={loading}
                  className="w-full"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Enviar ticket
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Recibirás un número de ticket y te responderemos por WhatsApp o correo.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Footer - FAQ link */}
      <div className="p-6 border-t bg-gray-50">
        <p className="text-sm text-gray-600 text-center">
          ¿Buscas respuestas rápidas?{' '}
          <button 
            onClick={() => router.push('/ayuda')}
            className="text-civix-600 font-medium hover:underline"
          >
            Ver preguntas frecuentes
          </button>
        </p>
      </div>
    </div>
  )
}
