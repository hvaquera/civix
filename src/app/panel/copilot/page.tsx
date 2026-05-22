'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Send, Loader2, Database, Sparkles, ChevronDown, MessageSquare, AlertTriangle, X, Shield, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sql?: string | null
  data?: any[] | null
  timestamp: Date
}

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'insight'
  icon: string
  title: string
  description: string
  action: string
}

type Tab = 'chat' | 'tower' | 'simulator'

const CHAT_SUGGESTIONS = [
  { icon: '📊', text: '¿Cuántos contactos tenemos por sección?' },
  { icon: '🎯', text: '¿Cuáles son las colonias con más indecisos?' },
  { icon: '📋', text: 'Dame un reporte de avance general' },
  { icon: '🏘️', text: '¿Cuál es la penetración por sección?' },
  { icon: '🎤', text: 'Brief para visitar sección 1234' },
  { icon: '👥', text: '¿Qué temas pide más la gente?' },
]

const SIMULATOR_SUGGESTIONS = [
  { icon: '🎰', text: 'Si convierto al 30% de indecisos, ¿cuántos votos gano?' },
  { icon: '📈', text: 'Si triplico mi operación en zona sur, ¿qué impacto tiene?' },
  { icon: '⚔️', text: 'Si el oponente gana donde no estoy, ¿pierdo?' },
  { icon: '🏆', text: '¿Cuántos contactos necesito para ser competitivo?' },
  { icon: '🗳️', text: '¿Cuántos votos necesito para ganar Monterrey?' },
  { icon: '💰', text: '¿Cuál es el costo por voto estimado con esta operación?' },
]

