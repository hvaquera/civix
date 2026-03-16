'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Brain, MapPin, Users, Target, Loader2, CheckCircle, AlertTriangle, TrendingUp, Sparkles, X, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Suppress Leaflet _leaflet_pos errors in dev
if (typeof window !== 'undefined') {
  const origOnError = window.onerror
  window.onerror = function (msg, ...args) {
    if (typeof msg === 'string' && msg.includes('_leaflet_pos')) return true
    return origOnError ? (origOnError as any)(msg, ...args) : false
  }
}

const ClusterMap = dynamic(() => import('@/components/panel/ClusterMap'), { ssr: false })

const SECTIONS = [
  { id: 'c487a7f0-9e62-490e-9f67-3242852d97c1', number: 1234, name: 'Mitras Centro', contacts: 24 },
  { id: '19c160a5-77d5-49df-b172-72e73279bff2', number: 1235, name: 'Del Valle', contacts: 12 },
  { id: 'd295ddb6-060d-4161-b278-daf4454bbcbd', number: 1236, name: 'Obispado', contacts: 6 },
]

const CLUSTER_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface Cluster {
  db_id?: string
  cluster_key?: string
  status?: string
  name: string
  centroid_lat: number
  centroid_lng: number
  radius_meters: number
  contact_ids: string[]
  contacts_count: number
  streets: string[]
  dominant_issue: string
  support_breakdown: { hard: number; soft: number; undecided: number }
  confidence: number
  recommendation: string
  assigned_manzanero_id?: string
  assigned_manzanero_name?: string
}

interface AnalysisResult {
  clusters: Cluster[]
  scattered_contacts: string[]
  section_summary: string
  recommended_manzaneros: string
  total_contacts: number
}

interface Operator {
  id: string
  name: string
  phone: string
}

