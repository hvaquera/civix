'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Tags, GitBranch, Clock, Calendar, Zap, MessageSquare, Save, Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TABS = [
  { id: 'general',    label: 'Generales',      icon: Building2 },
  { id: 'categories', label: 'Categorías',     icon: Tags },
  { id: 'states',     label: 'Estados',        icon: GitBranch },
  { id: 'sla',        label: 'SLA',            icon: Clock },
  { id: 'autoassign', label: 'Asignación auto',icon: Zap },
  { id: 'messages',   label: 'Mensajes',       icon: MessageSquare },
]

const AREAS = ['Servicios Públicos', 'Limpia', 'Agua y Drenaje', 'Parques', 'Seguridad']
const COLORS = ['#3B82F6','#F97316','#8B5CF6','#06B6D4','#10B981','#6B7280','#EF4444','#F59E0B']

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('general')

  // General
  const [municipio, setMunicipio] = useState('Monterrey')
  const [estado, setEstado] = useState('Nuevo León')
  const [adminEmail, setAdminEmail] = useState('admin@monterrey.gob.mx')

  // Categories
  const [categories, setCategories] = useState([
    { id: '1', name: 'Baches',    icon: '🕳️', defaultArea: 'Servicios Públicos', active: true },
    { id: '2', name: 'Alumbrado', icon: '💡', defaultArea: 'Servicios Públicos', active: true },
    { id: '3', name: 'Basura',    icon: '🗑️', defaultArea: 'Limpia',             active: true },
    { id: '4', name: 'Agua',      icon: '💧', defaultArea: 'Agua y Drenaje',      active: true },
    { id: '5', name: 'Parques',   icon: '🌳', defaultArea: 'Parques',             active: true },
  ])
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📋')
  const [showNewCat, setShowNewCat] = useState(false)

  // States
  const [states, setStates] = useState([
    { id: '1', name: 'Nuevo',        color: '#3B82F6', citizenLabel: 'Recibido'   },
    { id: '2', name: 'Sin asignar',  color: '#F97316', citizenLabel: 'Recibido'   },
    { id: '3', name: 'Asignado',     color: '#8B5CF6', citizenLabel: 'En proceso' },
    { id: '4', name: 'En campo',     color: '#06B6D4', citizenLabel: 'En proceso' },
    { id: '5', name: 'Resuelto',     color: '#10B981', citizenLabel: 'Resuelto'   },
    { id: '6', name: 'No procede',   color: '#6B7280', citizenLabel: 'No procede' },
  ])
  const [editingState, setEditingState] = useState<string | null>(null)
  const [editStateData, setEditStateData] = useState({ name: '', color: '', citizenLabel: '' })

  // SLA
  const [slaRules, setSlaRules] = useState([
    { id: '1', priority: 'Urgente', hours: 4,  warning: 1 },
    { id: '2', priority: 'Alta',    hours: 24, warning: 4 },
    { id: '3', priority: 'Media',   hours: 72, warning: 12 },
    { id: '4', priority: 'Baja',    hours: 168,warning: 24 },
  ])

  // Auto-assign
  const [autoRules, setAutoRules] = useState([
    { id: '1', category: 'Baches',    area: 'Servicios Públicos', active: true },
    { id: '2', category: 'Alumbrado', area: 'Servicios Públicos', active: true },
    { id: '3', category: 'Basura',    area: 'Limpia',             active: true },
  ])

  // Messages
  const [messages, setMessages] = useState([
    { id: '1', name: 'Reporte recibido', template: 'Hola {nombre}, recibimos tu reporte {folio}.' },
    { id: '2', name: 'Cambio de estado', template: 'Tu reporte {folio} cambió a: {estado}.' },
    { id: '3', name: 'Resuelto',         template: '¡Tu reporte {folio} fue resuelto! Califica nuestro servicio.' },
  ])
  const [editingMsg, setEditingMsg] = useState<string | null>(null)
  const [editMsgData, setEditMsgData] = useState({ name: '', template: '' })
  const [showNewMsg, setShowNewMsg] = useState(false)
  const [newMsg, setNewMsg] = useState({ name: '', template: '' })

  const save = () => toast.success('Cambios guardados')

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-400 text-sm">Configura el comportamiento del municipio</p>
        </div>
        <Button onClick={save}><Save className="w-4 h-4 mr-2" />Guardar cambios</Button>
      </div>

      {/* Tab bar */}
      <div className="border-b overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id ? 'border-civix-500 text-civix-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* GENERAL */}
      {activeTab === 'general' && (
        <Card><CardContent className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Municipio</label>
              <Input value={municipio} onChange={e => setMunicipio(e.target.value)} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Estado</label>
              <Input value={estado} onChange={e => setEstado(e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Correo de administración</label>
            <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} /></div>
        </CardContent></Card>
      )}

      {/* CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowNewCat(true)}><Plus className="w-4 h-4 mr-1.5" />Nueva categoría</Button>
          </div>
          {showNewCat && (
            <Card className="border-civix-200 bg-civix-50"><CardContent className="p-4 space-y-3">
              <p className="font-semibold text-sm text-gray-900">Nueva categoría</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Ícono</label>
                  <Input value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} className="text-xl text-center" maxLength={2} /></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Nombre</label>
                  <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ej: Drenaje" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowNewCat(false)}>Cancelar</Button>
                <Button size="sm" className="flex-1" onClick={() => {
                  if (!newCatName) return
                  setCategories(prev => [...prev, { id: Date.now().toString(), name: newCatName, icon: newCatIcon, defaultArea: 'Servicios Públicos', active: true }])
                  setNewCatName(''); setNewCatIcon('📋'); setShowNewCat(false)
                  toast.success('Categoría agregada')
                }}>Agregar</Button>
              </div>
            </CardContent></Card>
          )}
          {categories.map(cat => (
            <Card key={cat.id}><CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl">{cat.icon}</span>
              {editingCat === cat.id ? (
                <Input defaultValue={cat.name} onBlur={e => {
                  setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c))
                  setEditingCat(null); toast.success('Categoría actualizada')
                }} autoFocus className="flex-1 h-9" />
              ) : (
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.defaultArea}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingCat(editingCat === cat.id ? null : cat.id)} className="p-1.5 text-gray-400 hover:text-civix-600 rounded-lg hover:bg-civix-50 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setCategories(prev => prev.filter(c => c.id !== cat.id)); toast.success('Categoría eliminada') }}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* STATES */}
      {activeTab === 'states' && (
        <div className="space-y-3">
          {states.map(st => (
            <Card key={st.id}><CardContent className="p-4">
              {editingState === st.id ? (
                <div className="space-y-3">
                  <Input value={editStateData.name} onChange={e => setEditStateData(p => ({ ...p, name: e.target.value }))} placeholder="Nombre interno" />
                  <Input value={editStateData.citizenLabel} onChange={e => setEditStateData(p => ({ ...p, citizenLabel: e.target.value }))} placeholder="Etiqueta ciudadano" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Color</p>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setEditStateData(p => ({ ...p, color: c }))}
                          style={{ background: c }}
                          className={cn('w-7 h-7 rounded-lg transition-transform', editStateData.color === c && 'ring-2 ring-offset-1 ring-gray-900 scale-110')} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingState(null)}>Cancelar</Button>
                    <Button size="sm" className="flex-1" onClick={() => {
                      setStates(prev => prev.map(s => s.id === st.id ? { ...s, ...editStateData } : s))
                      setEditingState(null); toast.success('Estado actualizado')
                    }}>Guardar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: st.color }} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{st.name}</p>
                    <p className="text-xs text-gray-400">Ciudadano ve: "{st.citizenLabel}"</p>
                  </div>
                  <button onClick={() => { setEditingState(st.id); setEditStateData({ name: st.name, color: st.color, citizenLabel: st.citizenLabel }) }}
                    className="p-1.5 text-gray-400 hover:text-civix-600 rounded-lg hover:bg-civix-50 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* SLA */}
      {activeTab === 'sla' && (
        <Card><CardContent className="p-5 space-y-4">
          <p className="text-sm text-gray-500">Define los tiempos máximos de resolución por prioridad.</p>
          {slaRules.map(rule => (
            <div key={rule.id} className="flex items-center gap-3 flex-wrap">
              <span className="w-20 text-sm font-medium text-gray-700">{rule.priority}</span>
              <div className="flex items-center gap-2">
                <Input type="number" value={rule.hours} min={1}
                  onChange={e => setSlaRules(prev => prev.map(r => r.id === rule.id ? { ...r, hours: +e.target.value } : r))}
                  className="w-20 h-9 text-center" />
                <span className="text-xs text-gray-500">h resolución</span>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" value={rule.warning} min={1}
                  onChange={e => setSlaRules(prev => prev.map(r => r.id === rule.id ? { ...r, warning: +e.target.value } : r))}
                  className="w-20 h-9 text-center" />
                <span className="text-xs text-gray-500">h alerta previa</span>
              </div>
            </div>
          ))}
        </CardContent></Card>
      )}

      {/* AUTO-ASSIGN */}
      {activeTab === 'autoassign' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Asigna automáticamente reportes por categoría al área correspondiente.</p>
          {autoRules.map(rule => (
            <Card key={rule.id}><CardContent className="p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{rule.category}</p>
                <select value={rule.area}
                  onChange={e => { setAutoRules(prev => prev.map(r => r.id === rule.id ? { ...r, area: e.target.value } : r)); toast.success('Regla actualizada') }}
                  className="field-input mt-1.5 h-9 text-xs">
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <button onClick={() => { setAutoRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r)) }}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  rule.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                {rule.active ? 'Activo' : 'Inactivo'}
              </button>
            </CardContent></Card>
          ))}
          <Button size="sm" variant="outline" onClick={() => {
            setAutoRules(prev => [...prev, { id: Date.now().toString(), category: 'Nueva', area: 'Servicios Públicos', active: true }])
            toast.success('Regla agregada')
          }}><Plus className="w-4 h-4 mr-1.5" />Agregar regla</Button>
        </div>
      )}

      {/* MESSAGES */}
      {activeTab === 'messages' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowNewMsg(true)}><Plus className="w-4 h-4 mr-1.5" />Nueva plantilla</Button>
          </div>
          {showNewMsg && (
            <Card className="border-civix-200 bg-civix-50"><CardContent className="p-4 space-y-3">
              <Input value={newMsg.name} onChange={e => setNewMsg(p => ({ ...p, name: e.target.value }))} placeholder="Nombre de la plantilla" />
              <textarea rows={3} value={newMsg.template} onChange={e => setNewMsg(p => ({ ...p, template: e.target.value }))}
                placeholder="Usa {nombre}, {folio}, {estado}..." className="field-input resize-none" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowNewMsg(false)}>Cancelar</Button>
                <Button size="sm" className="flex-1" onClick={() => {
                  if (!newMsg.name) return
                  setMessages(prev => [...prev, { id: Date.now().toString(), ...newMsg }])
                  setNewMsg({ name: '', template: '' }); setShowNewMsg(false); toast.success('Plantilla agregada')
                }}>Guardar</Button>
              </div>
            </CardContent></Card>
          )}
          {messages.map(msg => (
            <Card key={msg.id}><CardContent className="p-4">
              {editingMsg === msg.id ? (
                <div className="space-y-3">
                  <Input value={editMsgData.name} onChange={e => setEditMsgData(p => ({ ...p, name: e.target.value }))} />
                  <textarea rows={3} value={editMsgData.template} onChange={e => setEditMsgData(p => ({ ...p, template: e.target.value }))}
                    className="field-input resize-none" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingMsg(null)}>Cancelar</Button>
                    <Button size="sm" className="flex-1" onClick={() => {
                      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...editMsgData } : m))
                      setEditingMsg(null); toast.success('Plantilla actualizada')
                    }}>Guardar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{msg.name}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-2 rounded-lg">{msg.template}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditingMsg(msg.id); setEditMsgData({ name: msg.name, template: msg.template }) }}
                      className="p-1.5 text-gray-400 hover:text-civix-600 rounded-lg hover:bg-civix-50 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setMessages(prev => prev.filter(m => m.id !== msg.id)); toast.success('Plantilla eliminada') }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}
