'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

const DEV_USER = {
  id: 'op-001', phone: '8112345678', pin: '123456', name: 'Roberto Sánchez',
  role: 'brigadista', role_label: 'Brigadista',
  territory: { district: 19, section: 1234, colonia: 'Mitras Centro' },
  reports_to: { name: 'Laura Hernández', role: 'Coordinador Seccional' },
  goals: { contacts: 200, supporters: 120 },
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
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    if (phone === DEV_USER.phone && pin === DEV_USER.pin) {
      localStorage.setItem('campo_session', JSON.stringify(DEV_USER))
      router.push('/campo/home')
    } else {
      setError('Teléfono o PIN incorrecto')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-civix-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CIVIX Campo</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresa con tu teléfono y PIN</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono</label>
            <Input type="tel" placeholder="10 dígitos" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">PIN</label>
            <div className="relative">
              <Input type={showPin ? 'text' : 'password'} placeholder="6 dígitos" value={pin} onChange={(e) => setPin(e.target.value)} className="h-12 pr-10" />
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Button className="w-full h-12 text-base" disabled={!phone || !pin || loading} onClick={handleLogin}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </div>
        <p className="text-xs text-gray-400 text-center">Dev: 8112345678 / 123456</p>
      </div>
    </div>
  )
}