export default function InteligenciaTerritorialPage() {
  const [selectedSection, setSelectedSection] = useState(SECTIONS[0])
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [cache, setCache] = useState<Record<string, AnalysisResult>>({})
  const [error, setError] = useState('')
  const [operators, setOperators] = useState<Operator[]>([])
  const [structure, setStructure] = useState<any>(null)
  const [assignModal, setAssignModal] = useState<{ clusterIndex: number; clusterId: string } | null>(null)
  const [approving, setApproving] = useState<Set<number>>(new Set())

  // Suppress Leaflet errors in dev overlay
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.message?.includes('_leaflet_pos') || e.message?.includes('leaflet')) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return true
      }
    }
    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])

  // Fetch operators and structure chain for assignment
  useEffect(() => {
    fetch(`/api/clustering/operators?section_id=${selectedSection.id}`)
      .then(r => r.json())
      .then(d => {
        setOperators(d.operators || [])
        setStructure(d.structure || null)
      })
      .catch(() => {})
  }, [selectedSection])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/clustering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: selectedSection.id,
          section_number: selectedSection.number,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error en análisis')
      }

      const data = await res.json()
      setResult(data)
      setCache(prev => ({ ...prev, [selectedSection.id]: data }))
      toast.success(`${data.clusters?.length || 0} clusters identificados y guardados`)
    } catch (err: any) {
      setError(err.message)
      toast.error('Error al analizar')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApprove = async (clusterIndex: number) => {
    const cluster = result?.clusters[clusterIndex]
    if (!cluster?.db_id) { toast.error('Cluster sin ID en base de datos'); return }

    setApproving(prev => new Set(prev).add(clusterIndex))
    try {
      const res = await fetch('/api/clustering', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster_id: cluster.db_id, action: 'approve' }),
      })
      if (!res.ok) throw new Error('Error al aprobar')

      // Update local state
      setResult(prev => {
        if (!prev) return prev
        const updated = { ...prev, clusters: [...prev.clusters] }
        updated.clusters[clusterIndex] = { ...updated.clusters[clusterIndex], status: 'approved' }
        return updated
      })
      toast.success(`"${cluster.name}" aprobado`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setApproving(prev => { const n = new Set(prev); n.delete(clusterIndex); return n })
    }
  }

  const handleAssign = async (operatorId: string) => {
    if (!assignModal || !result) return
    const cluster = result.clusters[assignModal.clusterIndex]
    if (!cluster?.db_id) { toast.error('Cluster sin ID'); return }

    try {
      const res = await fetch('/api/clustering', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster_id: cluster.db_id, action: 'assign', operator_id: operatorId }),
      })
      if (!res.ok) throw new Error('Error al asignar')

      const op = operators.find(o => o.id === operatorId)

      setResult(prev => {
        if (!prev) return prev
        const updated = { ...prev, clusters: [...prev.clusters] }
        updated.clusters[assignModal.clusterIndex] = {
          ...updated.clusters[assignModal.clusterIndex],
          status: 'active',
          assigned_manzanero_id: operatorId,
          assigned_manzanero_name: op?.name || 'Asignado',
        }
        return updated
      })

      toast.success(`${op?.name} asignado a "${cluster.name}"`)
      setAssignModal(null)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved': return { label: 'Aprobado', color: 'bg-blue-100 text-blue-700' }
      case 'active': return { label: 'Activo', color: 'bg-green-100 text-green-700' }
      default: return { label: 'Sugerido', color: 'bg-yellow-100 text-yellow-700' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Inteligencia Territorial
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Clustering automático de contactos con IA para asignación de manzaneros
          </p>
        </div>
      </div>

      {/* Section Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sección electoral</label>
              <div className="flex gap-2">
                {SECTIONS.map(s => (
                  <button key={s.id} onClick={() => { setSelectedSection(s); setResult(cache[s.id] || null) }}
                    className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      selectedSection.id === s.id ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}>
                    <span className="font-bold">{s.number}</span>
                    <span className="text-xs ml-1 opacity-60">{s.name}</span>
                    <Badge className="ml-2 bg-gray-200 text-gray-600 text-xs">{s.contacts}</Badge>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleAnalyze} disabled={analyzing} className="bg-purple-600 hover:bg-purple-700 h-10">
              {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analizando con IA...</> : <><Sparkles className="w-4 h-4 mr-2" />Analizar sección {selectedSection.number}</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-red-700 text-sm">{error}</CardContent></Card>}

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Análisis IA — Sección {selectedSection.number}</h3>
                  <p className="text-sm text-gray-600">{result.section_summary}</p>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-sm"><Target className="w-4 h-4 text-purple-500" /><span className="font-medium">{result.clusters.length} clusters</span></div>
                    <div className="flex items-center gap-1.5 text-sm"><Users className="w-4 h-4 text-blue-500" /><span className="font-medium">{result.total_contacts} contactos</span></div>
                    <div className="flex items-center gap-1.5 text-sm"><MapPin className="w-4 h-4 text-orange-500" /><span className="font-medium">{result.scattered_contacts?.length || 0} dispersos</span></div>
                    <div className="flex items-center gap-1.5 text-sm"><TrendingUp className="w-4 h-4 text-green-500" /><span className="font-medium">{result.recommended_manzaneros} manzaneros recomendados</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map + Clusters */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Card className="h-[500px]">
                <CardContent className="p-0 h-full">
                  <ClusterMap
                    clusters={result.clusters.map((c, i) => ({ ...c, color: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }))}
                    center={[result.clusters[0]?.centroid_lat || 25.6866, result.clusters[0]?.centroid_lng || -100.3161]}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-auto">
              {result.clusters.map((cluster, i) => {
                const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length]
                const total = (cluster.support_breakdown?.hard || 0) + (cluster.support_breakdown?.soft || 0) + (cluster.support_breakdown?.undecided || 0)
                const statusBadge = getStatusBadge(cluster.status)
                const isApproving = approving.has(i)

                return (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-1" style={{ background: color }} />
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900">{cluster.name}</h4>
                          <p className="text-xs text-gray-400">{cluster.streets?.join(', ')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className="text-xs" style={{ background: `${color}20`, color }}>
                            {cluster.contacts_count} contactos
                          </Badge>
                          <Badge className={cn('text-xs', statusBadge.color)}>{statusBadge.label}</Badge>
                        </div>
                      </div>

                      {/* Support bar */}
                      {total > 0 && (
                        <>
                          <div className="flex h-2 rounded-full overflow-hidden mb-2">
                            <div className="bg-green-500" style={{ width: `${(cluster.support_breakdown?.hard || 0) / total * 100}%` }} />
                            <div className="bg-yellow-400" style={{ width: `${(cluster.support_breakdown?.soft || 0) / total * 100}%` }} />
                            <div className="bg-gray-300" style={{ width: `${(cluster.support_breakdown?.undecided || 0) / total * 100}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span className="text-green-600">Duros: {cluster.support_breakdown?.hard || 0}</span>
                            <span className="text-yellow-600">Blandos: {cluster.support_breakdown?.soft || 0}</span>
                            <span>Indecisos: {cluster.support_breakdown?.undecided || 0}</span>
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-gray-600">Tema principal: <strong>{cluster.dominant_issue}</strong></span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-400">Confianza IA: {Math.round((cluster.confidence || 0) * 100)}%</span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 mb-3">
                        💡 {cluster.recommendation}
                      </div>

                      {/* Structure chain */}
                      {(cluster.assigned_manzanero_name || structure) && (
                        <div className="mb-3 p-2 bg-gray-50 rounded-lg space-y-1.5">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Estructura</p>
                          {structure?.distrital && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Distrital</span>
                              <span className="font-medium text-gray-700">{structure.distrital.name}</span>
                            </div>
                          )}
                          {structure?.seccional && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Seccional</span>
                              <span className="font-medium text-gray-700">{structure.seccional.name}</span>
                            </div>
                          )}
                          {structure?.colonia && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Jefe Colonia</span>
                              <span className="font-medium text-gray-700">{structure.colonia.name}</span>
                            </div>
                          )}
                          {cluster.assigned_manzanero_name ? (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-600 flex items-center gap-1"><UserCheck className="w-3 h-3" />Manzanero</span>
                              <span className="font-medium text-green-700">{cluster.assigned_manzanero_name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-orange-500">Manzanero</span>
                              <span className="text-orange-500 italic">Sin asignar</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {cluster.status !== 'active' && structure?.manzaneros?.length > 0 && (
                          <Button size="sm" variant="outline" className="flex-1 text-xs h-8"
                            onClick={() => setAssignModal({ clusterIndex: i, clusterId: cluster.db_id || '' })}>
                            <Users className="w-3 h-3 mr-1" />Asignar manzanero
                          </Button>
                        )}
                        {cluster.status === 'suggested' && (
                          <Button size="sm" className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700"
                            disabled={isApproving}
                            onClick={() => handleApprove(i)}>
                            {isApproving
                              ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              : <CheckCircle className="w-3 h-3 mr-1" />}
                            {isApproving ? 'Aprobando...' : 'Aprobar'}
                          </Button>
                        )}
                        {cluster.status === 'approved' && !cluster.assigned_manzanero_id && (
                          <Badge className="flex-1 text-xs h-8 bg-blue-50 text-blue-600 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> Aprobado — falta manzanero
                          </Badge>
                        )}
                        {cluster.status === 'active' && (
                          <Badge className="flex-1 text-xs h-8 bg-green-50 text-green-600 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> Operativo
                          </Badge>
                        )}
                      </div>
                      {!structure?.manzaneros?.length && cluster.status !== "active" && (
                        <div className="text-xs text-center text-gray-400 p-2 bg-gray-50 rounded-lg mt-2">
                          Sin manzaneros disponibles — Responsable: {structure?.colonia?.name || structure?.seccional?.name || structure?.distrital?.name || "Sin asignar"}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}

              {result.scattered_contacts && result.scattered_contacts.length > 0 && (
                <Card className="border-dashed border-gray-300">
                  <CardContent className="p-3 text-center">
                    <MapPin className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-medium text-gray-600">{result.scattered_contacts.length} contactos dispersos</p>
                    <p className="text-xs text-gray-400 mt-1">Sin cluster claro. Monitorear crecimiento.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && !analyzing && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="py-16 text-center">
            <Brain className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Selecciona una sección y analiza</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              La IA analizará la distribución geográfica de tus contactos y sugerirá clusters operativos para asignar manzaneros.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assign Manzanero Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Asignar manzanero</h3>
                <p className="text-xs text-gray-500">{result?.clusters[assignModal.clusterIndex]?.name}</p>
              </div>
              <button onClick={() => setAssignModal(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2 max-h-[300px] overflow-auto">
              {operators.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay operadores disponibles para esta sección</p>
              ) : (
                operators.map(op => (
                  <button key={op.id}
                    onClick={() => handleAssign(op.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left border border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-civix-100 text-civix-700 flex items-center justify-center font-semibold text-sm">
                      {op.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{op.name}</p>
                      <p className="text-xs text-gray-500">{op.phone}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
