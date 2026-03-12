-- ============================================================================
-- CIVIX - ESTRUCTURA TERRITORIAL Y ELECTORAL
-- Schema para Monterrey MVP (escalable a Nuevo León completo)
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: GEOGRAFÍA ELECTORAL (Datos INE/IEEPC)
-- ============================================================================

-- Distritos Electorales Locales
-- Monterrey tiene 8 distritos (1-8), NL tiene 26 total
CREATE TABLE electoral_districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID REFERENCES municipalities(municipality_id),
    
    -- Identificación oficial
    district_number INTEGER NOT NULL,           -- 1, 2, 3... 26
    district_key TEXT NOT NULL,                 -- 'NL-D01', 'NL-D02'
    name TEXT NOT NULL,                         -- 'Distrito 01 Monterrey'
    cabecera TEXT,                              -- Cabecera distrital
    
    -- Estadísticas
    total_sections INTEGER DEFAULT 0,           -- Total de secciones
    estimated_voters INTEGER DEFAULT 0,         -- Padrón electoral estimado
    
    -- Geometría (PostGIS)
    geometry GEOGRAPHY(MULTIPOLYGON, 4326),
    
    -- Metadata
    source TEXT DEFAULT 'IEEPC 2024',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(municipality_id, district_number)
);

-- Secciones Electorales
-- Unidad mínima electoral oficial (~500-3000 votantes por sección)
CREATE TABLE electoral_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id UUID NOT NULL REFERENCES electoral_districts(id),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    -- Identificación oficial (de la INE)
    section_number INTEGER NOT NULL,            -- 1432, 1433, etc.
    section_key TEXT NOT NULL,                  -- 'NL-1432'
    
    -- Estadísticas
    estimated_voters INTEGER DEFAULT 0,
    total_polling_stations INTEGER DEFAULT 0,   -- Casillas
    
    -- Geometría
    geometry GEOGRAPHY(MULTIPOLYGON, 4326),
    centroid GEOGRAPHY(POINT, 4326),
    
    -- Metadata
    source TEXT DEFAULT 'IEEPC 2024',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(section_number)
);

CREATE INDEX idx_sections_district ON electoral_sections(district_id);
CREATE INDEX idx_sections_municipality ON electoral_sections(municipality_id);
CREATE INDEX idx_sections_number ON electoral_sections(section_number);
CREATE INDEX idx_sections_geometry ON electoral_sections USING GIST(geometry);

-- Colonias (vinculadas a secciones)
-- Una colonia puede pertenecer a múltiples secciones
CREATE TABLE colonias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    -- Identificación
    name TEXT NOT NULL,
    name_normalized TEXT NOT NULL,              -- Sin acentos, mayúsculas
    postal_code TEXT,
    
    -- Tipo
    colonia_type TEXT DEFAULT 'colonia',        -- colonia, fraccionamiento, ejido, etc.
    
    -- Geometría aproximada
    geometry GEOGRAPHY(MULTIPOLYGON, 4326),
    centroid GEOGRAPHY(POINT, 4326),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_colonias_municipality ON colonias(municipality_id);
CREATE INDEX idx_colonias_name ON colonias(name_normalized);
CREATE INDEX idx_colonias_postal ON colonias(postal_code);

-- Relación Colonia <-> Sección (muchos a muchos)
CREATE TABLE colonia_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colonia_id UUID NOT NULL REFERENCES colonias(id),
    section_id UUID NOT NULL REFERENCES electoral_sections(id),
    
    -- Porcentaje aproximado de la colonia en esta sección
    coverage_percentage DECIMAL(5,2) DEFAULT 100.00,
    is_primary BOOLEAN DEFAULT true,            -- Sección principal de la colonia
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(colonia_id, section_id)
);

CREATE INDEX idx_colsec_colonia ON colonia_sections(colonia_id);
CREATE INDEX idx_colsec_section ON colonia_sections(section_id);

-- Manzanas (nivel más granular, opcional para MVP)
CREATE TABLE manzanas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES electoral_sections(id),
    colonia_id UUID REFERENCES colonias(id),
    
    -- Identificación
    manzana_key TEXT NOT NULL,                  -- Clave INEGI o interna
    
    -- Estadísticas
    estimated_households INTEGER DEFAULT 0,
    estimated_voters INTEGER DEFAULT 0,
    
    -- Geometría
    geometry GEOGRAPHY(POLYGON, 4326),
    centroid GEOGRAPHY(POINT, 4326),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(section_id, manzana_key)
);

CREATE INDEX idx_manzanas_section ON manzanas(section_id);
CREATE INDEX idx_manzanas_colonia ON manzanas(colonia_id);


