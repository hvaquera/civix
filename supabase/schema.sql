-- ============================================================================
-- CIVIX - Complete Database Schema
-- Citizen reporting platform + Government back-office
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- SECTION 0: AUTH & SESSIONS
-- ============================================================================

-- OTP codes for citizen verification
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    method TEXT NOT NULL CHECK (method IN ('whatsapp', 'email')),
    contact TEXT NOT NULL,
    code TEXT NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_codes_lookup ON otp_codes(contact, method, code, used);
CREATE INDEX idx_otp_codes_cleanup ON otp_codes(expires_at);

-- Rate limiting for OTP attempts
CREATE TABLE otp_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact TEXT NOT NULL,
    method TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_attempts_rate ON otp_attempts(contact, created_at);

-- Citizen sessions
CREATE TABLE citizen_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citizen_sessions_token ON citizen_sessions(token);
CREATE INDEX idx_citizen_sessions_citizen ON citizen_sessions(citizen_id);

-- Admin sessions
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_sessions_user ON admin_sessions(user_id);

-- ============================================================================
-- SECTION 1: MULTI-TENANT FOUNDATION
-- ============================================================================

-- Municipalities (tenants)
CREATE TABLE municipalities (
    municipality_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    official_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    logo_file_id UUID,
    contact_email TEXT,
    contact_phone TEXT,
    contact_address TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/Monterrey',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

-- ============================================================================
-- SECTION 2: AREAS & DEPARTMENTS
-- ============================================================================

CREATE TABLE municipal_areas (
    area_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- e.g., 'SERV-PUB'
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    manager_user_id UUID, -- FK added later to avoid circular reference
    default_priority TEXT NOT NULL DEFAULT 'media' CHECK (default_priority IN ('baja', 'media', 'alta', 'urgente')),
    allows_no_proceed BOOLEAN NOT NULL DEFAULT true,
    is_visible_in_queue BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(municipality_id, code)
);

-- ============================================================================
-- SECTION 3: ADMIN USERS (Panel users)
-- ============================================================================

CREATE TYPE admin_role AS ENUM ('admin_municipal', 'coordinador_area', 'operador');
CREATE TYPE admin_status AS ENUM ('active', 'inactive', 'locked', 'invitation_pending');

CREATE TABLE admin_users (
    admin_user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    area_id UUID REFERENCES municipal_areas(area_id),
    
    -- Identity
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT, -- null if invitation pending
    
    -- Role & permissions
    role admin_role NOT NULL,
    status admin_status NOT NULL DEFAULT 'invitation_pending',
    
    -- Security
    must_use_mfa BOOLEAN NOT NULL DEFAULT false,
    mfa_secret TEXT,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    force_password_change BOOLEAN NOT NULL DEFAULT false,
    
    -- Activity tracking
    last_login_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    
    -- Preferences
    notification_preferences JSONB NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(municipality_id, email)
);

-- Add FK for manager now that admin_users exists
ALTER TABLE municipal_areas 
ADD CONSTRAINT fk_manager 
FOREIGN KEY (manager_user_id) REFERENCES admin_users(admin_user_id);

-- ============================================================================
-- SECTION 4: REPORT CATEGORIES
-- ============================================================================

CREATE TABLE report_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    citizen_label TEXT NOT NULL, -- What citizen sees
    internal_label TEXT NOT NULL, -- What staff sees
    code TEXT NOT NULL, -- e.g., 'BACHES'
    description TEXT,
    icon TEXT, -- Icon name/path
    
    default_area_id UUID REFERENCES municipal_areas(area_id),
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_visible_to_citizen BOOLEAN NOT NULL DEFAULT true,
    evidence_required_on_close BOOLEAN NOT NULL DEFAULT true,
    allow_no_proceed BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    
    UNIQUE(municipality_id, code)
);

-- Area-Category default mapping (for complex multi-area routing)
CREATE TABLE area_category_defaults (
    area_category_default_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    area_id UUID NOT NULL REFERENCES municipal_areas(area_id),
    category_id UUID NOT NULL REFERENCES report_categories(category_id),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(area_id, category_id)
);

-- ============================================================================
-- SECTION 5: INTERNAL STATES & TRANSITIONS
-- ============================================================================

