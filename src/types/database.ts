// ============================================================================
// CIVIX - Database Types
// Auto-generated from schema, with manual additions for better DX
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// ENUMS
// ============================================================================

export type AdminRole = 'admin_municipal' | 'coordinador_area' | 'operador'
export type AdminStatus = 'active' | 'inactive' | 'locked' | 'invitation_pending'
export type CitizenVerificationStatus = 
  | 'draft' 
  | 'contact_verified' 
  | 'ocr_processing' 
  | 'verified' 
  | 'pending_review' 
  | 'rejected_out_of_area'
export type ContactMethod = 'whatsapp' | 'email'
export type ReportStatusCitizen = 
  | 'borrador'
  | 'pendiente_envio' 
  | 'recibido' 
  | 'en_proceso' 
  | 'resuelto' 
  | 'no_procede' 
  | 'revision_solicitada'
export type LocationSource = 'gps' | 'manual_pin'
export type PriorityLevel = 'baja' | 'media' | 'alta' | 'urgente'
export type GroupedIssueStatus = 'active' | 'in_progress' | 'resolved' | 'reopened'
export type MessageChannel = 'email' | 'whatsapp' | 'push'
export type MessageType = 'citizen' | 'internal'
export type ExportStatus = 'queued' | 'processing' | 'ready' | 'failed' | 'expired'
export type ReportFrequency = 'daily' | 'weekly' | 'monthly'
export type SlaStatus = 'en_tiempo' | 'por_vencer' | 'vencido'

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Municipality {
  municipality_id: string
  official_name: string
  short_name: string
  slug: string
  logo_file_id: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_address: string | null
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
  version: number
}

export interface MunicipalArea {
  area_id: string
  municipality_id: string
  name: string
  code: string
  description: string | null
  is_active: boolean
  sort_order: number
  manager_user_id: string | null
  default_priority: PriorityLevel
  allows_no_proceed: boolean
  is_visible_in_queue: boolean
  created_at: string
  updated_at: string
}

export interface AdminUser {
  admin_user_id: string
  municipality_id: string
  area_id: string | null
  full_name: string
  email: string
  password_hash: string | null
  role: AdminRole
  status: AdminStatus
  must_use_mfa: boolean
  mfa_secret: string | null
  failed_login_attempts: number
  locked_until: string | null
  force_password_change: boolean
  last_login_at: string | null
  last_seen_at: string | null
  notification_preferences: Json
  created_at: string
  updated_at: string
}

export interface ReportCategory {
  category_id: string
  municipality_id: string
  citizen_label: string
  internal_label: string
  code: string
  description: string | null
  icon: string | null
  default_area_id: string | null
  sort_order: number
  is_active: boolean
  is_visible_to_citizen: boolean
  evidence_required_on_close: boolean
  allow_no_proceed: boolean
  created_at: string
  updated_at: string
  version: number
}

