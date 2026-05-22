import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFolio(folio: string): string {
  return folio
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Hace un momento'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} días`
  return formatDate(d)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} h`
  return `${hours} h ${mins} min`
}

export function formatPhone(phone: string): string {
  // Format Mexican phone numbers
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`
  }
  return phone
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length >= 4) {
    return `****${cleaned.slice(-4)}`
  }
  return '****'
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '****'
  const maskedLocal = local.slice(0, 2) + '****'
  return `${maskedLocal}@${domain}`
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// SLA calculations
export function calculateSlaStatus(
  createdAt: string,
  slaHours: number,
  warningHours: number
): 'en_tiempo' | 'por_vencer' | 'vencido' {
  const created = new Date(createdAt)
  const now = new Date()
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  
  if (diffHours >= slaHours) return 'vencido'
  if (diffHours >= slaHours - warningHours) return 'por_vencer'
  return 'en_tiempo'
}

export function getRemainingTime(dueAt: string): string {
  const due = new Date(dueAt)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  
  if (diffMs < 0) {
    const overMs = Math.abs(diffMs)
    const overHours = Math.floor(overMs / (1000 * 60 * 60))
    return `Venció hace ${overHours} h`
  }
  
  const remainingHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (remainingHours < 1) {
    const remainingMins = Math.floor(diffMs / (1000 * 60))
    return `Faltan ${remainingMins} min`
  }
  return `Faltan ${remainingHours} h`
}

// Status helpers
export const STATUS_CITIZEN_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  pendiente_envio: 'Pendiente de envío',
  recibido: 'Recibido',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  no_procede: 'No procede',
  revision_solicitada: 'Revisión solicitada',
}

export const STATUS_CITIZEN_COLORS: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  pendiente_envio: 'bg-yellow-100 text-yellow-700',
  recibido: 'bg-blue-100 text-blue-700',
  en_proceso: 'bg-purple-100 text-purple-700',
  resuelto: 'bg-green-100 text-green-700',
  no_procede: 'bg-red-100 text-red-700',
  revision_solicitada: 'bg-orange-100 text-orange-700',
}

export const PRIORITY_LABELS: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
}

export const PRIORITY_COLORS: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

export const SLA_COLORS: Record<string, string> = {
  en_tiempo: 'bg-green-100 text-green-700',
  por_vencer: 'bg-yellow-100 text-yellow-700',
  vencido: 'bg-red-100 text-red-700',
}

export const SLA_LABELS: Record<string, string> = {
  en_tiempo: 'En tiempo',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
}

// Category icons (Lucide icon names)
export const CATEGORY_ICONS: Record<string, string> = {
  BACHES: 'construction',
  ALUMBRADO: 'lightbulb',
  BASURA: 'trash-2',
  PARQUES: 'trees',
  AGUA: 'droplets',
  DRENAJE: 'waves',
  SENALIZACION: 'signpost',
  SEGURIDAD: 'shield',
  ANIMALES: 'paw-print',
  OTRO: 'help-circle',
}