-- ============================================================================
-- SECCIÓN 2: ESTRUCTURA POLÍTICA (La "Torre")
-- ============================================================================

-- Roles en la estructura política
CREATE TABLE political_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID REFERENCES municipalities(municipality_id),
    
    role_key TEXT NOT NULL,                     -- 'campaign_leader', 'district_coord', etc.
    name TEXT NOT NULL,                         -- 'Líder de Campaña'
    description TEXT,
    
    -- Jerarquía
    level INTEGER NOT NULL,                     -- 1=más alto, 5=más bajo
    parent_role_key TEXT,                       -- Rol superior
    
    -- Permisos
    can_view_all_districts BOOLEAN DEFAULT false,
    can_view_all_sections BOOLEAN DEFAULT false,
    can_capture_contacts BOOLEAN DEFAULT true,
    can_manage_events BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT false,
    can_export_data BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar roles por defecto
INSERT INTO political_roles (role_key, name, level, parent_role_key, can_view_all_districts, can_manage_events, can_view_reports, can_export_data) VALUES
('superadmin', 'Candidato / Dueño', 0, NULL, true, true, true, true),
('campaign_leader', 'Líder de Campaña', 1, 'superadmin', true, true, true, true),
('district_coordinator', 'Coordinador Distrital', 2, 'campaign_leader', false, true, true, false),
('section_coordinator', 'Coordinador Seccional', 3, 'district_coordinator', false, true, true, false),
('colonia_leader', 'Jefe de Colonia', 4, 'section_coordinator', false, false, false, false),
('block_promoter', 'Promotor de Manzana', 5, 'colonia_leader', false, false, false, false);

-- Miembros de la estructura (Operadores políticos)
CREATE TABLE political_operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    -- Datos personales
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    
    -- Verificación
    ine_clave_elector TEXT,
    ine_section INTEGER,                        -- Sección donde vota
    ine_verified BOOLEAN DEFAULT false,
    
    -- Rol y asignación
    role_id UUID NOT NULL REFERENCES political_roles(id),
    
    -- Territorio asignado (según nivel)
    assigned_district_id UUID REFERENCES electoral_districts(id),
    assigned_section_id UUID REFERENCES electoral_sections(id),
    assigned_colonia_id UUID REFERENCES colonias(id),
    assigned_manzana_id UUID REFERENCES manzanas(id),
    
    -- Jerarquía
    reports_to_id UUID REFERENCES political_operators(id),
    
    -- Metas
    goal_contacts INTEGER DEFAULT 0,            -- Meta de contactos a capturar
    goal_supporters INTEGER DEFAULT 0,          -- Meta de simpatizantes
    goal_confirmed_votes INTEGER DEFAULT 0,     -- Meta de votos confirmados
    
    -- Estado
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Vinculación con otros sistemas
    admin_user_id UUID REFERENCES admin_users(admin_user_id),   -- Si tiene acceso al panel
    citizen_id UUID,                            -- Si está registrado como ciudadano
    
    -- Metadata
    recruited_by_id UUID REFERENCES political_operators(id),
    recruited_at TIMESTAMPTZ,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_operators_municipality ON political_operators(municipality_id);
CREATE INDEX idx_operators_role ON political_operators(role_id);
CREATE INDEX idx_operators_district ON political_operators(assigned_district_id);
CREATE INDEX idx_operators_section ON political_operators(assigned_section_id);
CREATE INDEX idx_operators_reports_to ON political_operators(reports_to_id);
CREATE INDEX idx_operators_phone ON political_operators(phone);


-- ============================================================================
-- SECCIÓN 3: CONTACTOS POLÍTICOS (CRM Electoral)
-- ============================================================================

-- Niveles de apoyo
CREATE TYPE support_level AS ENUM (
    'hard_supporter',      -- Voto duro, 100% confirmado
    'soft_supporter',      -- Simpatizante, probable
    'undecided',           -- Indeciso
    'leaning_opposition',  -- Inclinado a oposición
    'opposition',          -- Oposición confirmada
    'unknown'              -- Sin clasificar
);

