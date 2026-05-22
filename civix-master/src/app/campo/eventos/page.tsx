'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Users, CheckCircle, Calendar, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const DEFAULT_EVENTS = [
  { id: 'ev-1', name: 'Brigada Mitras Centro — Zona Norte', type_label: 'Brigada', address: 'Av. Simón Bolívar y Río Mississippi', date: 'Hoy', time: '9:00 — 14:00', organizer: 'Laura Hernández', status: 'planned', goal: 30, captured: 12, staff: 3, checked_in: false },
  { id: 'ev-2', name: 'Puerta a Puerta — Col. Del Valle', type_label: 'Puerta a Puerta', address: 'Calle Río Amazonas 100–300', date: 'Mañana', time: '10:00 — 13:00', organizer: 'María López', status: 'planned', goal: 20, captured: 0, staff: 2, checked_in: false },
  { id: 'ev-3', name: 'Registro en Plaza Mitras', type_label: 'Registro', address: 'Plaza Mitras, Local 24', date: '12 Ene', time: '16:00 — 20:00', organizer: 'Laura Hernández', status: 'completed', goal: 50, captured: 43, staff: 4, checked_in: true },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planificado', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En curso', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completado', color: 'bg-gray-100 text-gray-700' },
}

export default function CampoEventosPage() {
  const [events, setEvents] = useState(DEFAULT_EVENTS)
  const [tab, setTab] = useState('all')

  // Load persisted state
  useEffect(() => {
    const stored = localStorage.getItem('campo_events')
    if (stored) {
      try { setEvents(JSON.parse(stored)) } catch {}
    }
  }, [])

  const persist = (updated: typeof DEFAULT_EVENTS) => {
    setEvents(updated)
    localStorage.setItem('campo_events', JSON.stringify(updated))
    // Also save the active event for the Home screen
    const active = updated.find(e => e.status === 'in_progress' && e.checked_in)
    if (active) {
      localStorage.setItem('campo_active_event', JSON.stringify(active))
    } else {
      localStorage.removeItem('campo_active_event')
    }
  }

  const handleCheckIn = (id: string) => {
    const updated = events.map(e =>
      e.id === id ? { ...e, status: 'in_progress', checked_in: true } : e
    )
    persist(updated)
    const ev = events.find(e => e.id === id)
    toast.success(`Check-in en "${ev?.name}"`, { description: 'Jornada iniciada' })
  }

  const handleCheckOut = (id: string) => {
    const updated = events.map(e =>
      e.id === id ? { ...e, status: 'completed', checked_in: true } : e
    )
    persist(updated)
    toast.success('Jornada terminada', { description: 'Buen trabajo. Los registros quedan guardados.' })
  }

  const filtered = events.filter(e => {
    if (tab === 'active') return e.status === 'in_progress' || e.status === 'planned'
    if (tab === 'done') return e.status === 'completed'
    return true
  })

  return (
    <div className="px-4 pt-4 space-y-4 pb-24">
      <div><h1 className="text-xl font-bold text-gray-900">Eventos y brigadas</h1><p className="text-sm text-gray-500">Tus eventos asignados</p></div>
      <div className="flex gap-2">
        {[{ id: 'all', label: 'Todos' }, { id: 'active', label: 'Activos' }, { id: 'done', label: 'Historial' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('px-4 py-2 rounded-full text-sm font-medium', tab === t.id ? 'bg-civix-500 text-white' : 'bg-gray-100 text-gray-600')}>{t.label}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((event) => {
          const st = STATUS_MAP[event.status] || STATUS_MAP.planned
          return (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><Badge className={st.color}>{st.label}</Badge><Badge variant="outline">{event.type_label}</Badge></div>
                  <span className="text-xs text-gray-400">{event.date}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{event.name}</h3>
                <div className="space-y-1 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.address}</div>
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{event.time}</div>
                  <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{event.staff} brigadistas • Org: {event.organizer}</div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Meta</span><span className="font-semibold">{event.captured} / {event.goal}</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={cn('h-full rounded-full', event.status === 'completed' ? 'bg-gray-400' : 'bg-civix-500')} style={{ width: `${Math.min((event.captured / event.goal) * 100, 100)}%` }} /></div>
                </div>
                {/* Check-in button */}
                {event.status === 'planned' && (
                  <Button className="w-full bg-civix-500 hover:bg-civix-600" onClick={() => handleCheckIn(event.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" />Check-in
                  </Button>
                )}
                {/* End shift button */}
                {event.status === 'in_progress' && event.checked_in && (
                  <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleCheckOut(event.id)}>
                    <LogOut className="w-4 h-4 mr-2" />Terminar jornada
                  </Button>
                )}
                {/* Completed state */}
                {event.status === 'completed' && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4" /> Completado
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No hay eventos con este filtro</p>
          </div>
        )}
      </div>
    </div>
  )
}
