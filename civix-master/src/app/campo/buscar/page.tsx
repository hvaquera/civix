'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, UserPlus, Phone, MapPin, Calendar, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Remove accents for search comparison
const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const mockContacts = [
  { id: '1', name: 'María García López', seccion: '1234', colonia: 'Mitras Centro', phone: '****5678', support: 'soft_supporter', last_contact: '2024-01-14', captured_by: 'Roberto Sánchez', interactions: 3 },
  { id: '2', name: 'Juan Hernández Pérez', seccion: '1234', colonia: 'Mitras Centro', phone: '****9012', support: 'hard_supporter', last_contact: '2024-01-15', captured_by: 'Roberto Sánchez', interactions: 5 },
  { id: '3', name: 'Ana Sofía Garza Treviño', seccion: '1234', colonia: 'Mitras Centro', phone: '****3456', support: 'undecided', last_contact: '2024-01-10', captured_by: 'Ana Gómez', interactions: 1 },
  { id: '4', name: 'Pedro Martínez Reyes', seccion: '1236', colonia: 'Del Valle', phone: '****7890', support: 'unknown', last_contact: '2024-01-12', captured_by: 'Carlos Pérez', interactions: 2 },
]

const SUPPORT_MAP: Record<string, { label: string; color: string }> = {
  hard_supporter: { label: 'Simpatizante', color: 'bg-green-100 text-green-700' },
  soft_supporter: { label: 'Probable', color: 'bg-blue-100 text-blue-700' },
  undecided: { label: 'Indeciso', color: 'bg-yellow-100 text-yellow-700' },
  unknown: { label: 'Sin clasificar', color: 'bg-gray-100 text-gray-700' },
}

export default function CampoBuscarPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'my' | 'all'>('my')
  const [selected, setSelected] = useState<typeof mockContacts[0] | null>(null)
  const [showInteractionModal, setShowInteractionModal] = useState(false)

  const results = query.length >= 2
    ? mockContacts.filter(c =>
        normalize(c.name).includes(normalize(query)) ||
        c.seccion.includes(query) ||
        normalize(c.colonia).includes(normalize(query))
      )
    : []

  return (
    <div className="px-4 pt-4 space-y-4 pb-24">
      <h1 className="text-xl font-bold text-gray-900">Buscar ciudadano</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Nombre, sección o colonia..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
          className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-civix-500"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={() => setScope('my')} className={cn('px-3 py-1.5 rounded-full text-sm font-medium', scope === 'my' ? 'bg-civix-500 text-white' : 'bg-gray-100 text-gray-600')}>Mi territorio</button>
        <button onClick={() => setScope('all')} className={cn('px-3 py-1.5 rounded-full text-sm font-medium', scope === 'all' ? 'bg-civix-500 text-white' : 'bg-gray-100 text-gray-600')}>Todo el municipio</button>
      </div>

      {query.length >= 2 && (
        <div className="space-y-2">
          {results.map((contact) => {
            const support = SUPPORT_MAP[contact.support]
            return (
              <Card key={contact.id} className={cn('cursor-pointer transition-shadow', selected?.id === contact.id && 'ring-2 ring-civix-500')} onClick={() => setSelected(selected?.id === contact.id ? null : contact)}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <Badge className={cn('text-xs', support.color)}>{support.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Sección {contact.seccion} • {contact.colonia}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span><Phone className="w-3 h-3 inline" /> {contact.phone}</span>
                    <span><Calendar className="w-3 h-3 inline" /> {contact.last_contact}</span>
                    <span>Capturado por: {contact.captured_by}</span>
                  </div>
                  {selected?.id === contact.id && (
                    <div className="mt-3 pt-3 border-t flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); setShowInteractionModal(true) }}>
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />Nueva interacción
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {results.length === 0 && (
            <div className="text-center py-10">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm mb-3">No encontrado</p>
              <Button onClick={() => router.push('/campo/registro/ine')}><UserPlus className="w-4 h-4 mr-2" />Registrar nuevo ciudadano</Button>
            </div>
          )}
        </div>
      )}

      {query.length < 2 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Escribe al menos 2 caracteres para buscar</p>
        </div>
      )}

      {showInteractionModal && selected && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-end sm:items-center justify-center" onClick={() => setShowInteractionModal(false)}>
          <Card className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-1">Nueva interacción</h3>
            <p className="text-sm text-gray-500 mb-4">Con {selected.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option>Visita</option><option>Llamada</option><option>Evento</option><option>WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
                <textarea rows={3} placeholder="¿Qué se habló?" className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowInteractionModal(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => { toast.success('Interacción registrada'); setShowInteractionModal(false) }}>Guardar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
