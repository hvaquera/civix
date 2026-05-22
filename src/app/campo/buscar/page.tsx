'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, UserPlus, Phone, MapPin, Calendar, MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const SEED = [
  { id: 's1', name: 'María García López',      seccion: '1234', colonia: 'Mitras Centro', phone: '****5678', support: 'soft_supporter', last_contact: '2025-01-14', captured_by: 'Roberto Sánchez', interactions: 3 },
  { id: 's2', name: 'Juan Hernández Pérez',    seccion: '1234', colonia: 'Mitras Centro', phone: '****9012', support: 'hard_supporter', last_contact: '2025-01-15', captured_by: 'Roberto Sánchez', interactions: 5 },
  { id: 's3', name: 'Ana Sofía Garza Treviño', seccion: '1234', colonia: 'Mitras Centro', phone: '****3456', support: 'undecided',      last_contact: '2025-01-10', captured_by: 'Ana Gómez',        interactions: 1 },
  { id: 's4', name: 'Pedro Martínez Reyes',    seccion: '1236', colonia: 'Del Valle',     phone: '****7890', support: 'unknown',        last_contact: '2025-01-12', captured_by: 'Carlos Pérez',      interactions: 2 },
]

const SUPPORT_MAP: Record<string, { label: string; variant: any }> = {
  hard_supporter: { label: 'Simpatizante', variant: 'success' },
  soft_supporter: { label: 'Probable',     variant: 'info' },
  undecided:      { label: 'Indeciso',     variant: 'warning' },
  unknown:        { label: 'Sin clasificar', variant: 'gray' },
}

export default function CampoBuscarPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'my' | 'all'>('my')
  const [contacts, setContacts] = useState(SEED)
  const [selected, setSelected] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [interactionType, setInteractionType] = useState('Visita')
  const [interactionNote, setInteractionNote] = useState('')

  // Merge localStorage registros into searchable contacts
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('campo_registros') || '[]')
      const mapped = stored.map((r: any) => ({
        id: r.id,
        name: [r.name, r.paternal, r.maternal].filter(Boolean).join(' ') || r.name || 'Sin nombre',
        seccion: r.seccion || '—',
        colonia: r.colonia || '—',
        phone: r.phone ? `****${r.phone.slice(-4)}` : '—',
        support: r.support_level || 'unknown',
        last_contact: r.captured_at?.split('T')[0] || '—',
        captured_by: r.captured_by || 'Yo',
        interactions: 1,
        fromLocal: true,
      }))
      setContacts([...SEED, ...mapped])
    } catch {}
  }, [])

  const results = query.length >= 2
    ? contacts.filter(c => {
        const q = normalize(query)
        return normalize(c.name).includes(q) ||
               c.seccion.includes(q) ||
               normalize(c.colonia).includes(q) ||
               (c.phone && c.phone.includes(q))
      })
    : []

  const handleSaveInteraction = () => {
    toast.success('Interacción registrada')
    setShowModal(false)
    setInteractionNote('')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 pt-4 pb-3 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Buscar ciudadano</h1>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nombre, sección, colonia..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-civix-500"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          {(['my', 'all'] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                scope === s ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600')}>
              {s === 'my' ? 'Mi territorio' : 'Todo el municipio'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {query.length >= 2 ? (
          <>
            {results.length > 0 ? (
              <>
                <p className="text-xs text-gray-400 mb-2">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
                {results.map((c) => {
                  const sup = SUPPORT_MAP[c.support] || SUPPORT_MAP.unknown
                  const isSelected = selected?.id === c.id
                  return (
                    <Card key={c.id}
                      className={cn('cursor-pointer transition-all', isSelected && 'ring-2 ring-civix-500 shadow-md')}
                      onClick={() => setSelected(isSelected ? null : c)}>
                      <CardContent className="p-3.5">
                        <div className="flex items-start justify-between mb-1.5">
                          <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                          <Badge variant={sup.variant}>{sup.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Sección {c.seccion} · {c.colonia}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.last_contact}</span>
                        </div>
                        {'fromLocal' in c && c.fromLocal && (
                          <span className="inline-block mt-1.5 text-xs bg-civix-50 text-civix-600 border border-civix-100 px-2 py-0.5 rounded-full">Capturado por ti</span>
                        )}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1"
                              onClick={(e) => { e.stopPropagation(); setShowModal(true) }}>
                              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Nueva interacción
                            </Button>
                            <Button size="sm" className="flex-1"
                              onClick={(e) => { e.stopPropagation(); toast.success('Abriendo seguimiento...') }}>
                              Ver ficha
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-1">No se encontró a "{query}"</p>
                <p className="text-gray-400 text-sm mb-5">¿Deseas registrarlo como ciudadano nuevo?</p>
                <Button onClick={() => router.push('/campo/registro/ine')}>
                  <UserPlus className="w-4 h-4 mr-2" />Registrar ciudadano
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Escribe al menos 2 caracteres para buscar</p>
            <p className="text-gray-300 text-xs mt-1">{contacts.length} ciudadanos en tu base local</p>
          </div>
        )}
      </div>

      {/* Interaction modal */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-md rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Nueva interacción</h3>
                  <p className="text-sm text-gray-500">{selected.name}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Tipo</label>
                  <select value={interactionType} onChange={(e) => setInteractionType(e.target.value)} className="field-input">
                    <option>Visita</option><option>Llamada</option><option>Evento</option><option>WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Nota</label>
                  <textarea rows={3} placeholder="¿Qué se habló?" value={interactionNote}
                    onChange={(e) => setInteractionNote(e.target.value)}
                    className="field-input resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="md" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button size="md" className="flex-1" onClick={handleSaveInteraction}>Guardar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
