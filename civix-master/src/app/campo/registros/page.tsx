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

const SYNC_BADGE: Record<string, { label: string; color: string; icon: any }> = {
  synced: { label: 'Enviado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Pendiente', color: 'bg-orange-100 text-orange-700', icon: Clock },
  error: { label: 'Error', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const URGENCY_COLOR: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-600',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-red-100 text-red-700',
}

export default function CampoRegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [filter, setFilter] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('campo_registros')
    if (stored) { try { setRegistros(JSON.parse(stored)) } catch {} }
    setLoaded(true)
  }, [])

  const filtered = registros.filter(r => filter === 'all' || r.sync_status === filter)
  const pendingCount = registros.filter(r => r.sync_status === 'pending').length
  const syncedCount = registros.filter(r => r.sync_status === 'synced').length
  const errorCount = registros.filter(r => r.sync_status === 'error').length

  const handleSyncAll = async () => {
    setSyncing(true)
    await new Promise(r => setTimeout(r, 2000))
    const updated = registros.map(r => r.sync_status === 'pending' ? { ...r, sync_status: 'synced' as const } : r)
    setRegistros(updated)
    localStorage.setItem('campo_registros', JSON.stringify(updated))
    toast.success(`${pendingCount} registros sincronizados`)
    setSyncing(false)
  }

  if (!loaded) return null

  return (
    <div className="px-4 pt-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Mis registros</h1><p className="text-sm text-gray-500">{registros.length} total</p></div>
        {pendingCount > 0 && (
          <Button size="sm" onClick={handleSyncAll} disabled={syncing}>
            {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {syncing ? 'Enviando...' : `Enviar ${pendingCount}`}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: registros.length, color: 'text-gray-900' },
          { label: 'Enviados', value: syncedCount, color: 'text-green-600' },
          { label: 'Pendientes', value: pendingCount, color: 'text-orange-600' },
          { label: 'Errores', value: errorCount, color: 'text-red-600' },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-2 text-center"><p className={cn('text-lg font-bold', s.color)}>{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {[{ id: 'all', label: 'Todos' }, { id: 'pending', label: 'Pendientes' }, { id: 'synced', label: 'Enviados' }, { id: 'error', label: 'Errores' }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn('px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap', filter === f.id ? 'bg-civix-500 text-white' : 'bg-gray-100 text-gray-600')}>{f.label}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((reg) => {
          const badge = SYNC_BADGE[reg.sync_status]; const Icon = badge.icon
          const time = new Date(reg.captured_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          const hasPeticion = reg.peticion && reg.peticion.trim().length > 0
          const isExpanded = expandedTicket === reg.id

          return (
            <Card key={reg.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-gray-900 text-sm">{reg.name}</p>
                  <Badge className={cn('text-xs flex items-center gap-1', badge.color)}><Icon className="w-3 h-3" />{badge.label}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Sección {reg.seccion || '—'}</span>
                  <span>{reg.colonia || '—'}</span>
                </div>

                {/* Petition as ticket chip */}
                {hasPeticion && (
                  <button
                    onClick={() => setExpandedTicket(isExpanded ? null : reg.id)}
                    className="mt-2 w-full flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100 text-left hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-xs text-blue-700 font-medium flex-1">Petición registrada</span>
                    {reg.urgency && <Badge className={cn('text-[10px]', URGENCY_COLOR[reg.urgency] || URGENCY_COLOR.media)}>{reg.urgency}</Badge>}
                    {isExpanded ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />}
                  </button>
                )}

                {/* Expanded petition detail */}
                {hasPeticion && isExpanded && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                    <p className="text-sm text-gray-700">{reg.peticion}</p>
                    {reg.categories && reg.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {reg.categories.map((c: string) => (
                          <span key={c} className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{c}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400">
                        {reg.sync_status === 'synced' ? '✓ Enviado a GobPanel' : '⏳ Se enviará al sincronizar'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{reg.event || 'Campo libre'} • {time}</span>
                  {reg.sync_status === 'error' && <Button size="sm" variant="outline" className="h-7 text-xs">Reintentar</Button>}
                </div>
                {reg.sync_error && <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">{reg.sync_error}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {registros.length === 0 && (
        <div className="text-center py-16">
          <UserPlus className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">No has registrado ciudadanos aún</p>
          <p className="text-gray-400 text-xs mb-4">Los registros que captures aparecerán aquí</p>
          <Link href="/campo/registro/ine"><Button size="sm"><UserPlus className="w-4 h-4 mr-2" />Registrar ciudadano</Button></Link>
        </div>
      )}

      {registros.length > 0 && filtered.length === 0 && (
        <div className="text-center py-10"><RefreshCw className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No hay registros con este filtro</p></div>
      )}
    </div>
  )
}
