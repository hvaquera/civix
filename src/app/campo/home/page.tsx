'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, MapPin, Calendar, RefreshCw, Wifi, WifiOff, Target, Flame, ChevronRight, Route } from 'lucide-react'
import { cn } from '@/lib/utils'

const SEED_EVENTS = [
  { id: 'ev-1', name: 'Brigada Mitras Centro — Zona Norte', type_label: 'Brigada', address: 'Av. Simón Bolívar y Río Mississippi', date: 'Hoy', time: '9:00 — 14:00', organizer: 'Laura Hernández', status: 'planned', goal: 30, captured: 12, staff: 3, checked_in: false },
  { id: 'ev-2', name: 'Puerta a Puerta — Col. Del Valle', type_label: 'Puerta a Puerta', address: 'Calle Río Amazonas 100–300', date: 'Mañana', time: '10:00 — 13:00', organizer: 'María López', status: 'planned', goal: 20, captured: 0, staff: 2, checked_in: false },
  { id: 'ev-3', name: 'Registro en Plaza Mitras', type_label: 'Registro', address: 'Plaza Mitras, Local 24', date: '12 Ene', time: '16:00 — 20:00', organizer: 'Laura Hernández', status: 'completed', goal: 50, captured: 43, staff: 4, checked_in: true },
]

// Smart route suggestion
const SMART_ROUTES = [
  { street: 'Av. Simón Bolívar 300–400', pending: 7 },
  { street: 'Calle Río Pánuco 100–200', pending: 4 },
  { street: 'Calle Platón 450–550', pending: 3 },
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

    const stored = localStorage.getItem('campo_session')
    if (!stored) { router.push('/campo/login'); return }
    try { setSession(JSON.parse(stored)) } catch {}

    let events: any[] = []
    try { events = JSON.parse(localStorage.getItem('campo_events') || '[]') } catch {}
    const hasPlanned = events.some((e: any) => e.status === 'planned')
    if (events.length === 0 || !hasPlanned) {
      const completed = events.filter((e: any) => e.status === 'completed')
      events = [...completed, ...SEED_EVENTS.filter(e => e.status === 'planned')]
      localStorage.setItem('campo_events', JSON.stringify(events))
    }

    setActiveEvent(events.find((e: any) => e.status === 'in_progress' && e.checked_in) || null)
    setUpcomingEvents(events.filter((e: any) => e.status === 'planned'))

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

  const firstName = session?.name?.split(' ')[0] || 'Roberto'
  const roleLabel = session?.role_label || 'Brigadista'
  const territory = session?.territory?.colonia || 'Mitras Centro'

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Topbar */}
      <div className="bg-navy-900 px-4 pt-12 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-navy-400 text-xs">Hola,</p>
            <h1 className="text-xl font-bold text-white">{firstName}</h1>
            <p className="text-navy-400 text-xs mt-0.5">{roleLabel} · {territory}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {stats.pendingSync > 0 && (
              <Link href="/campo/registros">
                <div className="relative flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full px-2.5 py-1.5">
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">{stats.pendingSync}</span>
                </div>
              </Link>
            )}
            <div className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1.5',
              isOnline ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-amber-500/20 border border-amber-500/30'
            )}>
              {isOnline
                ? <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-xs font-medium text-emerald-400">Online</span></>
                : <><WifiOff className="w-3 h-3 text-amber-400" /><span className="text-xs font-medium text-amber-400">Offline</span></>
              }
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { value: stats.today,       label: 'Hoy',        color: 'text-white' },
            { value: stats.pendingSync, label: 'Sin enviar',  color: stats.pendingSync > 0 ? 'text-amber-400' : 'text-white' },
            { value: `${stats.monthGoal > 0 ? Math.round((stats.monthCaptured / stats.monthGoal) * 100) : 0}%`, label: 'Meta mes', color: 'text-civix-400' },
          ].map((s) => (
            <div key={s.label} className="bg-navy-800/60 rounded-xl p-2.5 text-center">
              <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
              <p className="text-navy-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-3 pb-6">
        {/* CTA */}
        <Link href="/campo/registro/ine">
          <Card className="bg-civix-500 border-0 shadow-md shadow-civix-900/20 overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Nuevo registro</p>
                <p className="text-civix-200 text-xs mt-0.5">Capturar ciudadano con INE</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Active event */}
        {activeEvent ? (
          <Link href="/campo/eventos">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="success">En curso</Badge>
                  <span className="text-xs text-gray-400">{activeEvent.time}</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{activeEvent.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                  <MapPin className="w-3 h-3" />{activeEvent.address}
                </div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Meta</span>
                  <span className="font-semibold text-civix-600">{activeEvent.captured}/{activeEvent.goal}</span>
                </div>
                <div className="progress-thin">
                  <div className="progress-thin-fill" style={{ width: `${Math.min((activeEvent.captured/activeEvent.goal)*100, 100)}%` }} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/campo/eventos">
            <Card className="border-dashed">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-600 text-sm">Sin evento activo</p>
                  <p className="text-xs text-gray-400">Haz check-in en un evento</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Smart route suggestion */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-civix-50 rounded-lg flex items-center justify-center">
                <Route className="w-3.5 h-3.5 text-civix-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Ruta sugerida para hoy</p>
            </div>
            <div className="space-y-2">
              {SMART_ROUTES.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-navy-900 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-sm text-gray-700">{r.street}</span>
                  </div>
                  <span className="text-xs font-semibold text-civix-600 bg-civix-50 px-2 py-0.5 rounded-full">{r.pending} pendientes</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <div>
            <p className="section-label mb-2">Próximos eventos</p>
            <div className="space-y-2">
              {upcomingEvents.slice(0, 2).map((ev) => (
                <Link href="/campo/eventos" key={ev.id}>
                  <Card className="card-lift">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-9 h-9 bg-civix-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-civix-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ev.name}</p>
                        <p className="text-xs text-gray-400">{ev.date} · {ev.time}</p>
                      </div>
                      <Badge variant="indigo" className="flex-shrink-0 text-xs">{ev.type_label}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats card */}
        <Card>
          <CardContent className="p-4">
            <p className="font-semibold text-gray-900 mb-3 text-sm">Mis estadísticas</p>
            <div className="space-y-3">
              {[
                { icon: Target,  label: 'Total registros',      value: stats.totalHistoric, color: 'text-civix-500' },
                { icon: Calendar,label: 'Eventos completados',  value: stats.events,        color: 'text-civix-500' },
                { icon: Flame,   label: 'Racha activa',         value: stats.totalHistoric > 0 ? '1 día' : '—', color: 'text-amber-500' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <s.icon className={cn('w-4 h-4', s.color)} />
                    <span>{s.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
