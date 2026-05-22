'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Bell, MessageCircle, CheckCircle, Clock, Info, Wifi, WifiOff, Send, Bot, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

const notifSettings = [
  { key: 'reportUpdates', icon: Bell, label: 'Actualizaciones de reportes', desc: 'Cuando hay cambios en tus reportes', enabled: true },
  { key: 'communityAlerts', icon: Info, label: 'Alertas comunitarias', desc: 'Problemas en tu zona', enabled: false },
  { key: 'newFeatures', icon: Bell, label: 'Novedades', desc: 'Nuevas funciones', enabled: true },
]

const waMessages = [
  { id: '1', from: 'bot', time: '10:32', text: '👋 Hola Juan. Tu reporte CIV-00123 sobre *Baches* en Av. Constitución fue recibido. Folio: CIV-00123.' },
  { id: '2', from: 'bot', time: '10:32', text: '¿Deseas recibir actualizaciones cuando avance? Responde *SÍ* o *NO*.' },
  { id: '3', from: 'user', time: '10:33', text: 'Sí' },
  { id: '4', from: 'bot', time: '10:33', text: '✅ Perfecto. Te avisaremos a este número cuando el área de Servicios Públicos atienda tu reporte.' },
  { id: '5', from: 'bot', time: '14:15', text: '🔧 Actualización: Tu reporte CIV-00123 fue *asignado a Juan Pérez* de Servicios Públicos. Tiempo estimado: 48 hrs.' },
  { id: '6', from: 'user', time: '14:20', text: '¿Cuándo lo van a arreglar?' },
  { id: '7', from: 'bot', time: '14:20', text: 'El equipo tiene programada la atención entre mañana y el lunes. Te avisaré cuando quede resuelto. 🙌' },
  { id: '8', from: 'bot', time: 'Hoy 9:01', text: '✅ ¡Listo! Tu reporte CIV-00123 fue marcado como *Resuelto*. ¿Quedó bien atendido? Responde *1* Sí / *2* No / *3* Regular' },
]

type Tab = 'notifs' | 'whatsapp'

export default function NotificacionesPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('notifs')
  const [settings, setSettings] = useState({ reportUpdates: true, communityAlerts: false, newFeatures: true, pushEnabled: true })
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(waMessages)

  const toggle = (key: string) => setSettings(prev => ({ ...prev, [key]: !(prev as any)[key] }))

  const sendMsg = () => {
    if (!input.trim()) return
    const newMsg = { id: String(Date.now()), from: 'user', time: 'Ahora', text: input }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: String(Date.now() + 1), from: 'bot', time: 'Ahora',
        text: 'Gracias por tu mensaje. Un agente lo revisará pronto. También puedes escribir *ESTADO* para ver el status de tu reporte.'
      }])
    }, 800)
  }

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className={cn('toggle-track w-11 h-6', enabled ? 'bg-civix-500' : 'bg-gray-200')}>
      <span className={cn('toggle-thumb', enabled ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button onClick={() => router.back()} className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">Notificaciones</h1>
        </div>
        {/* Tabs */}
        <div className="flex px-4 gap-4 border-t border-gray-50">
          {[
            { key: 'notifs' as Tab, label: 'Configuración', icon: Bell },
            { key: 'whatsapp' as Tab, label: 'WhatsApp Bot', icon: MessageCircle },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key ? 'border-civix-500 text-civix-600' : 'border-transparent text-gray-400'
              )}
            >
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'notifs' ? (
        <div className="p-4 space-y-4">
          {/* Push master toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-civix-50 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-civix-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Notificaciones push</p>
                    <p className="text-xs text-gray-400">Alertas en tu dispositivo</p>
                  </div>
                </div>
                <Toggle enabled={settings.pushEnabled} onToggle={() => toggle('pushEnabled')} />
              </div>
            </CardContent>
          </Card>

          <p className="section-label px-1">Tipos</p>
          <Card className="divide-y divide-gray-50">
            {notifSettings.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <Toggle enabled={(settings as any)[item.key]} onToggle={() => toggle(item.key)} />
              </div>
            ))}
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* WhatsApp bot header */}
          <div className="bg-emerald-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">CIVIX Bot</p>
              <p className="text-emerald-100 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />En línea</p>
            </div>
            <div className="ml-auto flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
              <Phone className="w-3 h-3 text-white" />
              <span className="text-white text-xs">Simulado</span>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
            <p className="text-center text-xs text-gray-400 my-2">Esta es una simulación del bot de WhatsApp</p>
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex', msg.from === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.from === 'bot' && (
                  <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center mr-1.5 flex-shrink-0 self-end">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-3.5 py-2.5',
                  msg.from === 'user'
                    ? 'bg-civix-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                )}>
                  <p className="text-sm leading-snug" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*(.*?)\*/g, '<strong>$1</strong>') }} />
                  <p className={cn('text-xs mt-1', msg.from === 'user' ? 'text-civix-200' : 'text-gray-400')}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-100 p-3 flex items-center gap-2">
            <input
              className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-civix-500"
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
            />
            <button
              onClick={sendMsg}
              disabled={!input.trim()}
              className="w-10 h-10 bg-civix-500 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
