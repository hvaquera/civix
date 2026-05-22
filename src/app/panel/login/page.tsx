'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'

export default function PanelLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMfa, setShowMfa] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Escribe un correo válido.'); return }
    if (!password) { setError('Escribe tu contraseña.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/panel/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); setLoading(false); return }
      if (data.requiresMfa) { setShowMfa(true); setLoading(false); return }
      if (data.user) localStorage.setItem('civix_user', JSON.stringify(data.user))
      router.push('/panel/dashboard')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const handleDevLogin = () => {
    localStorage.setItem('civix_user', JSON.stringify({ name: 'María López', role: 'admin_municipal', municipality: 'Monterrey' }))
    router.push('/panel/dashboard')
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-civix-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-civix-900/40">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Panel de Gestión</h1>
          <p className="text-navy-400 text-sm mt-1">CIVIX · Monterrey</p>
        </div>

        <div className="bg-navy-800/50 border border-navy-700 rounded-2xl p-6 backdrop-blur-sm">
          {!showMfa ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-400 uppercase tracking-widest mb-1.5">Correo institucional</label>
                <Input
                  type="email"
                  placeholder="tu.nombre@municipio.gob.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-navy-900/60 border-navy-700 text-white placeholder:text-navy-600 focus:bg-navy-900 h-11"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-400 uppercase tracking-widest mb-1.5">Contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-navy-900/60 border-navy-700 text-white placeholder:text-navy-600 focus:bg-navy-900 h-11 pr-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-300 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-900 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <Button size="lg" className="w-full h-11" loading={loading} type="submit">
                Iniciar sesión
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-white text-sm text-center">Ingresa el código de 6 dígitos enviado a tu dispositivo</p>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-navy-900/60 border-navy-700 text-white text-center text-xl tracking-widest h-14"
                maxLength={6}
              />
              <Button size="lg" className="w-full h-11" onClick={() => router.push('/panel/dashboard')}>
                Verificar
              </Button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-navy-700 text-center">
            <button onClick={handleDevLogin} className="text-xs text-navy-500 hover:text-navy-300 transition-colors font-mono">
              Dev: acceso directo →
            </button>
          </div>
        </div>

        <p className="text-center text-navy-600 text-xs mt-6">CIVIX © 2025 · Acceso exclusivo para personal municipal</p>
      </div>
    </div>
  )
}
