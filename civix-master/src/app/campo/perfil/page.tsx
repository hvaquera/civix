'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Users, Target, Calendar, Flame, LogOut, Moon, Type, Bell } from 'lucide-react'
import { toast } from 'sonner'

export default function CampoPerfilPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [realStats, setRealStats] = useState({ total: 0, month: 0, events: 0 })

  useEffect(() => {
    const stored = localStorage.getItem('campo_session')
    if (stored) setSession(JSON.parse(stored))

    // Real stats
    const registros = JSON.parse(localStorage.getItem('campo_registros') || '[]')
    const events = JSON.parse(localStorage.getItem('campo_events') || '[]')
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthCount = registros.filter((r: any) => r.captured_at?.startsWith(monthStart)).length

    setRealStats({
      total: registros.length,
      month: monthCount,
      events: events.filter((e: any) => e.status === 'completed').length,
    })
  }, [])

  const handleLogout = () => {
    const pendingRegistros = JSON.parse(localStorage.getItem('campo_registros') || '[]')
      .filter((r: any) => r.sync_status === 'pending')
    if (pendingRegistros.length > 0) {
      toast.error(`Tienes ${pendingRegistros.length} registros sin enviar. Sincroniza primero.`)
      setShowLogoutModal(false)
      return
    }
    localStorage.removeItem('campo_session')
    localStorage.removeItem('campo_registro_ine')
    localStorage.removeItem('campo_registro_datos')
    localStorage.removeItem('campo_registro_peticion')
    localStorage.removeItem('campo_registro_photos')
    localStorage.removeItem('campo_active_event')
    toast.success('Sesión cerrada')
    router.push('/campo/login')
  }

  const op = session || {
    name: 'Roberto Sánchez',
    role_label: 'Brigadista',
    reports_to: { name: 'Laura Hernández', role: 'Coordinador Seccional' },
    goals: { contacts: 200 },
  }

  const totalForGoal = realStats.total || op.stats?.total_captured || 0
  const goalTarget = op.goals?.contacts || 200
  const goalPct = Math.round((totalForGoal / goalTarget) * 100)

  return (
    <div className="px-4 pt-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-civix-100 rounded-full flex items-center justify-center">
          <User className="w-7 h-7 text-civix-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{op.name}</h1>
          <Badge className="bg-civix-100 text-civix-700">{op.role_label}</Badge>
        </div>
      </div>

      {/* Structure */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-civix-500" />
            Mi estructura
          </h3>
          <div className="text-sm">
            <p className="text-gray-500">Reporto a:</p>
            <p className="font-medium">{op.reports_to.name} <span className="text-gray-400 font-normal">• {op.reports_to.role}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-civix-500" />
            Mis estadísticas
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total registros</span>
              <span className="font-semibold">{totalForGoal}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Este mes</span>
              <span className="font-semibold">{realStats.month}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Eventos completados</span>
              <span className="font-semibold">{realStats.events}</span>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Meta de contactos</span>
                <span className="font-semibold text-civix-600">{goalPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-civix-500 rounded-full" style={{ width: `${Math.min(goalPct, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{totalForGoal} de {goalTarget}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardContent className="p-4 space-y-0">
          <h3 className="font-semibold text-gray-900 mb-3">Configuración</h3>
          {[
            { icon: Type, label: 'Tamaño de texto', value: 'Normal' },
            { icon: Moon, label: 'Modo oscuro', value: 'Off' },
            { icon: Bell, label: 'Notificaciones', value: 'On' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center gap-3 text-sm"><item.icon className="w-4 h-4 text-gray-400" /><span>{item.label}</span></div>
              <span className="text-sm text-gray-500">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowLogoutModal(true)}>
        <LogOut className="w-4 h-4 mr-2" />Cerrar sesión
      </Button>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setShowLogoutModal(false)}>
          <Card className="w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-2">¿Cerrar sesión?</h3>
            <p className="text-sm text-gray-500 mb-4">Si tienes registros sin enviar, se perderán.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowLogoutModal(false)}>Cancelar</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleLogout}>Salir</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
