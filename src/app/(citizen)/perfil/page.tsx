'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, MapPin, Bell, Shield, HelpCircle, FileText, ChevronRight, LogOut, Phone, Mail, CheckCircle, Settings, Star, Flame, Trophy, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const mockUser = {
  name: 'Juan García López', contact_method: 'whatsapp', contact_value: '8112345678',
  colonia: 'Centro', municipio: 'Monterrey', estado: 'Nuevo León',
  seccion_electoral: '1234', verified: true,
  reports_count: 5, resolved_count: 3,
  xp: 320, level: 3, streak: 5, rank: 12,
  badges: ['Primer reporte', 'Participante activo', 'Colonia limpia'],
}

const menuSections = [
  {
    title: 'Mi cuenta',
    items: [
      { icon: Phone, label: 'Método de contacto', desc: 'WhatsApp · ****5678', href: null },
      { icon: MapPin, label: 'Domicilio verificado', desc: 'Centro, Monterrey', href: null },
    ],
  },
  {
    title: 'Preferencias',
    items: [
      { icon: Bell, label: 'Notificaciones', desc: 'Configura alertas', href: '/notificaciones' },
      { icon: Shield, label: 'Privacidad', desc: 'Controla tus datos', href: '/privacidad' },
    ],
  },
  {
    title: 'Soporte',
    items: [
      { icon: HelpCircle, label: 'Preguntas frecuentes', desc: 'Respuestas rápidas', href: '/ayuda' },
      { icon: Settings, label: 'Contactar soporte', desc: 'WhatsApp, correo o ticket', href: '/soporte' },
      { icon: FileText, label: 'Términos y privacidad', desc: null, href: '/terminos' },
    ],
  },
]

export default function PerfilPage() {
  const router = useRouter()
  const [showLogout, setShowLogout] = useState(false)

  const xpPct = Math.round(((mockUser.xp % 500) / 500) * 100)
  const xpNext = 500 - (mockUser.xp % 500)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero */}
      <div className="bg-navy-900 px-5 pt-12 pb-6">
        <h1 className="text-xl font-bold text-white mb-4">Mi perfil</h1>

        {/* User card */}
        <Card className="shadow-none border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-civix-100 rounded-2xl flex items-center justify-center">
                <User className="w-7 h-7 text-civix-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-gray-900">{mockUser.name}</h2>
                  {mockUser.verified && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-400 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />{mockUser.colonia}, {mockUser.municipio}
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Rango</p>
                <p className="text-sm font-bold text-civix-600">#{mockUser.rank}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="bg-gray-50 rounded-xl p-2.5">
                <p className="text-xl font-bold text-gray-900">{mockUser.reports_count}</p>
                <p className="text-xs text-gray-400">Reportes</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5">
                <p className="text-xl font-bold text-emerald-600">{mockUser.resolved_count}</p>
                <p className="text-xs text-gray-400">Resueltos</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <p className="text-xl font-bold text-amber-600">{mockUser.streak}</p>
                </div>
                <p className="text-xs text-gray-400">Días racha</p>
              </div>
            </div>

            {/* XP bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1 text-civix-600 font-semibold">
                  <Star className="w-3.5 h-3.5" />Nivel {mockUser.level} · {mockUser.xp} XP
                </div>
                <span className="text-gray-400">{xpNext} XP para nivel {mockUser.level + 1}</span>
              </div>
              <div className="progress-thin">
                <div className="progress-thin-fill" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-semibold text-gray-700">Mis logros</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {mockUser.badges.map((b) => (
            <span key={b} className="xp-badge">
              <Trophy className="w-3 h-3" />{b}
            </span>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className="px-4 mt-4 space-y-3">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="section-label mb-2 px-1">{section.title}</p>
            <Card className="overflow-hidden">
              <div className="divide-y divide-gray-50">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => item.href && router.push(item.href)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  >
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      {item.desc && <p className="text-xs text-gray-400 truncate">{item.desc}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        ))}

        <Card className="overflow-hidden">
          <button
            onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors text-left"
          >
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-600">Cerrar sesión</p>
          </button>
        </Card>

        <p className="text-center text-xs text-gray-300 pt-2">CIVIX v2.0.0</p>
      </div>

      {/* Logout modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">¿Cerrar sesión?</h3>
                <button onClick={() => setShowLogout(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-5">Tendrás que volverte a verificar para usar la app.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="md" className="flex-1" onClick={() => setShowLogout(false)}>Cancelar</Button>
                <Button variant="destructive" size="md" className="flex-1" onClick={() => router.push('/onboarding')}>Salir</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
