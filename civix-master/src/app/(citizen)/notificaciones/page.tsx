'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Bell, 
  MessageSquare, 
  Mail,
  Megaphone,
  CheckCircle,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationSettings {
  reportUpdates: boolean
  newFeatures: boolean
  communityAlerts: boolean
  emailDigest: boolean
  pushEnabled: boolean
}

export default function NotificacionesPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<NotificationSettings>({
    reportUpdates: true,
    newFeatures: true,
    communityAlerts: false,
    emailDigest: false,
    pushEnabled: true,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('civix_notification_settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading settings:', e)
      }
    }
  }, [])

  const handleToggle = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    localStorage.setItem('civix_notification_settings', JSON.stringify(newSettings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={cn(
        'relative w-12 h-7 rounded-full transition-colors',
        enabled ? 'bg-civix-500' : 'bg-gray-300'
      )}
    >
      <span
        className={cn(
          'absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform',
          enabled ? 'left-6' : 'left-1'
        )}
      />
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Notificaciones</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Push notifications */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-civix-100 rounded-lg">
                <Bell className="w-5 h-5 text-civix-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Notificaciones push</p>
                <p className="text-sm text-gray-500">Recibe alertas en tu dispositivo</p>
              </div>
            </div>
            <Toggle enabled={settings.pushEnabled} onToggle={() => handleToggle('pushEnabled')} />
          </div>
          
          {!settings.pushEnabled && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Sin notificaciones push no recibirás alertas en tiempo real sobre tus reportes.
              </p>
            </div>
          )}
        </Card>

        {/* Notification types */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 px-1 mb-2">Tipos de notificación</h2>
          <Card className="divide-y">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Actualizaciones de reportes</p>
                  <p className="text-sm text-gray-500">Cuando hay cambios en tus reportes</p>
                </div>
              </div>
              <Toggle enabled={settings.reportUpdates} onToggle={() => handleToggle('reportUpdates')} />
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Alertas comunitarias</p>
                  <p className="text-sm text-gray-500">Problemas reportados en tu zona</p>
                </div>
              </div>
              <Toggle enabled={settings.communityAlerts} onToggle={() => handleToggle('communityAlerts')} />
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Novedades</p>
                  <p className="text-sm text-gray-500">Nuevas funciones y mejoras</p>
                </div>
              </div>
              <Toggle enabled={settings.newFeatures} onToggle={() => handleToggle('newFeatures')} />
            </div>
          </Card>
        </div>

        {/* Email */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 px-1 mb-2">Correo electrónico</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Resumen semanal</p>
                  <p className="text-sm text-gray-500">Recibe un email con el estado de tus reportes</p>
                </div>
              </div>
              <Toggle enabled={settings.emailDigest} onToggle={() => handleToggle('emailDigest')} />
            </div>
          </Card>
        </div>
      </div>

      {/* Save indicator */}
      {saved && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Guardado</span>
        </div>
      )}
    </div>
  )
}
