'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Shield, 
  Eye,
  MapPin,
  Database,
  Trash2,
  Download,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrivacySettings {
  shareLocation: boolean
  publicProfile: boolean
  analyticsEnabled: boolean
}

export default function PrivacidadPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<PrivacySettings>({
    shareLocation: true,
    publicProfile: false,
    analyticsEnabled: true,
  })
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('civix_privacy_settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading settings:', e)
      }
    }
  }, [])

  const handleToggle = (key: keyof PrivacySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    localStorage.setItem('civix_privacy_settings', JSON.stringify(newSettings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDownloadData = () => {
    // Simulate data download
    const userData = {
      profile: JSON.parse(localStorage.getItem('civix_citizen') || '{}'),
      reports: JSON.parse(localStorage.getItem('civix_my_reports') || '[]'),
      settings: {
        notifications: JSON.parse(localStorage.getItem('civix_notification_settings') || '{}'),
        privacy: settings,
      },
      exportDate: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `civix-mis-datos-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteAccount = () => {
    // Clear all local data
    localStorage.removeItem('civix_citizen')
    localStorage.removeItem('civix_my_reports')
    localStorage.removeItem('civix_notification_settings')
    localStorage.removeItem('civix_privacy_settings')
    localStorage.removeItem('civix_ine_data')
    localStorage.removeItem('civix_report_draft')
    
    // Redirect to onboarding
    router.push('/onboarding')
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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Privacidad</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Privacy controls */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 px-1 mb-2">Control de datos</h2>
          <Card className="divide-y">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Compartir ubicación</p>
                  <p className="text-sm text-gray-500">Para geolocalizar tus reportes</p>
                </div>
              </div>
              <Toggle enabled={settings.shareLocation} onToggle={() => handleToggle('shareLocation')} />
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Perfil público</p>
                  <p className="text-sm text-gray-500">Otros usuarios pueden ver tu nombre</p>
                </div>
              </div>
              <Toggle enabled={settings.publicProfile} onToggle={() => handleToggle('publicProfile')} />
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Análisis de uso</p>
                  <p className="text-sm text-gray-500">Ayúdanos a mejorar la app</p>
                </div>
              </div>
              <Toggle enabled={settings.analyticsEnabled} onToggle={() => handleToggle('analyticsEnabled')} />
            </div>
          </Card>
        </div>

        {/* Data management */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 px-1 mb-2">Tus datos</h2>
          <Card className="divide-y">
            <button 
              onClick={handleDownloadData}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5 text-civix-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Descargar mis datos</p>
                <p className="text-sm text-gray-500">Exporta tu información en formato JSON</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
            
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <p className="font-medium text-red-600">Eliminar mi cuenta</p>
                <p className="text-sm text-gray-500">Borra todos tus datos permanentemente</p>
              </div>
            </button>
          </Card>
        </div>

        {/* Legal links */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 px-1 mb-2">Documentos legales</h2>
          <Card className="divide-y">
            <a 
              href="/terminos" 
              className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="flex-1 font-medium text-gray-900">Aviso de privacidad</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            <a 
              href="/terminos" 
              className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="flex-1 font-medium text-gray-900">Términos de uso</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
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

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              ¿Eliminar tu cuenta?
            </h3>
            <p className="text-sm text-center text-gray-600 mb-6">
              Esta acción es permanente. Se borrarán todos tus datos, reportes y configuraciones.
            </p>
            <div className="space-y-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDeleteAccount}
              >
                Sí, eliminar mi cuenta
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
