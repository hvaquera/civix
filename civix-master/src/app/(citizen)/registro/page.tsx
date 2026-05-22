'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Mail, ArrowRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type ContactMethod = 'whatsapp' | 'email' | null

export default function RegistroPage() {
  const router = useRouter()
  const [method, setMethod] = useState<ContactMethod>(null)
  const [contactValue, setContactValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (method === 'whatsapp') {
      const cleaned = contactValue.replace(/\D/g, '')
      if (cleaned.length !== 10) {
        setError('Escribe un número de 10 dígitos.')
        return
      }
    } else if (method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(contactValue)) {
        setError('Escribe un correo válido.')
        return
      }
    }

    setLoading(true)

    try {
      // Call API to send OTP
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          method, 
          contact: method === 'whatsapp' ? contactValue.replace(/\D/g, '') : contactValue 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error enviando código')
        setLoading(false)
        return
      }

      // En desarrollo, mostrar el código en consola
      if (data.devCode) {
        console.log('🔐 Código OTP (dev):', data.devCode)
      }

      // Redirect to verification
      router.push(`/registro/verificar?method=${method}&contact=${encodeURIComponent(contactValue)}`)
    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Atrás</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Cómo te contactamos?
        </h1>
        <p className="text-gray-600 mb-8">
          Te enviaremos un código para verificar tu identidad.
        </p>

        {/* Method selection */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => {
              setMethod('whatsapp')
              setContactValue('')
              setError('')
            }}
            className={cn(
              'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all',
              method === 'whatsapp'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className={cn(
              'p-2 rounded-lg',
              method === 'whatsapp' ? 'bg-green-500' : 'bg-gray-100'
            )}>
              <MessageCircle className={cn(
                'w-5 h-5',
                method === 'whatsapp' ? 'text-white' : 'text-gray-600'
              )} />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">WhatsApp</div>
              <div className="text-sm text-gray-500">Código por mensaje</div>
            </div>
          </button>

          <button
            onClick={() => {
              setMethod('email')
              setContactValue('')
              setError('')
            }}
            className={cn(
              'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all',
              method === 'email'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className={cn(
              'p-2 rounded-lg',
              method === 'email' ? 'bg-blue-500' : 'bg-gray-100'
            )}>
              <Mail className={cn(
                'w-5 h-5',
                method === 'email' ? 'text-white' : 'text-gray-600'
              )} />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Correo electrónico</div>
              <div className="text-sm text-gray-500">Código a tu bandeja</div>
            </div>
          </button>
        </div>

        {/* Contact input */}
        {method && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-field">
              <label className="form-label">
                {method === 'whatsapp' ? 'Tu número de WhatsApp' : 'Tu correo electrónico'}
              </label>
              <Input
                type={method === 'whatsapp' ? 'tel' : 'email'}
                placeholder={method === 'whatsapp' ? '81 1234 5678' : 'tu@correo.com'}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                error={!!error}
                autoFocus
              />
              {error && <p className="form-error">{error}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={!contactValue}
            >
              Enviar código
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </form>
        )}
      </div>

      {/* Footer - with safe area padding */}
      <div className="px-6 pt-4 pb-12 text-center">
        <p className="text-xs text-gray-400">
          Al continuar, aceptas nuestros{' '}
          <a href="/terminos" className="underline">Términos de servicio</a>
          {' '}y{' '}
          <a href="/terminos" className="underline">Aviso de privacidad</a>.
        </p>
      </div>
    </div>
  )
}
