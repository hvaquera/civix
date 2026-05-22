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
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">Cargando War Room...</p>
        </div>
      </div>
    )
  }

  const s = overview?.stats || {}

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-950 text-white">
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
        {tab === 'movilizacion' && movilizacion && (
          <div className="space-y-6">
            <div className="rounded-xl p-6 border bg-red-950 border-red-800">
              <h2 className="text-xl font-bold mb-1">🚨 Movilización urgente</h2>
              <p className="text-gray-400">
                {movilizacion.no_show_count} simpatizantes no han votado. {movilizacion.already_voted} ya fueron.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-red-400">{movilizacion.no_show_count}</p>
                  <p className="text-xs text-gray-500">No han votado</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-amber-400">{movilizacion.high_priority}</p>
                  <p className="text-xs text-gray-500">Duros pendientes</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{movilizacion.need_transport}</p>
                  <p className="text-xs text-gray-500">Necesitan transporte</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Lista de llamadas — Prioridad</h3>
                <div className="space-y-2 max-h-96 overflow-auto">
                  {(movilizacion.no_shows || []).map((p: any, i: number) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
                      <span className="text-xs text-gray-600 w-5">{i + 1}</span>
                      <div className={cn('w-2 h-2 rounded-full shrink-0', p.support_level === 'hard_supporter' ? 'bg-red-500' : 'bg-amber-500')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">Sec {p.section} • {p.distance_to_casilla}m de casilla</p>
                      </div>
                      {p.needs_transport && <Badge className="bg-blue-900 text-blue-400 text-[10px]"><Truck className="w-2 h-2 mr-1 inline" />Transporte</Badge>}
                      <Badge className={cn('text-[10px]', p.support_level === 'hard_supporter' ? 'bg-red-900 text-red-400' : 'bg-amber-900 text-amber-400')}>
                        {p.support_level === 'hard_supporter' ? 'DURO' : 'BLANDO'}
                      </Badge>
                      {p.phone && (
                        <a href={`tel:${p.phone}`} className="p-2 bg-green-900 rounded-lg text-green-400 hover:bg-green-800">
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === REASIGNACIÓN === */}
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
