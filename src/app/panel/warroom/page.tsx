'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Phone, Users, TrendingUp, AlertTriangle, CheckCircle, Shield, Loader2, ArrowRight, Truck, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'movilizacion' | 'reasignacion'

export default function WarRoomPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState<any>(null)
  const [movilizacion, setMovilizacion] = useState<any>(null)
  const [reasignacion, setReasignacion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadData = async (view: string) => {
    try {
      const res = await fetch(`/api/warroom?view=${view}`)
      const data = await res.json()
      if (view === 'overview') setOverview(data)
      if (view === 'movilizacion') setMovilizacion(data)
      if (view === 'reasignacion') setReasignacion(data)
      setLastUpdate(new Date())
    } catch {}
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadData('overview'), loadData('movilizacion'), loadData('reasignacion')])
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      loadData('overview')
      if (tab === 'movilizacion') loadData('movilizacion')
      if (tab === 'reasignacion') loadData('reasignacion')
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, tab])

  const refresh = () => {
    setLoading(true)
    Promise.all([loadData('overview'), loadData('movilizacion'), loadData('reasignacion')])
      .finally(() => setLoading(false))
  }

  if (!overview && loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-navy-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">Cargando War Room...</p>
        </div>
      </div>
    )
  }

  const s = overview?.stats || {}

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-navy-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">War Room — Día D</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">{lastUpdate.toLocaleTimeString('es-MX')}</span>
                <Badge className="bg-yellow-900 text-yellow-300 text-[10px]">DEMO</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn('text-xs px-3 py-1 rounded-full', autoRefresh ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-500')}>
              {autoRefresh ? '● Auto-refresh' : '○ Pausado'}
            </button>
            <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={refresh}>
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-6">
        <div className="flex gap-1">
          {[
            { id: 'overview' as Tab, label: 'Panorama General', icon: TrendingUp },
            { id: 'movilizacion' as Tab, label: 'Movilización', icon: Phone, badge: movilizacion?.no_show_count },
            { id: 'reasignacion' as Tab, label: 'Reasignación', icon: Users, badge: reasignacion?.zones_need_help?.length },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); loadData(t.id) }}
              className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all',
                tab === t.id ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300')}>
              <t.icon className="w-4 h-4" /> {t.label}
              {t.badge != null && t.badge > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">

        {/* === OVERVIEW === */}
        {tab === 'overview' && overview && (
          <div className="space-y-6">
            {/* Main metric: our supporters voting progress */}
            <div className="rounded-xl p-6 border bg-gray-900 border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">Nuestros simpatizantes que ya votaron</p>
                  <p className="text-4xl font-bold text-white">{s.total_voted} <span className="text-lg text-gray-500">de {s.total_supporters}</span></p>
                </div>
                <div className="text-right">
                  <p className={cn('text-5xl font-bold', s.pct_voted >= 60 ? 'text-green-400' : s.pct_voted >= 40 ? 'text-amber-400' : 'text-red-400')}>
                    {s.pct_voted}%
                  </p>
                  <p className="text-xs text-gray-500">cumplimiento</p>
                </div>
              </div>
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', s.pct_voted >= 60 ? 'bg-green-500' : s.pct_voted >= 40 ? 'bg-amber-500' : 'bg-red-500')}
                  style={{ width: `${s.pct_voted}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Faltan {s.total_pending} por votar</span>
                <span>Meta: 100% de simpatizantes</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Duros que votaron</p>
                  <p className="text-2xl font-bold text-green-400">{s.hard_voted}<span className="text-sm text-gray-500">/{s.hard_total}</span></p>
                  <div className="h-1.5 bg-gray-800 rounded-full mt-2">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${s.hard_total > 0 ? s.hard_voted / s.hard_total * 100 : 0}%` }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Blandos que votaron</p>
                  <p className="text-2xl font-bold text-blue-400">{s.soft_voted}<span className="text-sm text-gray-500">/{s.soft_total}</span></p>
                  <div className="h-1.5 bg-gray-800 rounded-full mt-2">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.soft_total > 0 ? s.soft_voted / s.soft_total * 100 : 0}%` }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Cobertura RG</p>
                  <p className="text-2xl font-bold text-purple-400">{s.rg_count}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.sections_with_rg} de {s.sections_covered} secciones</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Territorio cubierto</p>
                  <p className="text-2xl font-bold text-amber-400">{s.sections_covered}<span className="text-sm text-gray-500">/{s.total_sections}</span></p>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(s.sections_covered / s.total_sections * 100)}% de secciones</p>
                </CardContent>
              </Card>
            </div>

            {/* Section breakdown */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Progreso por sección</h3>
                <div className="space-y-2">
                  {(overview.sections || []).map((sec: any) => (
                    <div key={sec.section} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800">
                      <MapPin className="w-3 h-3 text-gray-600 shrink-0" />
                      <span className="text-sm text-gray-300 w-24">Sección {sec.section}</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', sec.pct_voted >= 60 ? 'bg-green-500' : sec.pct_voted >= 40 ? 'bg-amber-500' : 'bg-red-500')}
                          style={{ width: `${sec.pct_voted}%` }} />
                      </div>
                      <span className={cn('text-sm font-mono w-10 text-right', sec.pct_voted >= 60 ? 'text-green-400' : sec.pct_voted >= 40 ? 'text-amber-400' : 'text-red-400')}>
                        {sec.pct_voted}%
                      </span>
                      <span className="text-xs text-gray-500 w-20 text-right">{sec.voted}/{sec.total_supporters}</span>
                      <span className="text-[10px] text-gray-600 w-24 text-right">{sec.our_pct_of_ln}% de LN</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === MOVILIZACIÓN === */}
                {tab === 'movilizacion' && (
          <div className="space-y-4">
            {/* Structure hierarchy movilization view */}
            <div className="flex items-center justify-between">
              <div className="bg-red-900/40 border border-red-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-300 text-sm font-semibold">
                  {movilizacion?.no_show_count || 47} sin votar — acción requerida
                </span>
              </div>
              <select className="bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-3 py-2 text-sm">
                <option>Todos los coordinadores</option>
                <option>Zona Norte</option>
                <option>Zona Sur</option>
                <option>Zona Centro</option>
              </select>
            </div>

            {/* Seccionales */}
            <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">Coordinadores Seccionales</p>
            {[
              { name: 'Laura Hernández', seccion: '1234', meta: 200, logrado: 156, brigadistas: 4, activos: 3, estado: 'warning' },
              { name: 'Carlos Pérez',    seccion: '1235', meta: 180, logrado: 171, brigadistas: 3, activos: 3, estado: 'ok' },
              { name: 'Ana Gómez',       seccion: '1236', meta: 220, logrado: 89,  brigadistas: 5, activos: 2, estado: 'critical' },
            ].map((s) => {
              const pct = Math.round((s.logrado / s.meta) * 100)
              const color = s.estado === 'ok' ? 'border-emerald-700 bg-emerald-900/20' : s.estado === 'warning' ? 'border-amber-700 bg-amber-900/20' : 'border-red-700 bg-red-900/20'
              const textColor = s.estado === 'ok' ? 'text-emerald-400' : s.estado === 'warning' ? 'text-amber-400' : 'text-red-400'
              return (
                <div key={s.seccion} className={`border rounded-xl p-4 ${color}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold text-sm">{s.name}</p>
                      <p className="text-gray-500 text-xs">Sección {s.seccion} · {s.activos}/{s.brigadistas} brigadistas activos</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${textColor}`}>{pct}%</p>
                      <p className="text-gray-500 text-xs">{s.logrado}/{s.meta}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.estado === 'ok' ? '#10b981' : s.estado === 'warning' ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                      <Phone className="w-3 h-3" />Llamar
                    </button>
                    <button className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                      <ArrowRight className="w-3 h-3" />Enviar tarea
                    </button>
                    {s.estado === 'critical' && (
                      <button className="flex-1 bg-red-800 hover:bg-red-700 border border-red-700 text-red-200 text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                        <AlertTriangle className="w-3 h-3" />Refuerzo
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Note */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-gray-500">
              💡 <strong className="text-gray-400">Próximo sprint:</strong> Cada rol (manzanero, jefe de colonia, coordinador) tendrá su propia vista aquí y podrá recibir tareas en cascada desde War Room. Las acciones de WhatsApp y voz automática se conectan vía campaña desde el módulo Campañas.
            </div>
          </div>
        )}

        {tab === 'reasignacion' && reasignacion && (
          <div className="space-y-6">
            <div className="rounded-xl p-6 border bg-purple-950 border-purple-800">
              <h2 className="text-xl font-bold mb-2">⚡ Reasignación Dinámica</h2>
              <p className="text-gray-400">{reasignacion.recommendation}</p>
            </div>

            {reasignacion.zones_need_help?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Necesitan refuerzo
                </h3>
                <div className="space-y-3">
                  {reasignacion.zones_need_help.map((z: any) => (
                    <Card key={z.section} className="bg-gray-900 border-red-900">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-white">Sección {z.section}</h4>
                            <p className="text-sm text-gray-400 mt-1">{z.reason}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-400">{z.pct_voted}%</p>
                            <p className="text-xs text-gray-500">votaron</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 p-2 bg-gray-800 rounded-lg">
                          <div className="text-center flex-1">
                            <p className="text-lg font-bold text-white">{z.current_brigadistas}</p>
                            <p className="text-[10px] text-gray-500">Brigadistas</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-red-500" />
                          <div className="text-center flex-1">
                            <p className="text-lg font-bold text-green-400">+{z.recommended_add}</p>
                            <p className="text-[10px] text-gray-500">Agregar</p>
                          </div>
                          <div className="text-center flex-1">
                            <p className="text-lg font-bold text-amber-400">{z.pending}</p>
                            <p className="text-[10px] text-gray-500">Por movilizar</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {reasignacion.zones_safe?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Zonas controladas
                </h3>
                <div className="space-y-3">
                  {reasignacion.zones_safe.map((z: any) => (
                    <Card key={z.section} className="bg-gray-900 border-green-900">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white">Sección {z.section}</h4>
                          <p className="text-sm text-gray-400">{z.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-400">{z.pct_voted}%</p>
                          {z.can_release > 0 && <p className="text-xs text-green-500">Puede liberar {z.can_release} brigadista(s)</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
