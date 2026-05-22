'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Construction, Lightbulb, Trash2, TreePine, Droplets, Waves, Signpost, ShieldAlert, PawPrint, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = [
  { id: 'baches', label: 'Baches', description: 'Hoyos en calles o banquetas', icon: Construction, color: 'bg-orange-100 text-orange-600' },
  { id: 'alumbrado', label: 'Alumbrado público', description: 'Lámparas fundidas o dañadas', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'basura', label: 'Basura', description: 'Acumulación o falta de recolección', icon: Trash2, color: 'bg-green-100 text-green-600' },
  { id: 'parques', label: 'Parques y jardines', description: 'Áreas verdes, bancas, juegos', icon: TreePine, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'agua', label: 'Agua potable', description: 'Fugas, falta de agua, presión baja', icon: Droplets, color: 'bg-blue-100 text-blue-600' },
  { id: 'drenaje', label: 'Drenaje', description: 'Alcantarillas tapadas, malos olores', icon: Waves, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'senalizacion', label: 'Señalización', description: 'Señales dañadas o faltantes', icon: Signpost, color: 'bg-purple-100 text-purple-600' },
  { id: 'seguridad', label: 'Seguridad', description: 'Situaciones de riesgo público', icon: ShieldAlert, color: 'bg-red-100 text-red-600' },
  { id: 'animales', label: 'Animales', description: 'Animales en la vía pública', icon: PawPrint, color: 'bg-amber-100 text-amber-600' },
  { id: 'otro', label: 'Otro', description: 'Otros problemas del municipio', icon: HelpCircle, color: 'bg-gray-100 text-gray-600' },
]

export default function ReportarCategoriaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselected = searchParams.get('categoria')

  // Si viene con categoría preseleccionada del acceso rápido, ir directo a captura
  useEffect(() => {
    if (preselected && categories.some(c => c.id === preselected)) {
      router.replace(`/reportar/captura?categoria=${preselected}`)
    }
  }, [preselected, router])

  const handleSelect = (categoryId: string) => {
    router.push(`/reportar/captura?categoria=${categoryId}`)
  }

  // Si hay categoría preseleccionada, mostrar loading mientras redirige
  if (preselected && categories.some(c => c.id === preselected)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-civix-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">Nuevo reporte</h1>
            <p className="text-sm text-gray-500">Paso 1 de 3</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          ¿Qué tipo de problema es?
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Selecciona la categoría que mejor describa tu reporte.
        </p>

        <div className="space-y-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              className={cn(
                'w-full text-left',
                preselected === cat.id && 'ring-2 ring-civix-500 rounded-xl'
              )}
            >
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={cn('p-3 rounded-xl', cat.color)}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{cat.label}</h3>
                    <p className="text-sm text-gray-500 truncate">{cat.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