CREATE TABLE internal_states (
    internal_state_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    key TEXT NOT NULL, -- e.g., 'EN_CAMPO'
    label TEXT NOT NULL, -- e.g., 'En campo'
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Behavior flags
    is_terminal BOOLEAN NOT NULL DEFAULT false,
    is_reopen_state BOOLEAN NOT NULL DEFAULT false,
    counts_as_first_response BOOLEAN NOT NULL DEFAULT false,
    requires_note BOOLEAN NOT NULL DEFAULT false,
    
    -- Mapping to citizen-visible state
    citizen_state_mapping TEXT NOT NULL CHECK (citizen_state_mapping IN (
        'recibido', 'en_proceso', 'resuelto', 'no_procede', 'revision_solicitada'
    )),
    
    -- Access control
    allowed_roles admin_role[] NOT NULL DEFAULT '{admin_municipal, coordinador_area, operador}',
    
    is_system_protected BOOLEAN NOT NULL DEFAULT false, -- Can't delete
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(municipality_id, key)
);

-- State transition rules
CREATE TABLE internal_state_transitions (
    transition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    from_state_id UUID NOT NULL REFERENCES internal_states(internal_state_id),
    to_state_id UUID NOT NULL REFERENCES internal_states(internal_state_id),
    allowed_roles admin_role[] NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(municipality_id, from_state_id, to_state_id)
);

-- ============================================================================
-- SECTION 6: SLA POLICIES
-- ============================================================================

