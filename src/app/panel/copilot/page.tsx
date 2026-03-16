'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Send, Loader2, Database, Sparkles, Mic, MicOff, ChevronDown, BarChart3, AlertTriangle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sql?: string | null
  data?: any[] | null
  timestamp: Date
}

const SUGGESTIONS = [
  { icon: '📊', text: '¿Cuántos contactos tenemos por sección?', category: 'datos' },
  { icon: '🎯', text: '¿Cuáles son las colonias con más indecisos?', category: 'estrategia' },
  { icon: '📋', text: 'Dame un reporte de avance general de la campaña', category: 'reporte' },
  { icon: '🏘️', text: '¿Cuál es la penetración por sección?', category: 'territorial' },
  { icon: '⚠️', text: '¿Hay anomalías o patrones inusuales en los datos?', category: 'anomalias' },
  { icon: '🎤', text: 'Genera un brief para visitar la sección 1234', category: 'discurso' },
  { icon: '👥', text: '¿Qué temas pide más la gente por zona?', category: 'peticiones' },
  { icon: '📈', text: '¿Cuántos simpatizantes duros vs indecisos tenemos?', category: 'datos' },
]

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSQL, setShowSQL] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Build history for context
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.role === 'user' ? m.content : m.content,
      }))

      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })

      const data = await res.json()

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || data.error || 'Sin respuesta',
        sql: data.sql,
        data: data.data,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Error de conexión. Intenta de nuevo.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const renderDataTable = (data: any[]) => {
    if (!data || data.length === 0) return null
    const keys = Object.keys(data[0]).slice(0, 6) // Max 6 columns
    return (
      <div className="mt-3 overflow-auto max-h-64 rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {keys.map(k => (
                <th key={k} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((row, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                {keys.map(k => (
                  <td key={k} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{String(row[k] ?? '—')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 20 && (
          <div className="text-xs text-gray-400 text-center py-1 bg-gray-50">
            Mostrando 20 de {data.length} resultados
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Copilot Electoral</h1>
            <p className="text-sm text-gray-500">Pregunta lo que sea sobre tu campaña — IA con acceso total a los datos</p>
          </div>
          <Badge className="ml-auto bg-green-100 text-green-700">
            <Database className="w-3 h-3 mr-1" /> Conectado a BD
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">¿En qué te ayudo hoy?</h2>
            <p className="text-sm text-gray-400 mb-6 text-center max-w-md">
              Puedo consultar todos los datos de tu campaña, generar reportes, detectar anomalías y darte recomendaciones estratégicas.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.text)}
                  className="flex items-start gap-2 p-3 text-left bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-sm"
                >
                  <span className="text-lg shrink-0">{s.icon}</span>
                  <span className="text-gray-700">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[80%] rounded-2xl px-4 py-3', 
              msg.role === 'user' ? 'bg-civix-500 text-white' : 'bg-white border border-gray-200 shadow-sm')}>
              
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-purple-600">Copilot</span>
                </div>
              )}

              <div className={cn('text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user' ? 'text-white' : 'text-gray-700')}>
                {msg.content.split('**').map((part, i) => 
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
              </div>

              {/* Data table — only show if >1 row and looks like tabular data */}
              {msg.data && msg.data.length > 1 && msg.data.length <= 50 && (
                <details className="mt-3">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                    📋 Ver tabla de datos ({msg.data.length} registros)
                  </summary>
                  {renderDataTable(msg.data)}
                </details>
              )}

              {/* Actions row */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      const content = msg.content
                      const blob = new Blob([`CIVIX Copilot Electoral - Reporte\nFecha: ${new Date().toLocaleDateString('es-MX')}\n\n${content}`], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url; a.download = `copilot-reporte-${new Date().toISOString().slice(0,10)}.txt`
                      a.click(); URL.revokeObjectURL(url)
                    }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    📄 Exportar
                  </button>
                  {msg.sql && (
                    <button
                      onClick={() => setShowSQL(showSQL === msg.id ? null : msg.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <Database className="w-3 h-3" />
                      {showSQL === msg.id ? 'Ocultar SQL' : 'Ver SQL'}
                    </button>
                  )}
                </div>
              )}
              {showSQL === msg.id && msg.sql && (
                <pre className="mt-2 p-2 bg-gray-900 text-green-400 text-xs rounded-lg overflow-auto max-h-32">
                  {msg.sql}
                </pre>
              )}

              <div className={cn('text-xs mt-1', msg.role === 'user' ? 'text-civix-200' : 'text-gray-300')}>
                {msg.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-purple-600">Copilot</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-sm text-gray-500">Consultando datos...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white px-6 py-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre tu campaña..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
              disabled={loading}
            />
            <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          </div>
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="bg-purple-600 hover:bg-purple-700 h-12 px-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          El Copilot tiene acceso a toda la base de datos de tu campaña • Solo consulta, nunca modifica datos
        </p>
      </div>
    </div>
  )
}
