'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Building2, 
  Plus, 
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Users,
  FileText,
  ChevronRight
} from 'lucide-react'

// Mock data
const mockAreas = [
  { 
    id: '1', 
    name: 'Servicios Públicos', 
    manager: 'María López',
    usersCount: 12,
    activeReports: 45,
    categories: ['Baches', 'Alumbrado', 'Señalización'],
    color: '#3B82F6'
  },
  { 
    id: '2', 
    name: 'Limpia', 
    manager: 'Carlos Rodríguez',
    usersCount: 8,
    activeReports: 23,
    categories: ['Basura', 'Limpieza de calles'],
    color: '#10B981'
  },
  { 
    id: '3', 
    name: 'Agua y Drenaje', 
    manager: 'Ana Martínez',
    usersCount: 6,
    activeReports: 18,
    categories: ['Agua potable', 'Drenaje', 'Fugas'],
    color: '#06B6D4'
  },
  { 
    id: '4', 
    name: 'Parques y Jardines', 
    manager: 'Roberto Sánchez',
    usersCount: 5,
    activeReports: 12,
    categories: ['Parques', 'Áreas verdes', 'Juegos infantiles'],
    color: '#84CC16'
  },
  { 
    id: '5', 
    name: 'Seguridad Ciudadana', 
    manager: 'Laura Hernández',
    usersCount: 4,
    activeReports: 8,
    categories: ['Seguridad', 'Vigilancia'],
    color: '#EF4444'
  },
]

export default function AreasPage() {
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingArea, setEditingArea] = useState<typeof mockAreas[0] | null>(null)

  const filteredAreas = mockAreas.filter(area =>
    area.name.toLowerCase().includes(search.toLowerCase()) ||
    area.manager.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Áreas</h1>
          <p className="text-gray-500">Gestiona las áreas y sus categorías asignadas</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva área
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar área o responsable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      </Card>

      {/* Areas grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAreas.map((area) => (
          <Card key={area.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${area.color}20`, color: area.color }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{area.name}</h3>
                    <p className="text-sm text-gray-500">{area.manager}</p>
                  </div>
                </div>
                <div className="relative group">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                    <button 
                      onClick={() => setEditingArea(area)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-t border-b mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    <strong>{area.usersCount}</strong> usuarios
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    <strong>{area.activeReports}</strong> activos
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Categorías asignadas:</p>
                <div className="flex flex-wrap gap-1">
                  {area.categories.map((cat) => (
                    <Badge key={cat} variant="gray" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAreas.length === 0 && (
        <Card className="p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron áreas.</p>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingArea) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingArea ? 'Editar área' : 'Nueva área'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del área
                </label>
                <Input 
                  placeholder="Ej: Servicios Públicos"
                  defaultValue={editingArea?.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsable (Manager)
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option>Seleccionar usuario...</option>
                  <option>María López</option>
                  <option>Carlos Rodríguez</option>
                  <option>Ana Martínez</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categorías por defecto
                </label>
                <div className="space-y-2">
                  {['Baches', 'Alumbrado', 'Basura', 'Agua', 'Parques', 'Drenaje'].map((cat) => (
                    <label key={cat} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        defaultChecked={editingArea?.categories.includes(cat)}
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color identificador
                </label>
                <div className="flex gap-2">
                  {['#3B82F6', '#10B981', '#06B6D4', '#84CC16', '#EF4444', '#8B5CF6'].map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-full border-2 border-transparent hover:border-gray-400"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingArea(null)
                }}
              >
                Cancelar
              </Button>
              <Button>
                {editingArea ? 'Guardar cambios' : 'Crear área'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
