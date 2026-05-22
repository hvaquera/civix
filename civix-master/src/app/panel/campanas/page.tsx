'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Phone, Users, Send, Loader2, Sparkles, CheckCircle, BarChart3, Mic, RefreshCw, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'whatsapp' | 'voice' | 'history'
type Step = 'select' | 'message' | 'preview' | 'sent'

export default function CampanasPage() {
  const [tab, setTab] = useState<Tab>('whatsapp')
  const [step, setStep] = useState<Step>('select')
  const [segments, setSegments] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selectedSegment, setSelectedSegment] = useState('')
  const [message, setMessage] = useState('')
  const [generatingMsg, setGeneratingMsg] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const [sentResult, setSentResult] = useState<any>(null)
  const [voiceConfig, setVoiceConfig] = useState<any>(null)
  const [selectedVoice, setSelectedVoice] = useState('maria')
  const [questions, setQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/campanas')
      .then(r => r.json())
      .then(d => {
        setSegments(d.segments || [])
        setCampaigns(d.past_campaigns || [])
      })
      .finally(() => setLoading(false))

    fetch('/api/campanas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'voice_config' }),
    }).then(r => r.json()).then(d => {
      setVoiceConfig(d)
      setQuestions(d.default_questions || [])
    })
  }, [])

  const generateAIMessage = async () => {
    setGeneratingMsg(true)
    try {
      const channel = tab === 'whatsapp' ? 'WhatsApp' : 'llamada telefónica con bot de voz'
      const segLabel = segments.find(s => s.key === selectedSegment)?.label || selectedSegment
      const res = await fetch('/api/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_message', segment: segLabel, channel }),
      })
      const data = await res.json()
      setMessage(data.message || '')
    } catch {}
    setGeneratingMsg(false)
  }

  const loadPreview = async () => {
    const res = await fetch('/api/campanas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'preview', segment: selectedSegment, channel: tab }),
    })
    const data = await res.json()
    setPreview(data)
    setStep('preview')
  }

  const sendCampaign = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', segment: selectedSegment, channel: tab, customMessage: message }),
      })
      const data = await res.json()
      setSentResult(data)
      setStep('sent')
    } catch {}
    setSending(false)
  }

  const resetFlow = () => {
    setStep('select')
    setSelectedSegment('')
    setMessage('')
    setPreview(null)
    setSentResult(null)
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Campañas de Contacto</h1>
            <p className="text-sm text-gray-500">WhatsApp masivo y bots de voz con IA</p>
          </div>
          <Badge className="ml-auto bg-yellow-100 text-yellow-700 text-xs">DEMO — No envía mensajes reales</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-1">
          {[
            { id: 'whatsapp' as Tab, label: 'WhatsApp', icon: MessageSquare, color: 'text-green-600' },
            { id: 'voice' as Tab, label: 'Bot de Voz IA', icon: Mic, color: 'text-purple-600' },
            { id: 'history' as Tab, label: 'Historial', icon: BarChart3, color: 'text-gray-600' },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); resetFlow() }}
              className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all',
                tab === t.id ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              <t.icon className={cn('w-4 h-4', tab === t.id ? t.color : '')} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* === WHATSAPP / VOICE FLOW === */}
        {(tab === 'whatsapp' || tab === 'voice') && (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {['Audiencia', 'Mensaje', 'Preview', 'Enviar'].map((s, i) => {
                const stepIdx = ['select', 'message', 'preview', 'sent'].indexOf(step)
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                      i <= stepIdx ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500')}>
                      {i < stepIdx ? '✓' : i + 1}
                    </div>
                    <span className={cn('text-sm', i <= stepIdx ? 'text-gray-900 font-medium' : 'text-gray-400')}>{s}</span>
                    {i < 3 && <div className={cn('w-8 h-0.5', i < stepIdx ? 'bg-green-500' : 'bg-gray-200')} />}
                  </div>
                )
              })}
            </div>

            {/* Step 1: Select audience */}
            {step === 'select' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {tab === 'whatsapp' ? '📱 Nueva campaña WhatsApp' : '🤖 Nueva campaña de voz IA'}
                </h2>
                <p className="text-sm text-gray-500">Selecciona a quién quieres contactar:</p>
                <div className="grid grid-cols-2 gap-3">
                  {segments.filter(s => s.count > 0).map(seg => (
                    <button key={seg.key} onClick={() => setSelectedSegment(seg.key)}
                      className={cn('p-4 border rounded-xl text-left transition-all',
                        selectedSegment === seg.key ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-gray-200 hover:border-green-300')}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">{seg.label}</span>
                        <Badge className="bg-gray-100 text-gray-700">{seg.count}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedSegment && (
                  <Button onClick={() => { setStep('message'); generateAIMessage() }}
                    className="bg-green-600 hover:bg-green-700 mt-4">
                    Siguiente — Crear mensaje <Send className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {/* Step 2: Message */}
            {step === 'message' && (
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-lg font-bold text-gray-900">
                  {tab === 'whatsapp' ? '✍️ Mensaje WhatsApp' : '🗣️ Guión del bot de voz'}
                </h2>

                {tab === 'voice' && voiceConfig && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Voz del bot:</p>
                    <div className="flex gap-2">
                      {voiceConfig.available_voices?.map((v: any) => (
                        <button key={v.id} onClick={() => setSelectedVoice(v.id)}
                          className={cn('px-3 py-2 border rounded-lg text-xs',
                            selectedVoice === v.id ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600')}>
                          🎤 {v.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-4">Preguntas de la encuesta:</p>
                    {questions.map((q, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                        <input type="text" value={q} onChange={(e) => {
                          const newQ = [...questions]; newQ[i] = e.target.value; setQuestions(newQ)
                        }} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      </div>
                    ))}
                    <button onClick={() => setQuestions([...questions, ''])}
                      className="text-xs text-purple-600 hover:text-purple-800">+ Agregar pregunta</button>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      {tab === 'whatsapp' ? 'Mensaje (generado por IA):' : 'Mensaje de apertura:'}
                    </p>
                    <Button size="sm" variant="outline" onClick={generateAIMessage} disabled={generatingMsg}
                      className="text-xs">
                      {generatingMsg ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Regenerar con IA
                    </Button>
                  </div>
                  {generatingMsg ? (
                    <div className="h-32 border border-gray-200 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">IA generando mensaje personalizado...</span>
                    </div>
                  ) : (
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  )}
                  <p className="text-xs text-gray-400 mt-1">{message.length} caracteres • Puedes editar el mensaje antes de enviar</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('select')}>Atrás</Button>
                  <Button onClick={loadPreview} disabled={!message.trim()}
                    className="bg-green-600 hover:bg-green-700">
                    <Eye className="w-4 h-4 mr-2" /> Preview
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {step === 'preview' && preview && (
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-lg font-bold text-gray-900">👀 Preview de campaña</h2>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Canal</span>
                      <Badge className={tab === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}>
                        {tab === 'whatsapp' ? '📱 WhatsApp' : '📞 Bot de Voz'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Destinatarios</span>
                      <span className="font-bold">{preview.total} personas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Costo estimado</span>
                      <span className="font-bold text-green-600">{preview.estimated_cost}</span>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm text-gray-500 mb-1">Mensaje:</p>
                      <div className="p-3 bg-green-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">{message}</div>
                    </div>
                    {preview.recipients?.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-sm text-gray-500 mb-2">Primeros destinatarios:</p>
                        <div className="space-y-1">
                          {preview.recipients.slice(0, 5).map((r: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                              <span>{r.name}</span>
                              <span className="text-gray-500">{r.phone || 'Sin teléfono'}</span>
                              <span className="text-gray-400">Sec {r.ine_section}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('message')}>Editar mensaje</Button>
                  <Button onClick={sendCampaign} disabled={sending}
                    className="bg-green-600 hover:bg-green-700">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {sending ? 'Enviando...' : `Enviar campaña (${preview.total} mensajes)`}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Sent */}
            {step === 'sent' && sentResult && (
              <div className="max-w-md mx-auto text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">¡Campaña enviada!</h2>
                <p className="text-sm text-gray-500">{sentResult.message}</p>
                <p className="text-xs text-gray-400">ID: {sentResult.campaign_id}</p>
                <Button onClick={resetFlow} className="bg-green-600 hover:bg-green-700">
                  <RefreshCw className="w-4 h-4 mr-2" /> Nueva campaña
                </Button>
              </div>
            )}
          </>
        )}

        {/* === HISTORY === */}
        {tab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">📊 Historial de campañas</h2>
            {campaigns.length === 0 ? (
              <p className="text-sm text-gray-500 py-10 text-center">No hay campañas registradas aún.</p>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c: any) => (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{c.name}</h3>
                            <Badge className={c.channel === 'whatsapp' ? 'bg-green-100 text-green-700 text-xs' : 'bg-purple-100 text-purple-700 text-xs'}>
                              {c.channel === 'whatsapp' ? '📱 WhatsApp' : '📞 Voz'}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-600 text-xs">{c.status}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{c.date} • Segmento: {c.segment}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-3">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-lg font-bold text-gray-900">{c.sent}</p>
                          <p className="text-[10px] text-gray-500">Enviados</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-lg font-bold text-blue-600">{c.delivered}</p>
                          <p className="text-[10px] text-gray-500">Entregados</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-lg font-bold text-green-600">{c.read || '—'}</p>
                          <p className="text-[10px] text-gray-500">Leídos</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-lg font-bold text-purple-600">{c.responded}</p>
                          <p className="text-[10px] text-gray-500">Respondieron</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
