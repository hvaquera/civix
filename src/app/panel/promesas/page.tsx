'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GitCommit, CheckCircle, X, Clock, AlertTriangle, Plus, MapPin, Calendar, ChevronRight, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

const mockPromesas = [
  { id: '1', title: 'Pavimentación de Av. Simón Bolívar',
    tasks: [
      { id: 't1', title: 'Estudio topográfico y presupuesto', done: true, ai: true },
      { id: 't2', title: 'Licitación pública', done: true, ai: true },
      { id: 't3', title: 'Inicio de obra (tramo 1)', done: false, ai: true },
      { id: 't4', title: 'Terminación y entrega', done: false, ai: true },
    ], colonia: 'Mitras Centro', seccion: '1234', deadline: '2025-06-01', status: 'pending', category: 'Infraestructura', progress: 35, captured_by: 'Roberto Sánchez', date_promised: '2025-01-15' },
  { id: '2', title: 'Instalación de 20 luminarias LED', colonia: 'Del Valle', seccion: '1235', deadline: '2025-04-30', status: 'in_progress', category: 'Alumbrado', progress: 70, captured_by: 'Ana Gómez', date_promised: '2025-01-10' },
  { id: '3', title: 'Parque infantil en Colonia Centro',
    tasks: [
      { id: 't1', title: 'Diseño y aprobación de planos', done: true, ai: true },
      { id: 't2', title: 'Compra de material y equipo', done: true, ai: true },
      { id: 't3', title: 'Instalación y construcción', done: true, ai: true },
      { id: 't4', title: 'Inauguración y entrega a comunidad', done: true, ai: true },
    ], colonia: 'Centro', seccion: '1236', deadline: '2025-03-15', status: 'fulfilled', category: 'Parques', progress: 100, captured_by: 'Laura Hernández', date_promised: '2024-12-01' },
  { id: '4', title: 'Módulo de atención ciudadana 24h', colonia: 'Obispado', seccion: '1237', deadline: '2025-02-28', status: 'overdue', category: 'Servicios', progress: 10, captured_by: 'Carlos Pérez', date_promised: '2025-01-05' },
  { id: '5', title: 'Reencarpetado de calles principales', colonia: 'Mitras Centro', seccion: '1234', deadline: '2025-07-01', status: 'pending', category: 'Infraestructura', progress: 0, captured_by: 'Roberto Sánchez', date_promised: '2025-01-20' },
]

const STATUS_CFG: Record<string, { label: string; icon: any; cls: string; badge: any }> = {
  pending:     { label: 'Pendiente',    icon: Clock,         cls: 'promise-pending',   badge: 'warning' },
  in_progress: { label: 'En proceso',   icon: GitCommit,     cls: 'bg-civix-50 border border-civix-200', badge: 'indigo' },
  fulfilled:   { label: 'Cumplida',     icon: CheckCircle,   cls: 'promise-fulfilled', badge: 'success' },
  overdue:     { label: 'Vencida',      icon: AlertTriangle, cls: 'promise-overdue',   badge: 'danger' },
}

const CATEGORIES = ['Todos', 'Infraestructura', 'Alumbrado', 'Parques', 'Servicios', 'Agua']

