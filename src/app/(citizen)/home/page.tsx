'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Construction, 
  Lightbulb, 
  Trash2, 
  TreePine,
  Droplets,
  ShieldAlert,
  ChevronRight,
  Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_CITIZEN_LABELS, STATUS_CITIZEN_COLORS, formatRelativeTime } from '@/lib/utils'

// Mock data
const mockUser = {
  name: 'Juan',
  colonia: 'Centro',
}

const mockRecentReports = [
  {
    id: '1',
    folio: 'CIV-2024-00123',
    category: 'Baches',
    categoryIcon: Construction,
    status: 'en_proceso',
    colonia: 'Centro',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    folio: 'CIV-2024-00098',
    category: 'Alumbrado',
    categoryIcon: Lightbulb,
    status: 'resuelto',
    colonia: 'Centro',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const categories = [
  { id: 'baches', label: 'Baches', icon: Construction, color: 'bg-orange-100 text-orange-600' },
  { id: 'alumbrado', label: 'Alumbrado', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'basura', label: 'Basura', icon: Trash2, color: 'bg-green-100 text-green-600' },
  { id: 'parques', label: 'Parques', icon: TreePine, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'agua', label: 'Agua', icon: Droplets, color: 'bg-blue-100 text-blue-600' },
  { id: 'seguridad', label: 'Seguridad', icon: ShieldAlert, color: 'bg-red-100 text-red-600' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-civix-600 text-white px-6 pt-12 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-civix-100 text-sm">Hola,</p>
            <h1 className="text-2xl font-bold">{mockUser.name}</h1>
          </div>
          <button className="relative p-2 hover:bg-white/10 rounded-full">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        {/* CTA Card */}
        <Link href="/reportar">
          <Card className="bg-white text-gray-900 p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
            <div className="p-3 bg-civix-100 rounded-xl">
              <Plus className="w-6 h-6 text-civix-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">Reportar un problema</h2>
              <p className="text-sm text-gray-500">Baches, alumbrado, basura y más</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Card>
        </Link>
      </div>

      {/* Quick categories */}
      <div className="px-6 -mt-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Acceso rápido</h3>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/reportar?categoria=${cat.id}`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className={cn('p-2 rounded-lg', cat.color)}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-600">{cat.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent reports */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Tus reportes recientes</h3>
          <Link href="/mis-reportes" className="text-sm text-civix-600 font-medium">
            Ver todos
          </Link>
        </div>

        {mockRecentReports.length > 0 ? (
          <div className="space-y-3">
            {mockRecentReports.map((report) => (
              <Link key={report.id} href={`/mis-reportes/${report.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <report.categoryIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {report.category}
                        </span>
                        <Badge 
                          variant={report.status === 'resuelto' ? 'success' : 'purple'}
                          className="text-xs"
                        >
                          {STATUS_CITIZEN_LABELS[report.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {report.folio} • {report.colonia}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(report.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">Todavía no tienes reportes.</p>
            <Link href="/reportar">
              <Button>Crear tu primer reporte</Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Community stats (optional) */}
      <div className="px-6 mt-6 mb-6">
        <Card className="p-4 bg-gradient-to-br from-civix-50 to-blue-50">
          <h3 className="text-sm font-medium text-civix-800 mb-3">Tu comunidad</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-civix-600">156</p>
              <p className="text-xs text-gray-500">Reportes este mes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">89%</p>
              <p className="text-xs text-gray-500">Resueltos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">2.3 días</p>
              <p className="text-xs text-gray-500">Promedio resolución</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
