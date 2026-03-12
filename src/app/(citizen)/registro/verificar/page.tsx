'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function VerificarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const method = searchParams.get('method')
  const contact = searchParams.get('contact')

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(60)
  const [verified, setVerified] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pastedData.split('').forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit
    })
    setOtp(newOtp)
    
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleVerify = async (code: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, contact, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Código incorrecto')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        setLoading(false)
        return
      }

      // Guardar info en localStorage
      if (data.citizen) {
        localStorage.setItem('civix_citizen', JSON.stringify(data.citizen))
      }

      setVerified(true)
      setTimeout(() => {
        // Si necesita verificar INE, ir a esa pantalla
        if (data.needsINE) {
          router.push('/registro/ine')
        } else {
          // Si ya está verificado, ir al home
          router.push('/home')
        }
      }, 1500)
    } catch (err) {
      console.error('Verify error:', err)
      setError('Error de conexión. Intenta de nuevo.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }

    setLoading(false)
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setResendTimer(60)
    setOtp(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
  }

  const maskedContact = method === 'whatsapp' 
    ? `****${contact?.slice(-4) || '****'}`
    : contact?.replace(/^(.{2}).*(@.*)$/, '$1****$2') || '****'

  if (verified) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex p-4 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Verificado!
          </h1>
          <p className="text-gray-600">
            Ahora verifica tu INE para completar el registro.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Atrás</span>
        </button>
      </div>

      <div className="flex-1 px-6 pt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Escribe el código
        </h1>
        <p className="text-gray-600 mb-8">
          Enviamos un código de 6 dígitos a{' '}
          <span className="font-medium">{maskedContact}</span>
        </p>

        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              className={cn(
                'w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-colors',
                'focus:outline-none focus:border-civix-500',
                error ? 'border-red-300 bg-red-50' : 'border-gray-200',
                loading && 'opacity-50'
              )}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-red-600 text-sm mb-4">{error}</p>
        )}

        {loading && (
          <p className="text-center text-civix-600 text-sm mb-4">
            Verificando...
          </p>
        )}

        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-gray-500">
              ¿No llegó? Puedes reenviar en {resendTimer}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm text-civix-600 font-medium hover:underline"
            >
              Reenviar código
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pt-4 pb-12 text-center">
        <button
          onClick={() => router.push('/registro')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cambiar método de contacto
        </button>
      </div>
    </div>
  )
}
