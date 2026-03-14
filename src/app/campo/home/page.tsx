'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, MapPin, Clock, Calendar, RefreshCw, Wifi, WifiOff, Target, Flame, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Seed upcoming events if none exist
const SEED_EVENTS = [
  { id: 'ev-1', name: 'Brigada Mitras Centro — Zona Norte', type_label: 'Brigada', address: 'Av. Simón Bolívar y Río Mississippi', date: 'Hoy', time: '9:00 — 14:00', organizer: 'Laura Hernández', status: 'planned', goal: 30, captured: 0, staff: 3, checked_in: false },
  { id: 'ev-2', name: 'Puerta a Puerta — Col. Del Valle', type_label: 'Puerta a Puerta', address: 'Calle Río Amazonas 100–300', date: 'Mañana', time: '10:00 — 13:00', organizer: 'María López', status: 'planned', goal: 20, captured: 0, staff: 2, checked_in: false },
  { id: 'ev-3', name: 'Caminata con Candidato — Obispado', type_label: 'Caminata', address: 'Calle Padre Mier y Constitución', date: 'Lunes', time: '17:00 — 20:00', organizer: 'Carlos Salinas', status: 'planned', goal: 50, captured: 0, staff: 6, checked_in: false },
  { id: 'ev-4', name: 'Registro en Plaza Mitras', type_label: 'Registro', address: 'Plaza Mitras, Local 24', date: '12 Ene', time: '16:00 — 20:00', organizer: 'Laura Hernández', status: 'completed', goal: 50, captured: 43, staff: 4, checked_in: true },
]

export default function CampoHomePage() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const [activeEvent, setActiveEvent] = useState<any>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [stats, setStats] = useState({ today: 0, pendingSync: 0, totalHistoric: 0, events: 0, streak: 0, monthGoal: 50, monthCaptured: 0 })
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)

    const storedSession = localStorage.getItem('campo_session')
    if (!storedSession) { router.push('/campo/login'); return }
    try { setSession(JSON.parse(storedSession)) } catch {}

    // Seed events if none exist
    let events = JSON.parse(localStorage.getItem('campo_events') || '[]')
    if (events.length === 0) {
      events = SEED_EVENTS
      localStorage.setItem('campo_events', JSON.stringify(events))
    }

    // Active event
    const active = events.find((e: any) => e.status === 'in_progress' && e.checked_in)
    setActiveEvent(active || null)
    if (active) localStorage.setItem('campo_active_event', JSON.stringify(active))
    else localStorage.removeItem('campo_active_event')

    // Upcoming events (planned, not checked in)
    const upcoming = events.filter((e: any) => e.status === 'planned' && !e.checked_in)
    setUpcomingEvents(upcoming)

    // Stats
    const registros = JSON.parse(localStorage.getItem('campo_registros') || '[]')
    const today = new Date().toISOString().split('T')[0]
    const todayCount = registros.filter((r: any) => r.captured_at?.startsWith(today)).length
    const pendingCount = registros.filter((r: any) => r.sync_status === 'pending').length
    const completedEvents = events.filter((e: any) => e.status === 'completed').length

    setStats({
      today: todayCount, pendingSync: pendingCount, totalHistoric: registros.length,
      events: completedEvents, streak: registros.length > 0 ? 1 : 0,
      monthGoal: 50, monthCaptured: registros.length,
    })

    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [router])

  const userName = session?.name?.split(' ')[0] || 'Roberto'
  const roleLabel = session?.role_label || 'Brigadista'
  const territory = session?.territory?.colonia || 'Mitras Centro'

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <h1 className="text-xl font-bold text-gray-900">Hola, {userName}</h1>
          <p className="text-sm text-gray-500">{roleLabel} • {territory}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {stats.pendingSync > 0 && (
            <Link href="/campo/registros">
              <button className="relative p-2 rounded-full bg-orange-50">
                <RefreshCw className="w-5 h-5 text-orange-500" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{stats.pendingSync}</span>
              </button>
            </Link>
          )}
          <div className={cn('p-2 rounded-full', isOnline ? 'bg-green-50' : 'bg-orange-50')}>
            {isOnline ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-orange-500" />}
          </div>
        </div>
      </div>

      {/* CTA */}
      <Link href="/campo/registro/ine">
        <Card className="bg-gradient-to-r from-civix-500 to-civix-600 text-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div><p className="text-lg font-bold">Nuevo registro</p><p className="text-civix-100 text-sm">Capturar ciudadano con INE</p></div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><UserPlus className="w-7 h-7 text-white" /></div>
          </CardContent>
        </Card>
      </Link>

      {/* Active Event */}
      {activeEvent ? (
        <Link href="/campo/eventos">
          <Card className="border-civix-200 bg-civix-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-green-100 text-green-700">En curso</Badge>
                <span className="text-xs text-gray-500">{activeEvent.time}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{activeEvent.name}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-3"><MapPin className="w-3.5 h-3.5" />{activeEvent.address}</div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Meta del evento</span>
                  <span className="font-semibold text-civix-600">{activeEvent.captured} / {activeEvent.goal}</span>
                </div>
                <div className="h-2 bg-civix-100 rounded-full overflow-hidden">
                  <div className="h-full bg-civix-500 rounded-full transition-all" style={{ width: `${(activeEvent.captured / activeEvent.goal) * 100}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Link href="/campo/eventos">
          <Card className="border-dashed border-gray-300">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-600">Sin evento activo</p>
                <p className="text-xs text-gray-400">Haz check-in en un evento para comenzar</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Próximos eventos</h3>
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map((ev) => (
              <Link href="/campo/eventos" key={ev.id}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{ev.date}</span>
                        <span>•</span>
                        <span>{ev.time}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{ev.type_label}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-gray-900">{stats.today}</p><p className="text-xs text-gray-500">Registros hoy</p></CardContent></Card>
        <Link href="/campo/registros">
          <Card className={cn(stats.pendingSync > 0 && 'border-orange-200 bg-orange-50')}><CardContent className="p-3 text-center"><p className={cn('text-2xl font-bold', stats.pendingSync > 0 ? 'text-orange-600' : 'text-gray-900')}>{stats.pendingSync}</p><p className="text-xs text-gray-500">Sin enviar</p></CardContent></Card>
        </Link>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-civix-600">{stats.monthGoal > 0 ? Math.round((stats.monthCaptured / stats.monthGoal) * 100) : 0}%</p><p className="text-xs text-gray-500">Meta mes</p></CardContent></Card>
      </div>

      {/* Stats detail */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Mis estadísticas</h3>
          <div className="space-y-3">
            {[
              { icon: Target, label: 'Total registros', value: stats.totalHistoric, color: 'text-civix-500' },
              { icon: Calendar, label: 'Eventos completados', value: stats.events, color: 'text-civix-500' },
              { icon: Flame, label: 'Racha', value: stats.streak > 0 ? `${stats.streak} días` : '—', color: 'text-orange-500' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600"><s.icon className={cn('w-4 h-4', s.color)} /><span>{s.label}</span></div>
                <span className="font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
