'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Building2, Tags, GitBranch, Clock, Calendar, Zap, MessageSquare,
  Save, Plus, Trash2, GripVertical, Edit2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'general', label: 'Generales', icon: Building2 },
  { id: 'categories', label: 'Categorías', icon: Tags },
  { id: 'states', label: 'Estados', icon: GitBranch },
  { id: 'sla', label: 'SLA', icon: Clock },
  { id: 'hours', label: 'Horarios', icon: Calendar },
  { id: 'autoassign', label: 'Asignación auto', icon: Zap },
  { id: 'messages', label: 'Mensajes', icon: MessageSquare },
]

const mockCategories = [
  { id: '1', name: 'Baches', icon: '🕳️', defaultArea: 'Servicios Públicos', active: true },
  { id: '2', name: 'Alumbrado', icon: '💡', defaultArea: 'Servicios Públicos', active: true },
  { id: '3', name: 'Basura', icon: '🗑️', defaultArea: 'Limpia', active: true },
  { id: '4', name: 'Agua', icon: '💧', defaultArea: 'Agua y Drenaje', active: true },
  { id: '5', name: 'Parques', icon: '🌳', defaultArea: 'Parques', active: true },
]

const mockStates = [
  { id: '1', name: 'Nuevo', color: '#3B82F6', citizenLabel: 'Recibido' },
  { id: '2', name: 'Sin asignar', color: '#F97316', citizenLabel: 'Recibido' },
  { id: '3', name: 'Asignado', color: '#8B5CF6', citizenLabel: 'En proceso' },
  { id: '4', name: 'En campo', color: '#06B6D4', citizenLabel: 'En proceso' },
  { id: '5', name: 'Resuelto', color: '#10B981', citizenLabel: 'Resuelto' },
  { id: '6', name: 'No procede', color: '#6B7280', citizenLabel: 'No procede' },
]

const mockMessages = [
  { id: '1', name: 'Reporte recibido', template: 'Hola {nombre}, recibimos tu reporte {folio}.' },
  { id: '2', name: 'Cambio de estado', template: 'Tu reporte {folio} cambió a: {estado}.' },
  { id: '3', name: 'Resuelto', template: '¡Tu reporte {folio} fue resuelto! Califica nuestro servicio.' },
]

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500">Configura el comportamiento del municipio</p>
        </div>
        {hasChanges && (
          <Button onClick={() => setHasChanges(false)}>
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        )}
      </div>

      <div className="border-b overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-civix-500 text-civix-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'general' && (
        <Card>
          <CardHeader><CardTitle>Información del municipio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <Input defaultValue="Monterrey" onChange={() => setHasChanges(true)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <Input defaultValue="Nuevo León" onChange={() => setHasChanges(true)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prefijo folios</label>
                <Input defaultValue="CIV" onChange={() => setHasChanges(true)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option>America/Monterrey (UTC-6)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'categories' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Categorías de reportes</CardTitle>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />Nueva</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockCategories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-sm text-gray-500">Área: {cat.defaultArea}</p>
                  </div>
                  <Badge variant={cat.active ? 'success' : 'gray'}>{cat.active ? 'Activa' : 'Inactiva'}</Badge>
                  <button className="p-1 text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'states' && (
        <Card>
          <CardHeader><CardTitle>Estados internos</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Estados por los que pasa un reporte.</p>
            <div className="space-y-2">
              {mockStates.map((state) => (
                <div key={state.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: state.color }} />
                  <div className="flex-1">
                    <p className="font-medium">{state.name}</p>
                    <p className="text-sm text-gray-500">Ciudadano ve: "{state.citizenLabel}"</p>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'sla' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Primera respuesta</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tiempo límite (horas)</label>
                  <Input type="number" defaultValue="24" onChange={() => setHasChanges(true)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alerta (horas antes)</label>
                  <Input type="number" defaultValue="4" onChange={() => setHasChanges(true)} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Resolución</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tiempo límite (horas)</label>
                  <Input type="number" defaultValue="48" onChange={() => setHasChanges(true)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alerta (horas antes)</label>
                  <Input type="number" defaultValue="8" onChange={() => setHasChanges(true)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'hours' && (
        <Card>
          <CardHeader><CardTitle>Horario laboral</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">SLA solo cuenta en horario laboral.</p>
            <div className="space-y-3">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <label className="w-24 font-medium">{day}</label>
                  <Input type="time" defaultValue="08:00" className="w-32" />
                  <span>a</span>
                  <Input type="time" defaultValue="18:00" className="w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'autoassign' && (
        <Card>
          <CardHeader><CardTitle>Asignación automática</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Asigna reportes automáticamente por categoría.</p>
            <div className="space-y-3 mb-4">
              {[{from: 'Baches', to: 'Servicios Públicos'}, {from: 'Basura', to: 'Limpia'}].map((rule, i) => (
                <div key={i} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{rule.from} → {rule.to}</p>
                    <p className="text-sm text-gray-500">Asignación automática activa</p>
                  </div>
                  <Badge variant="success">Activa</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline"><Plus className="w-4 h-4 mr-1" />Nueva regla</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'messages' && (
        <Card>
          <CardHeader><CardTitle>Plantillas de mensajes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Variables: {'{nombre}'}, {'{folio}'}, {'{estado}'}, {'{categoria}'}
            </p>
            <div className="space-y-4">
              {mockMessages.map((msg) => (
                <div key={msg.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{msg.name}</p>
                    <button className="text-civix-600 text-sm">Editar</button>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{msg.template}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
