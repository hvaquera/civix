'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Plus, 
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

// Mock data
const mockUsers = [
  { 
    id: '1', 
    name: 'María López', 
    email: 'maria.lopez@monterrey.gob.mx',
    role: 'admin',
    area: null,
    status: 'active',
    lastLogin: '2024-01-16T08:30:00Z',
    reportsHandled: 156
  },
  { 
    id: '2', 
    name: 'Juan Pérez', 
    email: 'juan.perez@monterrey.gob.mx',
    role: 'operator',
    area: 'Servicios Públicos',
    status: 'active',
    lastLogin: '2024-01-16T07:45:00Z',
    reportsHandled: 89
  },
  { 
    id: '3', 
    name: 'Carlos Rodríguez', 
    email: 'carlos.rodriguez@monterrey.gob.mx',
    role: 'coordinator',
    area: 'Limpia',
    status: 'active',
    lastLogin: '2024-01-15T18:00:00Z',
    reportsHandled: 234
  },
  { 
    id: '4', 
    name: 'Ana Martínez', 
    email: 'ana.martinez@monterrey.gob.mx',
    role: 'coordinator',
    area: 'Agua y Drenaje',
    status: 'active',
    lastLogin: '2024-01-16T09:00:00Z',
    reportsHandled: 178
  },
  { 
    id: '5', 
    name: 'Roberto Sánchez', 
    email: 'roberto.sanchez@monterrey.gob.mx',
    role: 'operator',
    area: 'Parques y Jardines',
    status: 'inactive',
    lastLogin: '2024-01-10T14:00:00Z',
    reportsHandled: 45
  },
  { 
    id: '6', 
    name: 'Laura Hernández', 
    email: 'laura.hernandez@monterrey.gob.mx',
    role: 'operator',
    area: 'Servicios Públicos',
    status: 'pending',
    lastLogin: null,
    reportsHandled: 0
  },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin Municipal',
  coordinator: 'Coordinador de Área',
  operator: 'Operador',
}

const ROLE_ICONS: Record<string, any> = {
  admin: ShieldCheck,
  coordinator: Shield,
  operator: Users,
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  coordinator: 'bg-blue-100 text-blue-700',
  operator: 'bg-gray-100 text-gray-700',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending: 'bg-yellow-100 text-yellow-700',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  pending: 'Pendiente',
}

export default function UsuariosPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<typeof mockUsers[0] | null>(null)

  const filteredUsers = mockUsers.filter(user => {
    if (search && !user.name.toLowerCase().includes(search.toLowerCase()) &&
        !user.email.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (roleFilter !== 'all' && user.role !== roleFilter) return false
    if (statusFilter !== 'all' && user.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500">Gestiona los usuarios del panel de gobierno</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invitar usuario
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Admin Municipal</option>
              <option value="coordinator">Coordinador</option>
              <option value="operator">Operador</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Usuario</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Rol</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">Área</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Último acceso</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">Reportes</th>
                <th className="text-right py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => {
                const RoleIcon = ROLE_ICONS[user.role]
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={ROLE_COLORS[user.role]}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                      {user.area || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={STATUS_COLORS[user.status]}>
                        {STATUS_LABELS[user.status]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500 hidden lg:table-cell">
                      {user.lastLogin 
                        ? formatRelativeTime(user.lastLogin)
                        : <span className="text-gray-400">Nunca</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">
                      {user.reportsHandled}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="relative group">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>
                          {user.status === 'active' ? (
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-600 hover:bg-yellow-50">
                              <XCircle className="w-3 h-3" />
                              Desactivar
                            </button>
                          ) : (
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50">
                              <CheckCircle className="w-3 h-3" />
                              Activar
                            </button>
                          )}
                          {user.status === 'pending' && (
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                              <Mail className="w-3 h-3" />
                              Reenviar invitación
                            </button>
                          )}
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredUsers.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron usuarios.</p>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Editar usuario' : 'Invitar usuario'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <Input 
                  placeholder="Nombre y apellidos"
                  defaultValue={editingUser?.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo institucional
                </label>
                <Input 
                  type="email"
                  placeholder="correo@municipio.gob.mx"
                  defaultValue={editingUser?.email}
                  disabled={!!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  defaultValue={editingUser?.role}
                >
                  <option value="operator">Operador</option>
                  <option value="coordinator">Coordinador de Área</option>
                  <option value="admin">Admin Municipal</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  El rol determina qué puede ver y hacer en el sistema.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área asignada
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  defaultValue={editingUser?.area || ''}
                >
                  <option value="">Sin área (solo para Admins)</option>
                  <option value="Servicios Públicos">Servicios Públicos</option>
                  <option value="Limpia">Limpia</option>
                  <option value="Agua y Drenaje">Agua y Drenaje</option>
                  <option value="Parques y Jardines">Parques y Jardines</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingUser(null)
                }}
              >
                Cancelar
              </Button>
              <Button>
                {editingUser ? 'Guardar cambios' : 'Enviar invitación'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
