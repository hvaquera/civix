'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  MapPin, 
  Bell, 
  Shield, 
  HelpCircle,
  FileText,
  ChevronRight,
  LogOut,
  Phone,
  Mail,
  CheckCircle,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock user data
const mockUser = {
  name: 'Juan',
  last_name_1: 'García',
  last_name_2: 'López',
  contact_method: 'whatsapp',
  contact_value: '8112345678',
  colonia: 'Centro',
  municipio: 'Monterrey',
  estado: 'Nuevo León',
  seccion_electoral: '1234',
  verified: true,
  reports_count: 5,
  resolved_count: 3,
}

interface MenuItemProps {
  icon: any
  label: string
  description?: string
  onClick?: () => void
  href?: string
  badge?: string
  danger?: boolean
}

function MenuItem({ icon: Icon, label, description, onClick, badge, danger }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left',
        danger && 'text-red-600'
      )}
    >
      <div className={cn(
        'p-2 rounded-lg',
        danger ? 'bg-red-100' : 'bg-gray-100'
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium',
          danger ? 'text-red-600' : 'text-gray-900'
        )}>
          {label}
        </p>
        {description && (
          <p className="text-sm text-gray-500 truncate">{description}</p>
        )}
      </div>
      {badge && (
        <Badge variant="info" className="mr-2">{badge}</Badge>
      )}
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </button>
  )
}

export default function PerfilPage() {
  const router = useRouter()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    // TODO: Clear session
    router.push('/onboarding')
  }

  const maskedContact = mockUser.contact_method === 'whatsapp'
    ? `****${mockUser.contact_value.slice(-4)}`
    : mockUser.contact_value.replace(/^(.{2}).*(@.*)$/, '$1****$2')

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-civix-600 text-white px-6 pt-12 pb-8">
        <h1 className="text-xl font-bold mb-6">Mi perfil</h1>
        
        {/* User card */}
        <Card className="bg-white text-gray-900 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-civix-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-civix-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">
                  {mockUser.name} {mockUser.last_name_1}
                </h2>
                {mockUser.verified && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{mockUser.colonia}, {mockUser.municipio}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-civix-600">{mockUser.reports_count}</p>
              <p className="text-xs text-gray-500">Reportes creados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{mockUser.resolved_count}</p>
              <p className="text-xs text-gray-500">Resueltos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Menu sections */}
      <div className="px-4 py-4 space-y-4">
        {/* Account section */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-medium text-gray-500">Mi cuenta</h3>
          </div>
          <div className="divide-y">
            <MenuItem
              icon={mockUser.contact_method === 'whatsapp' ? Phone : Mail}
              label="Método de contacto"
              description={`${mockUser.contact_method === 'whatsapp' ? 'WhatsApp' : 'Correo'} • ${maskedContact}`}
              onClick={() => {}}
            />
            <MenuItem
              icon={MapPin}
              label="Domicilio verificado"
              description={`${mockUser.colonia}, ${mockUser.municipio}`}
              onClick={() => {}}
            />
          </div>
        </Card>

        {/* Preferences section */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-medium text-gray-500">Preferencias</h3>
          </div>
          <div className="divide-y">
            <MenuItem
              icon={Bell}
              label="Notificaciones"
              description="Configura cómo te avisamos"
              onClick={() => router.push('/notificaciones')}
            />
            <MenuItem
              icon={Shield}
              label="Privacidad"
              description="Controla tus datos"
              onClick={() => router.push('/privacidad')}
            />
          </div>
        </Card>

        {/* Support section */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-medium text-gray-500">Soporte</h3>
          </div>
          <div className="divide-y">
            <MenuItem
              icon={HelpCircle}
              label="Preguntas frecuentes"
              description="Respuestas rápidas"
              onClick={() => router.push('/ayuda')}
            />
            <MenuItem
              icon={Settings}
              label="Contactar soporte"
              description="WhatsApp, correo o ticket"
              onClick={() => router.push('/soporte')}
            />
            <MenuItem
              icon={FileText}
              label="Términos y privacidad"
              onClick={() => router.push('/terminos')}
            />
          </div>
        </Card>

        {/* Logout */}
        <Card className="overflow-hidden">
          <MenuItem
            icon={LogOut}
            label="Cerrar sesión"
            onClick={() => setShowLogoutConfirm(true)}
            danger
          />
        </Card>

        {/* Version */}
        <p className="text-center text-xs text-gray-400 pt-4">
          CIVIX v0.1.0
        </p>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 animate-slide-in-from-bottom">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Cerrar sesión?
            </h3>
            <p className="text-gray-600 mb-6">
              Tendrás que volver a verificarte para usar la app.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