const ALERT_STYLES = {
  critical: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  warning: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  insight: { bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
}

export default function CopilotPage() {
  const [tab, setTab] = useState<Tab>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSQL, setShowSQL] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadAlerts() }, [])

  const loadAlerts = async () => {
    setAlertsLoading(true)
    try {
      const res = await fetch('/api/copilot/alerts')
      const data = await res.json()
      setAlerts(data.alerts || [])
    } catch { setAlerts([]) }
    setAlertsLoading(false)
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    // Switch to chat tab when sending a message
    setTab('chat')
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }])
    setInput('')
    setLoading(true)
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/copilot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: data.answer || data.error || 'Sin respuesta',
        sql: data.sql, data: data.data, timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '❌ Error de conexión.', timestamp: new Date() }])
    } finally { setLoading(false); inputRef.current?.focus() }
  }

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id))
  const criticalCount = visibleAlerts.filter(a => a.type === 'critical').length
  const warningCount = visibleAlerts.filter(a => a.type === 'warning').length

  const renderDataTable = (data: any[]) => {
    if (!data || data.length === 0) return null
    const keys = Object.keys(data[0]).slice(0, 6)
    return (
      <div className="mt-3 overflow-auto max-h-64 rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>{keys.map(k => <th key={k} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{k}</th>)}</tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((row, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                {keys.map(k => <td key={k} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{String(row[k] ?? '—')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Left sidebar — tabs */}
      <div className="w-56 bg-gray-50 border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Copilot</p>
              <p className="text-[10px] text-gray-500">Electoral IA</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <button onClick={() => setTab('chat')}
            className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all',
              tab === 'chat' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100')}>
            <MessageSquare className="w-4 h-4" />
            Chat IA
          </button>

          <button onClick={() => setTab('tower')}
            className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all',
              tab === 'tower' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100')}>
            <Shield className="w-4 h-4" />
            Torre de Control
            {(criticalCount + warningCount) > 0 && (
              <span className={cn('ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                criticalCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white')}>
                {criticalCount + warningCount}
              </span>
            )}
          </button>

          <button onClick={() => setTab('simulator')}
            className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all',
              tab === 'simulator' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100')}>
            <BarChart3 className="w-4 h-4" />
            Simulador
          </button>
        </nav>

        <div className="p-3 border-t">
          <Badge className="bg-green-100 text-green-700 text-[10px] w-full justify-center">
            <Database className="w-3 h-3 mr-1" /> BD Conectada
          </Badge>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* === CHAT TAB === */}
        {tab === 'chat' && (
          <>
            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                  <Sparkles className="w-12 h-12 text-purple-300 mb-4" />
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">¿En qué te ayudo?</h2>
                  <p className="text-sm text-gray-400 mb-6 text-center max-w-md">
                    Consultas, reportes y análisis sobre tu campaña.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                    {CHAT_SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s.text)}
                        className="flex items-start gap-2 p-3 text-left bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-xs">
                        <span className="text-base shrink-0">{s.icon}</span>
                        <span className="text-gray-700">{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[80%] rounded-2xl px-4 py-3',
                    msg.role === 'user' ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 shadow-sm')}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-medium text-purple-600">Copilot</span>
                      </div>
                    )}
                    <div className={cn('text-sm leading-relaxed whitespace-pre-wrap', msg.role === 'user' ? 'text-white' : 'text-gray-700')}>
                      {msg.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                    </div>
                    {msg.data && msg.data.length > 1 && (
                      <details className="mt-3"><summary className="text-xs text-gray-400 cursor-pointer">📋 Ver datos ({msg.data.length})</summary>{renderDataTable(msg.data)}</details>
                    )}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                        <button onClick={() => {
                          const blob = new Blob([`CIVIX Copilot\n${new Date().toLocaleDateString('es-MX')}\n\n${msg.content}`], { type: 'text/plain' })
                          const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                          a.download = `copilot-${new Date().toISOString().slice(0,10)}.txt`; a.click()
                        }} className="text-xs text-gray-400 hover:text-gray-600">📄 Exportar</button>
                        {msg.sql && <button onClick={() => setShowSQL(showSQL === msg.id ? null : msg.id)} className="text-xs text-gray-400 hover:text-gray-600"><Database className="w-3 h-3 inline mr-1" />{showSQL === msg.id ? 'Ocultar' : 'Ver'} SQL</button>}
                      </div>
                    )}
                    {showSQL === msg.id && msg.sql && <pre className="mt-2 p-2 bg-gray-900 text-green-400 text-xs rounded-lg overflow-auto max-h-32">{msg.sql}</pre>}
                    <div className={cn('text-[10px] mt-1', msg.role === 'user' ? 'text-civix-200' : 'text-gray-300')}>
                      {msg.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-500">Consultando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t bg-white px-6 py-3">
              <div className="flex gap-3">
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                  placeholder="Pregunta lo que sea sobre tu campaña..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={loading} />
                <Button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                  className="bg-purple-600 hover:bg-purple-700 h-12 px-6">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* === TOWER TAB === */}
        {tab === 'tower' && (
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-4 border-b bg-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                Torre de Control
              </h2>
              <p className="text-sm text-gray-500">Alertas inteligentes detectadas automáticamente por IA</p>
            </div>

            <div className="px-6 py-4 space-y-3">
              {alertsLoading ? (
                <div className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Analizando datos...</p>
                </div>
              ) : visibleAlerts.length === 0 ? (
                <div className="text-center py-10">
                  <Shield className="w-10 h-10 text-green-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Sin alertas activas. Todo en orden.</p>
                </div>
              ) : (
                visibleAlerts.map((alert) => {
                  const style = ALERT_STYLES[alert.type]
                  return (
                    <Card key={alert.id} className={cn('border', style.bg)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0">{alert.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-800">{alert.title}</p>
                              <Badge className={cn('text-xs', style.badge)}>
                                {alert.type === 'critical' ? 'Crítico' : alert.type === 'warning' ? 'Atención' : 'Insight'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
                            <div className="flex items-center gap-3">
                              <Button size="sm" variant="outline" className="text-xs h-7"
                                onClick={() => sendMessage(alert.action)}>
                                <Sparkles className="w-3 h-3 mr-1" /> Analizar con IA
                              </Button>
                              <span className="text-xs text-gray-400">Acción: {alert.action}</span>
                            </div>
                          </div>
                          <button onClick={() => setDismissedAlerts(prev => new Set(prev).add(alert.id))}
                            className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}

              <button onClick={loadAlerts} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2">
                Actualizar alertas
              </button>
            </div>
          </div>
        )}

        {/* === SIMULATOR TAB === */}
        {tab === 'simulator' && (
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-4 border-b bg-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Simulador Electoral
              </h2>
              <p className="text-sm text-gray-500">Escenarios hipotéticos basados en datos reales de Monterrey 2024</p>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-blue-600">963K</p><p className="text-xs text-gray-500">Lista Nominal MTY</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600">572K</p><p className="text-xs text-gray-500">Votaron en 2024</p></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-purple-600">214K</p><p className="text-xs text-gray-500">Votos ganador 2024</p></CardContent></Card>
              </div>

              <p className="text-sm text-gray-600 mb-4">Haz click en un escenario y el Copilot calculará el resultado basado en tus datos actuales:</p>

              <div className="grid grid-cols-2 gap-3">
                {SIMULATOR_SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s.text)}
                    className="flex items-start gap-3 p-4 text-left bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all">
                    <span className="text-2xl shrink-0">{s.icon}</span>
                    <span className="text-sm text-purple-800 font-medium">{s.text}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-2">O escribe tu propio escenario:</p>
                <div className="flex gap-2">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input) } }}
                    placeholder="¿Qué pasaría si...?"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <Button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                    className="bg-purple-600 hover:bg-purple-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
