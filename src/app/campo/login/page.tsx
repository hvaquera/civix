'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, MapPin } from 'lucide-react'

const DEV_USER = {
  id: 'op-001', phone: '8112345678', pin: '123456', name: 'Roberto Sánchez',
  role: 'brigadista', role_label: 'Brigadista',
  territory: { district: 19, section: 1234, colonia: 'Mitras Centro' },
  reports_to: { name: 'Laura Hernández', role: 'Coordinador Seccional' },
  goals: { contacts: 200 },
  stats: { total_captured: 87, this_month: 23, events: 5 },
}

export default function CampoLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!phone || !pin) { setError('Completa todos los campos'); return }
    setError(''); setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    if (phone === DEV_USER.phone && pin === DEV_USER.pin) {
      localStorage.setItem('campo_session', JSON.stringify(DEV_USER))
      router.push('/campo/home')
    } else {
      setError('Teléfono o PIN incorrecto')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-civix-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-civix-900/50">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">CIVIX Campo</h1>
            <p className="text-navy-400 text-sm mt-1">Ingresa con tu teléfono y PIN</p>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-navy-400 uppercase tracking-widest mb-1.5">Teléfono</label>
              <Input
                type="tel"
                placeholder="10 dígitos"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="bg-navy-800 border-navy-700 text-white placeholder:text-navy-500 focus:ring-civix-500 focus:bg-navy-800 h-12"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-400 uppercase tracking-widest mb-1.5">PIN</label>
              <div className="relative">
                <Input
                  type={showPin ? 'text' : 'password'}
                  placeholder="6 dígitos"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-navy-800 border-navy-700 text-white placeholder:text-navy-500 focus:ring-civix-500 focus:bg-navy-800 h-12 pr-11"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200 transition-colors p-1"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 px-3 py-2 rounded-xl">{error}</p>
            )}

            <Button
              size="lg"
              className="w-full h-12 mt-2"
              disabled={!phone || !pin || loading}
              loading={loading}
              onClick={handleLogin}
            >
              Ingresar
            </Button>
          </div>

          {/* Offline note */}
          <p className="text-center text-xs text-navy-500 mt-6">
            ¿Sin internet? El modo offline se activa<br />después de tu primer ingreso.
          </p>

          {/* Dev hint */}
          <div className="mt-8 text-center">
            <span className="bg-navy-800 border border-navy-700 rounded-full px-3 py-1.5 text-xs text-navy-400 font-mono">
              Dev: 8112345678 · 123456
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