-- Contactos capturados en campo
CREATE TABLE political_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    -- ¿Quién lo capturó?
    captured_by_id UUID NOT NULL REFERENCES political_operators(id),
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    capture_method TEXT DEFAULT 'field',        -- field, event, referral, import
    
    -- Datos personales
    name TEXT NOT NULL,
    paternal_surname TEXT,
    maternal_surname TEXT,
    phone TEXT,
    email TEXT,
    
    -- Dirección
    street TEXT,
    exterior_number TEXT,
    interior_number TEXT,
    colonia_id UUID REFERENCES colonias(id),
    colonia_text TEXT,                          -- Si no está en catálogo
    postal_code TEXT,
    
    -- Datos electorales (de INE si se capturó)
    ine_clave_elector TEXT,
    ine_curp TEXT,
    ine_section INTEGER,
    section_id UUID REFERENCES electoral_sections(id),
    ine_verified BOOLEAN DEFAULT false,
    
    -- Clasificación política
    support_level support_level DEFAULT 'unknown',
    support_level_confidence DECIMAL(3,2),      -- 0.00 a 1.00
    support_notes TEXT,
    
    -- Intereses y issues
    issues_of_interest TEXT[],                  -- ['seguridad', 'baches', 'agua']
    specific_requests TEXT,                     -- Peticiones específicas
    
    -- Vinculación
    citizen_id UUID,                            -- Si se registró en app ciudadana
    linked_at TIMESTAMPTZ,
    
    -- Para eventos
    can_attend_events BOOLEAN DEFAULT true,
    preferred_contact_method TEXT DEFAULT 'whatsapp',
    best_contact_time TEXT,
    
    -- Household (hogar)
    household_size INTEGER,
    is_household_head BOOLEAN,
    household_id UUID,                          -- Para agrupar familia
    
    -- Estado
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased', 'moved', 'duplicate')),
    do_not_contact BOOLEAN DEFAULT false,
    
    -- Metadata
    last_contact_at TIMESTAMPTZ,
    total_interactions INTEGER DEFAULT 0,
    tags TEXT[],
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_municipality ON political_contacts(municipality_id);
CREATE INDEX idx_contacts_captured_by ON political_contacts(captured_by_id);
CREATE INDEX idx_contacts_phone ON political_contacts(phone);
CREATE INDEX idx_contacts_section ON political_contacts(section_id);
CREATE INDEX idx_contacts_colonia ON political_contacts(colonia_id);
CREATE INDEX idx_contacts_support ON political_contacts(support_level);
CREATE INDEX idx_contacts_ine_section ON political_contacts(ine_section);
CREATE INDEX idx_contacts_citizen ON political_contacts(citizen_id);

-- Historial de interacciones con contactos
CREATE TABLE contact_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES political_contacts(id),
    operator_id UUID NOT NULL REFERENCES political_operators(id),
    
    interaction_type TEXT NOT NULL,             -- visit, call, whatsapp, event, delivery
    interaction_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Resultado
    outcome TEXT,                               -- positive, neutral, negative, not_home, refused
    support_level_before support_level,
    support_level_after support_level,
    
    -- Detalles
    notes TEXT,
    commitments TEXT[],                         -- Compromisos hechos
    
    -- Si fue en evento
    event_id UUID,
    
    -- Ubicación
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_contact ON contact_interactions(contact_id);
CREATE INDEX idx_interactions_operator ON contact_interactions(operator_id);
CREATE INDEX idx_interactions_date ON contact_interactions(interaction_date);


-- ============================================================================
-- SECCIÓN 4: EVENTOS Y BRIGADAS
-- ============================================================================

-- Tipos de evento
CREATE TABLE event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID REFERENCES municipalities(municipality_id),
    
    type_key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    
    -- Configuración
    requires_registration BOOLEAN DEFAULT false,
    requires_ine BOOLEAN DEFAULT false,
    allows_walk_ins BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tipos por defecto
INSERT INTO event_types (type_key, name, description, requires_ine) VALUES
('brigade', 'Brigada', 'Recorrido casa por casa', false),
('rally', 'Mitin', 'Evento masivo', false),
('town_hall', 'Cabildo Abierto', 'Reunión con ciudadanos', false),
('delivery', 'Entrega de Apoyos', 'Entrega de despensas, materiales, etc.', true),
('training', 'Capacitación', 'Capacitación de estructura', false),
('door_to_door', 'Puerta a Puerta', 'Visitas domiciliarias', false),
('registration', 'Registro de Simpatizantes', 'Jornada de registro', true);

