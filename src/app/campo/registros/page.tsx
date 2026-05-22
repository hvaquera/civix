'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, Clock, XCircle, Loader2, UserPlus, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface Registro {
  id: string; name: string; seccion: string; colonia: string; phone?: string
  peticion?: string; categories?: string[]; urgency?: string; note?: string
  event: string | null; captured_at: string; sync_status: 'synced' | 'pending' | 'error'; sync_error?: string
}

const SYNC_CFG: Record<string, { label: string; variant: any; icon: any }> = {
  synced:  { label: 'Enviado',   variant: 'success', icon: CheckCircle },
  pending: { label: 'Pendiente', variant: 'warning',  icon: Clock },
  error:   { label: 'Error',     variant: 'danger',   icon: XCircle },
}

const URGENCY_VARIANT: Record<string, any> = { baja: 'gray', media: 'warning', alta: 'danger' }

export default function CampoRegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [filter, setFilter] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('campo_registros')
    if (stored) { try { setRegistros(JSON.parse(stored)) } catch {} }
    setLoaded(true)
  }, [])

  const filtered = registros.filter(r => filter === 'all' || r.sync_status === filter)
  const pendingCount = registros.filter(r => r.sync_status === 'pending').length
  const syncedCount  = registros.filter(r => r.sync_status === 'synced').length
  const errorCount   = registros.filter(r => r.sync_status === 'error').length

  const handleSyncAll = async () => {
    setSyncing(true)
    await new Promise(r => setTimeout(r, 1800))
    const updated = registros.map(r => r.sync_status === 'pending' ? { ...r, sync_status: 'synced' as const } : r)
    setRegistros(updated)
    localStorage.setItem('campo_registros', JSON.stringify(updated))
    toast.success(`${pendingCount} registros sincronizados`)
    setSyncing(false)
  }

  if (!loaded) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mis registros</h1>
              <p className="text-xs text-gray-400">{registros.length} total</p>
            </div>
            {pendingCount > 0 && (
              <Button size="sm" onClick={handleSyncAll} disabled={syncing}>
                {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {syncing ? 'Enviando...' : `Enviar ${pendingCount}`}
              </Button>
            )}
          </div>

          {/* Count chips */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total',     value: registros.length, color: 'text-gray-900' },
              { label: 'Enviados',  value: syncedCount,       color: 'text-emerald-600' },
              { label: 'Pendientes',value: pendingCount,      color: 'text-amber-600' },
              { label: 'Errores',   value: errorCount,        color: 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-2 text-center">
                <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[{ id: 'all', label: 'Todos' }, { id: 'pending', label: 'Pendientes' }, { id: 'synced', label: 'Enviados' }, { id: 'error', label: 'Errores' }].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                filter === f.id ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600'
              )}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-2">
        {filtered.map((reg) => {
          const cfg = SYNC_CFG[reg.sync_status]
          const Icon = cfg.icon
          const time = new Date(reg.captured_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          const hasPeticion = reg.peticion && reg.peticion.trim().length > 0
          const isExpanded = expanded === reg.id

          return (
            <Card key={reg.id} className="overflow-hidden">
              <CardContent className="p-3.5">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-gray-900 text-sm">{reg.name}</p>
                  <Badge variant={cfg.variant} className="flex items-center gap-1 flex-shrink-0">
                    <Icon className="w-3 h-3" />{cfg.label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">Sección {reg.seccion || '—'} · {reg.colonia || '—'}</p>

                {hasPeticion && (
                  <button
                    onClick={() => setExpanded(isExpanded ? null : reg.id)}
                    className="mt-2 w-full flex items-center gap-2 p-2.5 rounded-xl bg-civix-50 border border-civix-100 text-left hover:bg-civix-100 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-civix-500 flex-shrink-0" />
                    <span className="text-xs text-civix-700 font-medium flex-1">Petición registrada</span>
                    {reg.urgency && <Badge variant={URGENCY_VARIANT[reg.urgency]} className="text-xs">{reg.urgency}</Badge>}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-civix-400" /> : <ChevronDown className="w-3.5 h-3.5 text-civix-400" />}
                  </button>
                )}

                {hasPeticion && isExpanded && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                    <p className="text-sm text-gray-700">{reg.peticion}</p>
                    {reg.categories && reg.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {reg.categories.map((c) => (
                          <span key={c} className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{reg.event || 'Campo libre'} · {time}</span>
                  {reg.sync_status === 'error' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs">Reintentar</Button>
                  )}
                </div>
                {reg.sync_error && <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded-lg">{reg.sync_error}</p>}
              </CardContent>
            </Card>
          )
        })}

        {registros.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm mb-1">No has registrado ciudadanos aún</p>
            <p className="text-gray-400 text-xs mb-4">Los registros que captures aparecerán aquí</p>
            <Link href="/campo/registro/ine">
              <Button size="md"><UserPlus className="w-4 h-4 mr-2" />Registrar ciudadano</Button>
            </Link>
          </div>
        )}

        {registros.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12">
            <RefreshCw className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No hay registros con este filtro</p>
          </div>
        )}
      </div>
    </div>
  )
}