export interface InternalState {
  internal_state_id: string
  municipality_id: string
  key: string
  label: string
  sort_order: number
  is_terminal: boolean
  is_reopen_state: boolean
  counts_as_first_response: boolean
  requires_note: boolean
  citizen_state_mapping: ReportStatusCitizen
  allowed_roles: AdminRole[]
  is_system_protected: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SlaPolicy {
  sla_policy_id: string
  municipality_id: string
  category_id: string
  area_id: string | null
  first_response_hours: number
  resolution_hours: number
  warning_first_response_hours: number
  warning_resolution_hours: number
  business_hours_only: boolean
  evidence_required_on_close: boolean
  allow_no_proceed: boolean
  active_from: string
  active_to: string | null
  created_at: string
  updated_at: string
}

export interface Citizen {
  citizen_id: string
  onboarding_seen_at: string | null
  contact_method: ContactMethod | null
  contact_value: string | null
  contact_value_normalized: string | null
  contact_verified_at: string | null
  otp_code: string | null
  otp_expires_at: string | null
  otp_attempts: number
  privacy_accepted_at: string | null
  terms_accepted_at: string | null
  ine_front_file_id: string | null
  ine_back_file_id: string | null
  ocr_payload_raw: Json | null
  ocr_confidence_by_field: Json | null
  clave_elector: string | null
  curp: string | null
  name: string | null
  last_name_1: string | null
  last_name_2: string | null
  date_of_birth: string | null
  gender: string | null
  street_and_number: string | null
  colonia: string | null
  postal_code: string | null
  municipio: string | null
  estado: string | null
  seccion_electoral: string | null
  service_municipality_id: string | null
  service_area_match: boolean | null
  verification_status: CitizenVerificationStatus
  requires_review: boolean
  review_notes: string | null
  registration_completed_at: string | null
  push_opt_in: boolean
  municipal_broadcast_opt_in: boolean
  created_at: string
  updated_at: string
}

export interface Report {
  report_id: string
  municipality_id: string
  citizen_id: string
  folio: string
  local_draft_id: string | null
  category_id: string | null
  ai_suggested_category_id: string | null
  description_text: string | null
  audio_file_id: string | null
  audio_transcript_text: string | null
  location_lat: number | null
  location_lng: number | null
  location_source: LocationSource | null
  location_accuracy_meters: number | null
  address_text: string | null
  colonia_text: string | null
  reference_text: string | null
  status_citizen: ReportStatusCitizen
  internal_state_id: string | null
  priority: PriorityLevel
  area_id: string | null
  assigned_user_id: string | null
  grouped_issue_id: string | null
  is_grouped: boolean
  has_grouping_suggestion: boolean
  duplicate_detection_score: number | null
  first_response_at: string | null
  resolution_due_at: string | null
  sla_first_response_status: SlaStatus | null
  sla_resolution_status: SlaStatus | null
  resolved_at: string | null
  resolution_id: string | null
  rating_value: number | null
  rating_tags: string[] | null
  rating_comment: string | null
  rating_at: string | null
  review_requested: boolean
  review_requested_at: string | null
  queued_for_sync: boolean
  submitted_at: string | null
  notification_channel: string | null
  last_notification_at: string | null
  record_version: number
  created_at: string
  updated_at: string
}

export interface ReportPhoto {
  photo_id: string
  report_id: string
  file_id: string
  sort_order: number
  is_from_citizen: boolean
  created_at: string
}

export interface ReportAssignment {
  assignment_id: string
  report_id: string
  municipality_id: string
  area_id: string
  assigned_user_id: string | null
  priority: PriorityLevel
  due_at_internal: string | null
  assigned_by_user_id: string
  assignment_note: string | null
  assigned_at: string
  record_version: number
}

export interface ReportStatusHistory {
  history_id: string
  report_id: string
  from_internal_state_id: string | null
  to_internal_state_id: string
  from_citizen_state: ReportStatusCitizen | null
  to_citizen_state: ReportStatusCitizen
  changed_by_user_id: string | null
  change_note: string | null
  created_at: string
}

export interface ReportInternalNote {
  note_id: string
  report_id: string
  author_user_id: string
  body: string
  created_at: string
  edited_at: string | null
}

export interface ReportResolution {
  resolution_id: string
  report_id: string
  result_type: 'resolved' | 'no_proceed'
  resolved_by_user_id: string
  resolved_at: string
  closure_note: string | null
  citizen_explanation: string | null
  no_proceed_reason: string | null
  cost_amount: number | null
  materials_text: string | null
  cost_notes: string | null
  resolution_version: number
  reopened_from_resolution_id: string | null
}

export interface GroupedIssue {
  grouped_issue_id: string
  municipality_id: string
  canonical_category_id: string
  area_id: string | null
  assigned_user_id: string | null
  status: GroupedIssueStatus
  priority: PriorityLevel
  suggested_by_ai: boolean
  suggestion_score: number | null
  created_by_user_id: string | null
  centroid_lat: number | null
  centroid_lng: number | null
  radius_meters: number | null
  child_report_count: number
  unique_citizen_count: number
  resolved_at: string | null
  resolution_id: string | null
  created_at: string
  updated_at: string
}

export interface GroupedIssueMember {
  member_id: string
  grouped_issue_id: string
  report_id: string
  join_type: 'ai_suggested' | 'manual'
  joined_by_user_id: string | null
  joined_at: string
}

export interface AuditLog {
  audit_log_id: string
  municipality_id: string
  actor_user_id: string | null
  actor_role: AdminRole | null
  entity_type: string
  entity_id: string
  action: string
  before_json: Json | null
  after_json: Json | null
  metadata_json: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// ============================================================================
// VIEW TYPES
// ============================================================================

export interface ReportDashboardView {
  report_id: string
  municipality_id: string
  folio: string
  description_text: string | null
  status_citizen: ReportStatusCitizen
  priority: PriorityLevel
  created_at: string
  submitted_at: string | null
  resolved_at: string | null
  first_response_at: string | null
  category_label: string | null
  category_code: string | null
  area_name: string | null
  assigned_to_name: string | null
  colonia_text: string | null
  address_text: string | null
  internal_state_label: string | null
  citizen_state_mapping: ReportStatusCitizen | null
  sla_first_response_status: SlaStatus | null
  sla_resolution_status: SlaStatus | null
  is_grouped: boolean
  grouped_issue_id: string | null
  has_grouping_suggestion: boolean
}

// ============================================================================
// INSERT/UPDATE TYPES
// ============================================================================

export type MunicipalityInsert = Omit<Municipality, 'municipality_id' | 'created_at' | 'updated_at' | 'version'>
export type MunicipalityUpdate = Partial<MunicipalityInsert>

export type CitizenInsert = Omit<Citizen, 'citizen_id' | 'created_at' | 'updated_at'>
export type CitizenUpdate = Partial<CitizenInsert>

export type ReportInsert = Omit<Report, 'report_id' | 'folio' | 'created_at' | 'updated_at' | 'record_version'>
export type ReportUpdate = Partial<ReportInsert>

export type AdminUserInsert = Omit<AdminUser, 'admin_user_id' | 'created_at' | 'updated_at'>
export type AdminUserUpdate = Partial<AdminUserInsert>

// ============================================================================
// COMPOSITE TYPES (for UI)
// ============================================================================

export interface ReportWithRelations extends Report {
  category?: ReportCategory
  area?: MunicipalArea
  assigned_user?: AdminUser
  internal_state?: InternalState
  photos?: ReportPhoto[]
  citizen?: Pick<Citizen, 'citizen_id' | 'name' | 'last_name_1' | 'contact_method' | 'contact_value' | 'colonia'>
}

export interface DashboardStats {
  sin_asignar: number
  por_vencer_sla: number
  sla_vencido: number
  revision_solicitada: number
  resueltos_hoy: number
  promedio_primera_respuesta_minutos: number
  promedio_resolucion_minutos: number
  porcentaje_dentro_sla: number
}

export interface GroupingSuggestion {
  centroid_lat: number
  centroid_lng: number
  radius_meters: number
  report_count: number
  category_id: string
  category_label: string
  colonia: string
  report_ids: string[]
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface NewReportForm {
  category_id: string
  description_text: string
  audio_file?: File
  photos: File[]
  location_lat: number
  location_lng: number
  location_source: LocationSource
  address_text?: string
  colonia_text?: string
  reference_text?: string
}

export interface AssignmentForm {
  area_id: string
  assigned_user_id?: string
  priority: PriorityLevel
  due_at_internal?: string
  assignment_note?: string
  notify_assignee: boolean
}

export interface ResolutionForm {
  result_type: 'resolved' | 'no_proceed'
  closure_note: string
  citizen_explanation?: string
  no_proceed_reason?: string
  evidence_photos: File[]
  cost_amount?: number
  materials_text?: string
}

export interface RatingForm {
  rating_value: number
  rating_tags: string[]
  rating_comment?: string
  request_review: boolean
}