-- Eventos/Brigadas
CREATE TABLE field_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    
    -- Tipo
    event_type_id UUID NOT NULL REFERENCES event_types(id),
    
    -- Info básica
    name TEXT NOT NULL,
    description TEXT,
    
    -- Ubicación
    address TEXT,
    colonia_id UUID REFERENCES colonias(id),
    section_id UUID REFERENCES electoral_sections(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Programación
    scheduled_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- Responsable
    organizer_id UUID REFERENCES political_operators(id),
    district_id UUID REFERENCES electoral_districts(id),
    
    -- Metas
    expected_attendees INTEGER DEFAULT 0,
    expected_new_contacts INTEGER DEFAULT 0,
    
    -- Resultados (se llenan después)
    actual_attendees INTEGER DEFAULT 0,
    new_contacts_captured INTEGER DEFAULT 0,
    
    -- Estado
    status TEXT DEFAULT 'planned' CHECK (status IN (
        'draft', 'planned', 'confirmed', 'in_progress', 'completed', 'cancelled'
    )),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES political_operators(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_municipality ON field_events(municipality_id);
CREATE INDEX idx_events_date ON field_events(scheduled_date);
CREATE INDEX idx_events_section ON field_events(section_id);
CREATE INDEX idx_events_district ON field_events(district_id);
CREATE INDEX idx_events_status ON field_events(status);

-- Staff asignado a eventos
CREATE TABLE event_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES field_events(id),
    operator_id UUID NOT NULL REFERENCES political_operators(id),
    
    role TEXT DEFAULT 'staff',                  -- organizer, coordinator, staff, volunteer
    
    -- Check-in del staff
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    
    -- Métricas individuales
    contacts_captured INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, operator_id)
);

-- Asistencia a eventos (contactos/ciudadanos)
CREATE TABLE event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES field_events(id),
    
    -- Quién asistió (uno de los dos)
    contact_id UUID REFERENCES political_contacts(id),
    citizen_id UUID,
    
    -- Si es walk-in sin registro previo
    walk_in_name TEXT,
    walk_in_phone TEXT,
    
    -- Check-in
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    checked_in_by UUID REFERENCES political_operators(id),
    
    -- ¿Qué recibió?
    benefits_received TEXT[],                   -- ['despensa', 'playera', 'gorra']
    
    -- Captura de INE en evento
    ine_captured BOOLEAN DEFAULT false,
    ine_section INTEGER,
    
    -- Notas
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendance_event ON event_attendance(event_id);
CREATE INDEX idx_attendance_contact ON event_attendance(contact_id);
CREATE INDEX idx_attendance_citizen ON event_attendance(citizen_id);


-- ============================================================================
-- SECCIÓN 5: DÍA D (Jornada Electoral)
-- ============================================================================

-- Casillas
CREATE TABLE polling_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES electoral_sections(id),
    
    -- Identificación oficial
    station_type TEXT NOT NULL,                 -- basica, contigua, extraordinaria, especial
    station_number INTEGER NOT NULL,            -- 1, 2, 3 dentro de la sección
    station_key TEXT NOT NULL,                  -- 'NL-1432-B1', 'NL-1432-C1'
    
    -- Ubicación
    location_name TEXT,                         -- Escuela Benito Juárez
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Padrón
    registered_voters INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(section_id, station_type, station_number)
);

CREATE INDEX idx_stations_section ON polling_stations(section_id);

-- Representantes de Casilla (RCs y RGs)
CREATE TABLE polling_representatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES polling_stations(id),
    operator_id UUID NOT NULL REFERENCES political_operators(id),
    
    -- Tipo
    rep_type TEXT NOT NULL,                     -- 'RG' (General), 'RC' (Casilla), 'suplente'
    
    -- Estado día D
    confirmed BOOLEAN DEFAULT false,
    trained BOOLEAN DEFAULT false,
    has_credentials BOOLEAN DEFAULT false,
    
    -- Check-in día D
    arrived_at TIMESTAMPTZ,
    departed_at TIMESTAMPTZ,
    
    -- Contacto de emergencia
    emergency_contact TEXT,
    emergency_phone TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(station_id, operator_id)
);

-- Incidencias día D
CREATE TABLE election_day_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES polling_stations(id),
    reported_by UUID NOT NULL REFERENCES political_operators(id),
    
    incident_type TEXT NOT NULL,                -- apertura_tarde, falta_material, intimidacion, etc.
    severity TEXT DEFAULT 'medium',             -- low, medium, high, critical
    
    description TEXT NOT NULL,
    
    -- Evidencia
    photo_urls TEXT[],
    
    -- Estado
    status TEXT DEFAULT 'reported',             -- reported, escalated, resolved
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Ubicación
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conteo paralelo (resultados preliminares)
CREATE TABLE parallel_count (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES polling_stations(id),
    reported_by UUID NOT NULL REFERENCES political_operators(id),
    
    -- Votos por partido/candidato (JSON flexible)
    vote_counts JSONB NOT NULL,                 -- {"PAN": 150, "MORENA": 200, ...}
    
    -- Totales
    total_votes INTEGER,
    null_votes INTEGER,
    
    -- Evidencia
    acta_photo_url TEXT,
    
    -- Verificación
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(station_id)
);


