'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, MapPin, Calendar, RefreshCw, Wifi, WifiOff, Target, Flame, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [stats, setStats] = useState({ today: 0, pendingSync: 0, totalHistoric: 0, events: 0, monthGoal: 50, monthCaptured: 0 })
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

    // Load or seed events — ALWAYS check and re-seed if needed
    let events: any[] = []
    try { events = JSON.parse(localStorage.getItem('campo_events') || '[]') } catch {}
    // If no planned events exist, re-seed
    const hasPlanned = events.some((e: any) => e.status === 'planned')
    if (events.length === 0 || !hasPlanned) {
      // Keep completed events, add new planned ones
      const completed = events.filter((e: any) => e.status === 'completed')
      const planned = SEED_EVENTS.filter(e => e.status === 'planned')
      events = [...completed, ...planned]
      localStorage.setItem('campo_events', JSON.stringify(events))
    }

    const active = events.find((e: any) => e.status === 'in_progress' && e.checked_in)
    setActiveEvent(active || null)

    const upcoming = events.filter((e: any) => e.status === 'planned')
    setUpcomingEvents(upcoming)

    // Stats
    const registros = JSON.parse(localStorage.getItem('campo_registros') || '[]')
    const today = new Date().toISOString().split('T')[0]

    setStats({
      today: registros.filter((r: any) => r.captured_at?.startsWith(today)).length,
      pendingSync: registros.filter((r: any) => r.sync_status === 'pending').length,
      totalHistoric: registros.length,
      events: events.filter((e: any) => e.status === 'completed').length,
      monthGoal: 50,
      monthCaptured: registros.length,
    })

    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [router])

  const userName = session?.name?.split(' ')[0] || 'Roberto'
  const roleLabel = session?.role_label || 'Brigadista'
  const territory = session?.territory?.colonia || 'Mitras Centro'

  return (
    <div className="px-4 pt-4 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
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

      {/* CTA — smaller, proportional */}
      <Link href="/campo/registro/ine" className="block mb-4">
        <Card className="bg-gradient-to-r from-civix-500 to-civix-600 text-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="font-bold">Nuevo registro</p><p className="text-civix-100 text-xs">Capturar ciudadano con INE</p></div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><UserPlus className="w-5 h-5 text-white" /></div>
          </CardContent>
        </Card>
      </Link>

      {/* Active Event */}
      {activeEvent ? (
        <Link href="/campo/eventos" className="block mb-4">
          <Card className="border-civix-200 bg-civix-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-green-100 text-green-700">En curso</Badge>
                <span className="text-xs text-gray-500">{activeEvent.time}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{activeEvent.name}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2"><MapPin className="w-3 h-3" />{activeEvent.address}</div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Meta</span>
                  <span className="font-semibold text-civix-600">{activeEvent.captured}/{activeEvent.goal}</span>
                </div>
                <div className="h-1.5 bg-civix-100 rounded-full overflow-hidden">
                  <div className="h-full bg-civix-500 rounded-full" style={{ width: `${(activeEvent.captured / activeEvent.goal) * 100}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Link href="/campo/eventos" className="block mb-4">
          <Card className="border-dashed border-gray-300">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-600 text-sm">Sin evento activo</p>
                <p className="text-xs text-gray-400">Haz check-in en un evento</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Próximos eventos</h3>
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map((ev) => (
              <Link href="/campo/eventos" key={ev.id}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.name}</p>
                      <p className="text-xs text-gray-500">{ev.date} • {ev.time}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{ev.type_label}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-gray-900">{stats.today}</p><p className="text-xs text-gray-500">Hoy</p></CardContent></Card>
        <Link href="/campo/registros">
          <Card className={cn(stats.pendingSync > 0 && 'border-orange-200 bg-orange-50')}><CardContent className="p-3 text-center"><p className={cn('text-2xl font-bold', stats.pendingSync > 0 ? 'text-orange-600' : 'text-gray-900')}>{stats.pendingSync}</p><p className="text-xs text-gray-500">Sin enviar</p></CardContent></Card>
        </Link>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-civix-600">{stats.monthGoal > 0 ? Math.round((stats.monthCaptured / stats.monthGoal) * 100) : 0}%</p><p className="text-xs text-gray-500">Meta mes</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Mis estadísticas</h3>
          <div className="space-y-3">
            {[
              { icon: Target, label: 'Total registros', value: stats.totalHistoric, color: 'text-civix-500' },
              { icon: Calendar, label: 'Eventos completados', value: stats.events, color: 'text-civix-500' },
              { icon: Flame, label: 'Racha', value: stats.totalHistoric > 0 ? '1 día' : '—', color: 'text-orange-500' },
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
