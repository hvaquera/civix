'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

export default function PanelLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [capsLock, setCapsLock] = useState(false)

  // MFA state
  const [showMfa, setShowMfa] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Escribe un correo válido.')
      return
    }

    if (!password) {
      setError('Escribe tu contraseña.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/panel/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión')
        setLoading(false)
        return
      }

      // Si requiere MFA
      if (data.requiresMfa) {
        setShowMfa(true)
        setLoading(false)
        return
      }

      // Guardar info de usuario en localStorage para uso en el panel
      if (data.user) {
        localStorage.setItem('civix_user', JSON.stringify(data.user))
      }

      // Success - redirect to dashboard
      router.push('/panel/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mfaCode.length !== 6) {
      setError('Escribe el código de 6 dígitos.')
      return
    }

    setLoading(true)

    // TODO: Verify MFA
    await new Promise(resolve => setTimeout(resolve, 1000))

    router.push('/panel/dashboard')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState('CapsLock'))
  }

  if (showMfa) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Verificación adicional
              </h1>
              <p className="text-gray-600 text-sm">
                Escribe el código que enviamos a tu correo.
              </p>
            </div>

            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="form-field">
                <label className="form-label">Código de verificación</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  error={!!error}
                  className="text-center text-xl tracking-widest"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
              >
                Verificar y entrar
              </Button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  className="text-sm text-civix-600 hover:underline"
                >
                  Reenviar código
                </button>
                <br />
                <button
                  type="button"
                  onClick={() => {
                    setShowMfa(false)
                    setMfaCode('')
                    setError('')
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cambiar cuenta
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-civix-600 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold">C</span>
            </div>
            <div>
              <span className="text-xl font-bold">GobPanel</span>
              <span className="text-civix-200 text-sm block">CIVIX</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">
            Gestión interna de reportes ciudadanos
          </h1>
          <p className="text-civix-100 text-lg">
            Administra, asigna y resuelve los reportes de tu municipio desde un solo lugar.
          </p>
        </div>
        <p className="text-civix-200 text-sm">
          Acceso exclusivo para personal autorizado del municipio.
        </p>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-civix-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">C</span>
              </div>
              <div className="text-left">
                <span className="text-xl font-bold text-gray-900">GobPanel</span>
                <span className="text-gray-500 text-sm block">CIVIX</span>
              </div>
            </div>
          </div>

          <Card className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Inicia sesión
              </h2>
              <p className="text-gray-600 text-sm">
                Entra con tu correo institucional
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-field">
                <label className="form-label">Correo institucional</label>
                <Input
                  type="email"
                  placeholder="nombre@municipio.gob.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!error && !email}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">Contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Escribe tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    error={!!error && !password}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLock && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Bloq Mayús está activado
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-civix-600 focus:ring-civix-500"
                  />
                  <span className="text-sm text-gray-600">
                    Mantener sesión iniciada
                  </span>
                </label>
                <a href="#" className="text-sm text-civix-600 hover:underline">
                  Olvidé mi contraseña
                </a>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
              >
                Entrar
              </Button>
            </form>

            <p className="mt-6 text-xs text-center text-gray-400">
              Usa solo equipos autorizados. Toda actividad queda registrada.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