-- ============================================================================
-- SECCIÓN 6: VINCULACIÓN INTELIGENTE
-- ============================================================================

-- Función para vincular ciudadano con contacto político
CREATE OR REPLACE FUNCTION link_citizen_to_contact()
RETURNS TRIGGER AS $$
DECLARE
    v_contact_id UUID;
    v_operator_id UUID;
BEGIN
    -- Buscar contacto por teléfono o sección electoral
    SELECT id, captured_by_id INTO v_contact_id, v_operator_id
    FROM political_contacts
    WHERE municipality_id = NEW.municipality_id
      AND citizen_id IS NULL
      AND (
          (phone IS NOT NULL AND phone = NEW.phone)
          OR (ine_section IS NOT NULL AND ine_section = NEW.ine_section 
              AND UPPER(name) = UPPER(NEW.first_name || ' ' || NEW.paternal_surname))
      )
    LIMIT 1;
    
    IF v_contact_id IS NOT NULL THEN
        -- Vincular
        UPDATE political_contacts
        SET citizen_id = NEW.citizen_id,
            linked_at = NOW(),
            ine_verified = TRUE
        WHERE id = v_contact_id;
        
        -- TODO: Notificar al operador que lo capturó
        -- INSERT INTO notifications (...)
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vista: Métricas por sección
CREATE OR REPLACE VIEW v_section_metrics AS
SELECT 
    s.id AS section_id,
    s.section_number,
    s.estimated_voters,
    d.district_number,
    
    -- Estructura
    (SELECT COUNT(*) FROM political_operators WHERE assigned_section_id = s.id AND status = 'active') AS operators_count,
    
    -- Contactos
    (SELECT COUNT(*) FROM political_contacts WHERE section_id = s.id AND status = 'active') AS contacts_count,
    (SELECT COUNT(*) FROM political_contacts WHERE section_id = s.id AND support_level = 'hard_supporter') AS hard_supporters,
    (SELECT COUNT(*) FROM political_contacts WHERE section_id = s.id AND support_level = 'soft_supporter') AS soft_supporters,
    (SELECT COUNT(*) FROM political_contacts WHERE section_id = s.id AND support_level = 'undecided') AS undecided,
    
    -- Ciudadanos registrados en app
    (SELECT COUNT(*) FROM citizens WHERE ine_section = s.section_number AND status = 'active') AS citizens_registered,
    
    -- Cobertura
    CASE 
        WHEN s.estimated_voters > 0 
        THEN ROUND(((SELECT COUNT(*) FROM political_contacts WHERE section_id = s.id)::DECIMAL / s.estimated_voters) * 100, 2)
        ELSE 0 
    END AS coverage_percentage

FROM electoral_sections s
JOIN electoral_districts d ON s.district_id = d.id;

-- Vista: Métricas por operador (su "torre")
CREATE OR REPLACE VIEW v_operator_metrics AS
SELECT 
    o.id AS operator_id,
    o.name,
    r.role_key,
    r.level AS role_level,
    
    -- Subordinados directos
    (SELECT COUNT(*) FROM political_operators WHERE reports_to_id = o.id AND status = 'active') AS direct_reports,
    
    -- Contactos capturados
    (SELECT COUNT(*) FROM political_contacts WHERE captured_by_id = o.id) AS contacts_captured,
    (SELECT COUNT(*) FROM political_contacts WHERE captured_by_id = o.id AND support_level = 'hard_supporter') AS hard_supporters_captured,
    
    -- Eventos
    (SELECT COUNT(*) FROM field_events WHERE organizer_id = o.id) AS events_organized,
    
    -- Metas
    o.goal_contacts,
    o.goal_supporters,
    CASE 
        WHEN o.goal_contacts > 0 
        THEN ROUND(((SELECT COUNT(*) FROM political_contacts WHERE captured_by_id = o.id)::DECIMAL / o.goal_contacts) * 100, 2)
        ELSE 0 
    END AS contacts_goal_percentage

FROM political_operators o
JOIN political_roles r ON o.role_id = r.id;


-- ============================================================================
-- SECCIÓN 7: ÍNDICES ADICIONALES Y RLS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE electoral_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE electoral_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE colonias ENABLE ROW LEVEL SECURITY;
ALTER TABLE political_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE political_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE polling_stations ENABLE ROW LEVEL SECURITY;

-- Nota: Las políticas RLS específicas se definen según el rol del usuario
-- Por ahora dejamos acceso abierto para desarrollo

CREATE POLICY "Allow all for development" ON electoral_districts FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON electoral_sections FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON colonias FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON political_operators FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON political_contacts FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON field_events FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON event_attendance FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON polling_stations FOR ALL USING (true);