export default function PromesasPage() {
  const [filter, setFilter] = useState('Todos')
  const [showNew, setShowNew] = useState(false)
  const [selectedPromesa, setSelectedPromesa] = useState<any>(null)
  const [newForm, setNewForm] = useState({ title: '', colonia: '', deadline: '', category: 'Infraestructura' })

  const counts = {
    total: mockPromesas.length,
    fulfilled: mockPromesas.filter(p => p.status === 'fulfilled').length,
    pending: mockPromesas.filter(p => p.status === 'pending' || p.status === 'in_progress').length,
    overdue: mockPromesas.filter(p => p.status === 'overdue').length,
  }

  const filtered = filter === 'Todos' ? mockPromesas : mockPromesas.filter(p => p.category === filter)

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promesas de campaña</h1>
          <p className="text-gray-400 text-sm">Registra y da seguimiento a compromisos por colonia</p>
        </div>
        <Button onClick={() => setShowNew(true)} size="md">
          <Plus className="w-4 h-4 mr-2" />Nueva promesa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: counts.total,     color: 'text-gray-900' },
          { label: 'Cumplidas', value: counts.fulfilled,  color: 'text-emerald-600' },
          { label: 'Activas',   value: counts.pending,    color: 'text-civix-600' },
          { label: 'Vencidas',  value: counts.overdue,    color: 'text-red-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              <div className="progress-thin mt-2">
                <div className="progress-thin-fill" style={{ width: `${Math.round((s.value / counts.total) * 100)}%`, background: s.color.includes('emerald') ? '#10b981' : s.color.includes('red') ? '#ef4444' : '#6366f1' }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === cat ? 'bg-navy-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >{cat}</button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((p) => {
          const cfg = STATUS_CFG[p.status]
          const Icon = cfg.icon
          const daysLeft = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86400000)
          return (
            <Card key={p.id} className="card-lift cursor-pointer" onClick={() => setSelectedPromesa(p)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', cfg.cls)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{p.title}</p>
                      <Badge variant={cfg.badge as any} className="flex-shrink-0">{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.colonia} · Sección {p.seccion}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                        {p.status === 'overdue' ? <span className="text-red-500 font-medium">Venció hace {Math.abs(daysLeft)} días</span>
                          : p.status === 'fulfilled' ? <span className="text-emerald-600 font-medium">Cumplida</span>
                          : `Faltan ${daysLeft} días`}
                      </span>
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{p.category}</span>
                    </div>
                    {p.status !== 'fulfilled' && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>Avance</span><span className="font-semibold text-gray-700">{p.progress}%</span>
                        </div>
                        <div className="progress-thin">
                          <div
                            className="progress-thin-fill"
                            style={{
                              width: `${p.progress}%`,
                              background: p.status === 'overdue' ? '#ef4444' : '#6366f1'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Capturada por {p.captured_by} · {p.date_promised}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* New promise modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Nueva promesa</CardTitle>
                <button onClick={() => setShowNew(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Compromiso</label>
                <input
                  className="field-input"
                  placeholder="¿Qué se prometió?"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Colonia</label>
                  <input className="field-input" placeholder="Mitras Centro" value={newForm.colonia} onChange={(e) => setNewForm({ ...newForm, colonia: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Fecha límite</label>
                  <input type="date" className="field-input" value={newForm.deadline} onChange={(e) => setNewForm({ ...newForm, deadline: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Categoría</label>
                <select className="field-input" value={newForm.category} onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}>
                  {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="md" className="flex-1" onClick={() => setShowNew(false)}>Cancelar</Button>
                <Button size="md" className="flex-1" onClick={() => setShowNew(false)}>Guardar promesa</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Promesa detail modal */}
      {selectedPromesa && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPromesa(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900">{selectedPromesa.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedPromesa.colonia} · Sección {selectedPromesa.seccion}</p>
                </div>
                <button onClick={() => setSelectedPromesa(null)} className="p-1.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Tareas de cumplimiento</span>
                <span className="bg-civix-50 text-civix-700 border border-civix-100 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  ✨ Generadas con IA
                </span>
              </div>
              {selectedPromesa.tasks ? (
                <div className="space-y-2">
                  {selectedPromesa.tasks.map((t: any) => (
                    <div key={t.id} className={cn('flex items-center gap-3 p-3 rounded-xl border', t.done ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100')}>
                      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0', t.done ? 'bg-emerald-500' : 'bg-gray-200')}>
                        {t.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <p className={cn('text-sm', t.done ? 'text-emerald-800 line-through' : 'text-gray-700')}>{t.title}</p>
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                    💡 Las tareas fueron generadas automáticamente con base en el área responsable y tipo de promesa. Próximamente se podrán asignar responsables y fechas.
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Tareas no definidas aún</p>
                  <p className="text-xs mt-1">La IA generará tareas cuando se active el módulo completo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}