CREATE TABLE sla_policies (
    sla_policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    category_id UUID NOT NULL REFERENCES report_categories(category_id),
    area_id UUID REFERENCES municipal_areas(area_id), -- null = applies to all areas
    
    first_response_hours INTEGER NOT NULL DEFAULT 24,
    resolution_hours INTEGER NOT NULL DEFAULT 48,
    warning_first_response_hours INTEGER NOT NULL DEFAULT 4,
    warning_resolution_hours INTEGER NOT NULL DEFAULT 8,
    
    business_hours_only BOOLEAN NOT NULL DEFAULT false,
    evidence_required_on_close BOOLEAN NOT NULL DEFAULT true,
    allow_no_proceed BOOLEAN NOT NULL DEFAULT true,
    
    active_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active_to TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 7: BUSINESS HOURS & HOLIDAYS
-- ============================================================================

CREATE TABLE business_hours (
    business_hours_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Sunday
    is_active BOOLEAN NOT NULL DEFAULT true,
    opens_at TIME NOT NULL DEFAULT '08:00',
    closes_at TIME NOT NULL DEFAULT '17:00',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(municipality_id, weekday)
);

CREATE TABLE holidays (
    holiday_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(municipality_id, date)
);

-- ============================================================================
-- SECTION 8: CITIZENS (App users)
-- ============================================================================

CREATE TYPE citizen_verification_status AS ENUM (
    'draft', 
    'contact_verified', 
    'ocr_processing', 
    'verified', 
    'pending_review', 
    'rejected_out_of_area'
);

CREATE TYPE contact_method AS ENUM ('whatsapp', 'email');

CREATE TABLE citizens (
    citizen_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Onboarding
    onboarding_seen_at TIMESTAMPTZ,
    
    -- Contact verification
    contact_method contact_method,
    contact_value TEXT, -- phone or email
    contact_value_normalized TEXT, -- standardized format
    contact_verified_at TIMESTAMPTZ,
    otp_code TEXT,
    otp_expires_at TIMESTAMPTZ,
    otp_attempts INTEGER NOT NULL DEFAULT 0,
    
    -- Legal
    privacy_accepted_at TIMESTAMPTZ,
    terms_accepted_at TIMESTAMPTZ,
    
    -- INE verification
    ine_front_file_id UUID,
    ine_back_file_id UUID,
    ocr_payload_raw JSONB,
    ocr_confidence_by_field JSONB,
    
    -- Extracted data
    clave_elector TEXT,
    curp TEXT,
    name TEXT,
    last_name_1 TEXT,
    last_name_2 TEXT,
    date_of_birth DATE,
    gender TEXT,
    
    -- Address from INE
    street_and_number TEXT,
    colonia TEXT,
    postal_code TEXT,
    municipio TEXT,
    estado TEXT,
    seccion_electoral TEXT,
    
    -- Service area validation
    service_municipality_id UUID REFERENCES municipalities(municipality_id),
    service_area_match BOOLEAN,
    
    -- Status
    verification_status citizen_verification_status NOT NULL DEFAULT 'draft',
    requires_review BOOLEAN NOT NULL DEFAULT false,
    review_notes TEXT,
    
    registration_completed_at TIMESTAMPTZ,
    
    -- Preferences
    push_opt_in BOOLEAN NOT NULL DEFAULT true,
    municipal_broadcast_opt_in BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for contact lookup
CREATE INDEX idx_citizens_contact ON citizens(contact_method, contact_value_normalized);

-- ============================================================================
-- SECTION 9: REPORTS
-- ============================================================================

CREATE TYPE report_status_citizen AS ENUM (
    'borrador',
    'pendiente_envio', 
    'recibido', 
    'en_proceso', 
    'resuelto', 
    'no_procede', 
    'revision_solicitada'
);

CREATE TYPE location_source AS ENUM ('gps', 'manual_pin');
CREATE TYPE priority_level AS ENUM ('baja', 'media', 'alta', 'urgente');

CREATE TABLE reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    citizen_id UUID NOT NULL REFERENCES citizens(citizen_id),
    
    -- Identifiers
    folio TEXT NOT NULL, -- e.g., 'CIV-2024-00001'
    local_draft_id TEXT, -- For offline sync
    
    -- Category
    category_id UUID REFERENCES report_categories(category_id),
    ai_suggested_category_id UUID REFERENCES report_categories(category_id),
    
    -- Content
    description_text TEXT,
    audio_file_id UUID,
    audio_transcript_text TEXT,
    
    -- Location
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_point GEOGRAPHY(POINT, 4326), -- PostGIS
    location_source location_source,
    location_accuracy_meters DECIMAL(10, 2),
    address_text TEXT,
    colonia_text TEXT,
    reference_text TEXT,
    
    -- Status
    status_citizen report_status_citizen NOT NULL DEFAULT 'borrador',
    internal_state_id UUID REFERENCES internal_states(internal_state_id),
    priority priority_level NOT NULL DEFAULT 'media',
    
    -- Assignment
    area_id UUID REFERENCES municipal_areas(area_id),
    assigned_user_id UUID REFERENCES admin_users(admin_user_id),
    
    -- Grouping
    grouped_issue_id UUID, -- FK added later
    is_grouped BOOLEAN NOT NULL DEFAULT false,
    has_grouping_suggestion BOOLEAN NOT NULL DEFAULT false,
    duplicate_detection_score DECIMAL(3, 2),
    
    -- SLA tracking
    first_response_at TIMESTAMPTZ,
    resolution_due_at TIMESTAMPTZ,
    sla_first_response_status TEXT CHECK (sla_first_response_status IN ('en_tiempo', 'por_vencer', 'vencido')),
    sla_resolution_status TEXT CHECK (sla_resolution_status IN ('en_tiempo', 'por_vencer', 'vencido')),
    
    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolution_id UUID, -- FK added later
    
    -- Rating
    rating_value INTEGER CHECK (rating_value BETWEEN 1 AND 5),
    rating_tags TEXT[],
    rating_comment TEXT,
    rating_at TIMESTAMPTZ,
    review_requested BOOLEAN NOT NULL DEFAULT false,
    review_requested_at TIMESTAMPTZ,
    
    -- Sync
    queued_for_sync BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ,
    
    -- Notifications
    notification_channel TEXT,
    last_notification_at TIMESTAMPTZ,
    
    -- Versioning
    record_version INTEGER NOT NULL DEFAULT 1,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(municipality_id, folio)
);

-- Spatial index
CREATE INDEX idx_reports_location ON reports USING GIST(location_point);
CREATE INDEX idx_reports_status ON reports(municipality_id, status_citizen);
CREATE INDEX idx_reports_citizen ON reports(citizen_id);
CREATE INDEX idx_reports_area ON reports(area_id, internal_state_id);

-- Report photos
CREATE TABLE report_photos (
    photo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(report_id),
    file_id UUID NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_from_citizen BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 10: REPORT OPERATIONS
-- ============================================================================

-- Assignment history
CREATE TABLE report_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(report_id),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    area_id UUID NOT NULL REFERENCES municipal_areas(area_id),
    assigned_user_id UUID REFERENCES admin_users(admin_user_id),
    priority priority_level NOT NULL DEFAULT 'media',
    due_at_internal TIMESTAMPTZ,
    
    assigned_by_user_id UUID NOT NULL REFERENCES admin_users(admin_user_id),
    assignment_note TEXT,
    
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    record_version INTEGER NOT NULL DEFAULT 1
);

-- Status history
CREATE TABLE report_status_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(report_id),
    
    from_internal_state_id UUID REFERENCES internal_states(internal_state_id),
    to_internal_state_id UUID NOT NULL REFERENCES internal_states(internal_state_id),
    from_citizen_state report_status_citizen,
    to_citizen_state report_status_citizen NOT NULL,
    
    changed_by_user_id UUID REFERENCES admin_users(admin_user_id),
    change_note TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_status_history_report ON report_status_history(report_id);

-- Internal notes
CREATE TABLE report_internal_notes (
    note_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(report_id),
    author_user_id UUID NOT NULL REFERENCES admin_users(admin_user_id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ
);

-- Resolutions
CREATE TABLE report_resolutions (
    resolution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(report_id),
    
    result_type TEXT NOT NULL CHECK (result_type IN ('resolved', 'no_proceed')),
    
    resolved_by_user_id UUID NOT NULL REFERENCES admin_users(admin_user_id),
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    closure_note TEXT,
    citizen_explanation TEXT, -- For no_proceed
    no_proceed_reason TEXT,
    
    -- Cost tracking (optional)
    cost_amount DECIMAL(12, 2),
    materials_text TEXT,
    cost_notes TEXT,
    
    resolution_version INTEGER NOT NULL DEFAULT 1,
    reopened_from_resolution_id UUID REFERENCES report_resolutions(resolution_id)
);

-- Resolution evidence photos
CREATE TABLE resolution_photos (
    photo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resolution_id UUID NOT NULL REFERENCES report_resolutions(resolution_id),
    file_id UUID NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK to reports
ALTER TABLE reports 
ADD CONSTRAINT fk_resolution 
FOREIGN KEY (resolution_id) REFERENCES report_resolutions(resolution_id);

-- ============================================================================
-- SECTION 11: GROUPED ISSUES
-- ============================================================================

CREATE TYPE grouped_issue_status AS ENUM ('active', 'in_progress', 'resolved', 'reopened');

CREATE TABLE grouped_issues (
    grouped_issue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    -- Canonical info
    canonical_category_id UUID NOT NULL REFERENCES report_categories(category_id),
    area_id UUID REFERENCES municipal_areas(area_id),
    assigned_user_id UUID REFERENCES admin_users(admin_user_id),
    
    status grouped_issue_status NOT NULL DEFAULT 'active',
    priority priority_level NOT NULL DEFAULT 'media',
    
    -- Origin
    suggested_by_ai BOOLEAN NOT NULL DEFAULT false,
    suggestion_score DECIMAL(3, 2),
    created_by_user_id UUID REFERENCES admin_users(admin_user_id),
    
    -- Geography
    centroid_lat DECIMAL(10, 8),
    centroid_lng DECIMAL(11, 8),
    centroid_point GEOGRAPHY(POINT, 4326),
    radius_meters INTEGER,
    
    -- Stats (denormalized for performance)
    child_report_count INTEGER NOT NULL DEFAULT 0,
    unique_citizen_count INTEGER NOT NULL DEFAULT 0,
    
    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolution_id UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK to reports
ALTER TABLE reports 
ADD CONSTRAINT fk_grouped_issue 
FOREIGN KEY (grouped_issue_id) REFERENCES grouped_issues(grouped_issue_id);

-- Issue members
CREATE TABLE grouped_issue_members (
    member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grouped_issue_id UUID NOT NULL REFERENCES grouped_issues(grouped_issue_id),
    report_id UUID NOT NULL REFERENCES reports(report_id),
    
    join_type TEXT NOT NULL CHECK (join_type IN ('ai_suggested', 'manual')),
    joined_by_user_id UUID REFERENCES admin_users(admin_user_id),
    
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(grouped_issue_id, report_id)
);

-- Issue history
CREATE TABLE grouped_issue_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grouped_issue_id UUID NOT NULL REFERENCES grouped_issues(grouped_issue_id),
    from_status grouped_issue_status,
    to_status grouped_issue_status NOT NULL,
    changed_by_user_id UUID REFERENCES admin_users(admin_user_id),
    change_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Issue notes
CREATE TABLE grouped_issue_notes (
    note_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grouped_issue_id UUID NOT NULL REFERENCES grouped_issues(grouped_issue_id),
    author_user_id UUID NOT NULL REFERENCES admin_users(admin_user_id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ
);

-- Issue resolutions
CREATE TABLE grouped_issue_resolutions (
    resolution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grouped_issue_id UUID NOT NULL REFERENCES grouped_issues(grouped_issue_id),
    resolved_by_user_id UUID NOT NULL REFERENCES admin_users(admin_user_id),
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closure_note TEXT,
    resolution_version INTEGER NOT NULL DEFAULT 1,
    reopened_from_resolution_id UUID REFERENCES grouped_issue_resolutions(resolution_id)
);

-- Issue resolution photos
CREATE TABLE grouped_issue_resolution_photos (
    photo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resolution_id UUID NOT NULL REFERENCES grouped_issue_resolutions(resolution_id),
    file_id UUID NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 12: AUTO-ASSIGNMENT RULES
-- ============================================================================

CREATE TABLE auto_assignment_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Conditions (all nullable = catch-all)
    match_category_id UUID REFERENCES report_categories(category_id),
    match_colonia_text TEXT,
    match_postal_code TEXT,
    match_keyword_text TEXT,
    
    -- Result
    target_area_id UUID NOT NULL REFERENCES municipal_areas(area_id),
    target_user_id UUID REFERENCES admin_users(admin_user_id),
    result_priority priority_level,
    stop_processing BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

-- ============================================================================
-- SECTION 13: MESSAGE TEMPLATES
-- ============================================================================

CREATE TYPE message_channel AS ENUM ('email', 'whatsapp', 'push');
CREATE TYPE message_type AS ENUM ('citizen', 'internal');

CREATE TABLE message_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    event_key TEXT NOT NULL, -- e.g., 'report_received', 'report_resolved'
    channel message_channel NOT NULL,
    message_type message_type NOT NULL,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    subject_template TEXT, -- For email
    body_template TEXT NOT NULL,
    allowed_placeholders TEXT[] NOT NULL DEFAULT '{}',
    
    updated_by_user_id UUID REFERENCES admin_users(admin_user_id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    
    UNIQUE(municipality_id, event_key, channel)
);

-- ============================================================================
-- SECTION 14: EXPORTS & SCHEDULED REPORTS
-- ============================================================================

CREATE TYPE export_status AS ENUM ('queued', 'processing', 'ready', 'failed', 'expired');

CREATE TABLE export_jobs (
    export_job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    requested_by_user_id UUID NOT NULL REFERENCES admin_users(admin_user_id),
    
    export_type TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('csv', 'pdf')),
    filters_json JSONB NOT NULL DEFAULT '{}',
    
    status export_status NOT NULL DEFAULT 'queued',
    file_id UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE TYPE report_frequency AS ENUM ('daily', 'weekly', 'monthly');

CREATE TABLE scheduled_reports (
    scheduled_report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    name TEXT NOT NULL,
    report_type TEXT NOT NULL,
    frequency report_frequency NOT NULL,
    day_of_week INTEGER, -- 0-6 for weekly
    day_of_month INTEGER, -- 1-31 for monthly
    send_time TIME NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('csv', 'pdf')),
    filters_json JSONB NOT NULL DEFAULT '{}',
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_by_user_id UUID NOT NULL REFERENCES admin_users(admin_user_id),
    updated_by_user_id UUID REFERENCES admin_users(admin_user_id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scheduled_report_recipients (
    recipient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_report_id UUID NOT NULL REFERENCES scheduled_reports(scheduled_report_id),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE scheduled_run_status AS ENUM ('queued', 'processing', 'sent', 'failed');

CREATE TABLE scheduled_report_runs (
    run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_report_id UUID NOT NULL REFERENCES scheduled_reports(scheduled_report_id),
    status scheduled_run_status NOT NULL DEFAULT 'queued',
    file_id UUID,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    error_message TEXT
);

-- ============================================================================
-- SECTION 15: AUDIT LOG
-- ============================================================================

CREATE TABLE audit_logs (
    audit_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    actor_user_id UUID REFERENCES admin_users(admin_user_id),
    actor_role admin_role,
    
    entity_type TEXT NOT NULL, -- 'report', 'area', 'user', etc.
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'assign', etc.
    
    before_json JSONB,
    after_json JSONB,
    metadata_json JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(municipality_id, created_at DESC);

-- Settings change log (for versioned config)
CREATE TABLE settings_change_logs (
    change_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    version_from INTEGER,
    version_to INTEGER NOT NULL,
    
    changed_by_user_id UUID REFERENCES admin_users(admin_user_id),
    before_json JSONB,
    after_json JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 16: FILE STORAGE REFERENCES
-- ============================================================================

CREATE TABLE files (
    file_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID REFERENCES municipalities(municipality_id),
    
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    original_filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    
    uploaded_by_citizen_id UUID REFERENCES citizens(citizen_id),
    uploaded_by_admin_id UUID REFERENCES admin_users(admin_user_id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 17: FOLIO SEQUENCE
-- ============================================================================

CREATE TABLE folio_sequences (
    municipality_id UUID PRIMARY KEY REFERENCES municipalities(municipality_id),
    current_year INTEGER NOT NULL,
    current_sequence INTEGER NOT NULL DEFAULT 0
);

-- Function to generate folio
CREATE OR REPLACE FUNCTION generate_folio(p_municipality_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_seq INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW());
    
    INSERT INTO folio_sequences (municipality_id, current_year, current_sequence)
    VALUES (p_municipality_id, v_year, 1)
    ON CONFLICT (municipality_id) DO UPDATE
    SET 
        current_sequence = CASE 
            WHEN folio_sequences.current_year = v_year 
            THEN folio_sequences.current_sequence + 1
            ELSE 1
        END,
        current_year = v_year
    RETURNING current_sequence INTO v_seq;
    
    RETURN 'CIV-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 18: SEED DEFAULT INTERNAL STATES
-- ============================================================================

-- This will be run per municipality during onboarding
CREATE OR REPLACE FUNCTION seed_default_states(p_municipality_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO internal_states (municipality_id, key, label, sort_order, citizen_state_mapping, is_system_protected, counts_as_first_response)
    VALUES 
        (p_municipality_id, 'NUEVO', 'Nuevo', 1, 'recibido', true, false),
        (p_municipality_id, 'SIN_ASIGNAR', 'Sin asignar', 2, 'recibido', true, false),
        (p_municipality_id, 'ASIGNADO', 'Asignado', 3, 'recibido', false, true),
        (p_municipality_id, 'PROGRAMADO', 'Programado', 4, 'en_proceso', false, true),
        (p_municipality_id, 'EN_CAMPO', 'En campo', 5, 'en_proceso', false, true),
        (p_municipality_id, 'ESPERANDO_MATERIAL', 'Esperando material', 6, 'en_proceso', false, false),
        (p_municipality_id, 'EN_REVISION', 'En revisión', 7, 'en_proceso', false, false),
        (p_municipality_id, 'RESUELTO', 'Resuelto', 8, 'resuelto', true, false),
        (p_municipality_id, 'NO_PROCEDE', 'No procede', 9, 'no_procede', true, false),
        (p_municipality_id, 'REABIERTO', 'Reabierto', 10, 'revision_solicitada', true, false);
        
    -- Set terminal flags
    UPDATE internal_states SET is_terminal = true 
    WHERE municipality_id = p_municipality_id AND key IN ('RESUELTO', 'NO_PROCEDE');
    
    UPDATE internal_states SET is_reopen_state = true 
    WHERE municipality_id = p_municipality_id AND key = 'REABIERTO';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 19: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipal_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grouped_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: Actual RLS policies would be defined based on auth context
-- These are placeholder comments for now

-- ============================================================================
-- SECTION 20: USEFUL VIEWS
-- ============================================================================

-- Report dashboard view with computed SLA status
CREATE OR REPLACE VIEW v_reports_dashboard AS
SELECT 
    r.report_id,
    r.municipality_id,
    r.folio,
    r.description_text,
    r.status_citizen,
    r.priority,
    r.created_at,
    r.submitted_at,
    r.resolved_at,
    r.first_response_at,
    
    -- Category
    rc.citizen_label as category_label,
    rc.code as category_code,
    
    -- Area & assignment
    ma.name as area_name,
    au.full_name as assigned_to_name,
    
    -- Location
    r.colonia_text,
    r.address_text,
    
    -- Internal state
    ins.label as internal_state_label,
    ins.citizen_state_mapping,
    
    -- SLA computed
    r.sla_first_response_status,
    r.sla_resolution_status,
    
    -- Grouping
    r.is_grouped,
    r.grouped_issue_id,
    r.has_grouping_suggestion
    
FROM reports r
LEFT JOIN report_categories rc ON r.category_id = rc.category_id
LEFT JOIN municipal_areas ma ON r.area_id = ma.area_id
LEFT JOIN admin_users au ON r.assigned_user_id = au.admin_user_id
LEFT JOIN internal_states ins ON r.internal_state_id = ins.internal_state_id;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
