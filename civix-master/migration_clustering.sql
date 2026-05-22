-- ============================================
-- CIVIX — Territorial Clustering Migration
-- Run AFTER schema_territorial.sql
-- ============================================

-- 1. Add geocoding columns to political_contacts
ALTER TABLE political_contacts 
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cluster_id UUID;

CREATE INDEX IF NOT EXISTS idx_contacts_lat_lng ON political_contacts(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_contacts_cluster ON political_contacts(cluster_id);

-- 2. Territorial clusters (AI-generated, coordinator-approved)
CREATE TABLE IF NOT EXISTS territorial_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID NOT NULL REFERENCES municipalities(municipality_id),
    section_id UUID NOT NULL REFERENCES electoral_sections(id),
    
    -- Identity
    cluster_name TEXT NOT NULL,                   -- AI-suggested: "Zona Río Mississippi" 
    cluster_key TEXT NOT NULL,                    -- Auto: "SEC1234-C01"
    
    -- Geography
    centroid_lat DECIMAL(10, 8) NOT NULL,
    centroid_lng DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 200,            -- Estimated coverage radius
    
    -- Stats (updated by triggers/functions)
    contacts_count INTEGER DEFAULT 0,
    households_estimated INTEGER DEFAULT 0,
    
    -- Assignment
    assigned_manzanero_id UUID REFERENCES political_operators(id),
    assigned_at TIMESTAMPTZ,
    
    -- AI metadata
    ai_confidence DECIMAL(3,2),                   -- 0.00 to 1.00
    ai_suggested_at TIMESTAMPTZ,
    ai_model TEXT,                                -- 'claude-sonnet-4-20250514'
    
    -- Status
    status TEXT DEFAULT 'suggested' CHECK (status IN (
        'suggested',    -- AI proposed, pending review
        'approved',     -- Coordinator approved
        'active',       -- Has manzanero assigned
        'merged',       -- Merged into another cluster
        'dissolved'     -- Too few contacts, removed
    )),
    
    approved_by UUID REFERENCES political_operators(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(section_id, cluster_key)
);

CREATE INDEX idx_clusters_section ON territorial_clusters(section_id);
CREATE INDEX idx_clusters_municipality ON territorial_clusters(municipality_id);
CREATE INDEX idx_clusters_status ON territorial_clusters(status);
CREATE INDEX idx_clusters_manzanero ON territorial_clusters(assigned_manzanero_id);

-- Add FK from contacts to clusters
ALTER TABLE political_contacts 
  ADD CONSTRAINT fk_contacts_cluster 
  FOREIGN KEY (cluster_id) 
  REFERENCES territorial_clusters(id) 
  ON DELETE SET NULL;

-- 3. Cluster history (for tracking evolution over time)
CREATE TABLE IF NOT EXISTS cluster_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID NOT NULL REFERENCES territorial_clusters(id),
    
    event_type TEXT NOT NULL,                     -- 'created', 'contacts_added', 'manzanero_assigned', 'merged', 'split', 'reclustered'
    contacts_count_before INTEGER,
    contacts_count_after INTEGER,
    
    details JSONB,                                -- AI analysis, merge info, etc.
    performed_by UUID REFERENCES political_operators(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cluster_history_cluster ON cluster_history(cluster_id);

-- 4. Function: update cluster stats when contacts change
CREATE OR REPLACE FUNCTION update_cluster_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old cluster if contact moved
    IF OLD IS NOT NULL AND OLD.cluster_id IS NOT NULL THEN
        UPDATE territorial_clusters 
        SET contacts_count = (SELECT COUNT(*) FROM political_contacts WHERE cluster_id = OLD.cluster_id),
            updated_at = NOW()
        WHERE id = OLD.cluster_id;
    END IF;
    
    -- Update new cluster
    IF NEW.cluster_id IS NOT NULL THEN
        UPDATE territorial_clusters 
        SET contacts_count = (SELECT COUNT(*) FROM political_contacts WHERE cluster_id = NEW.cluster_id),
            updated_at = NOW()
        WHERE id = NEW.cluster_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_cluster_stats
    AFTER INSERT OR UPDATE OF cluster_id ON political_contacts
    FOR EACH ROW EXECUTE FUNCTION update_cluster_stats();

-- 5. Function: find nearest cluster for a new contact
CREATE OR REPLACE FUNCTION find_nearest_cluster(
    p_section_id UUID,
    p_lat DECIMAL,
    p_lng DECIMAL,
    p_max_distance_meters INTEGER DEFAULT 500
)
RETURNS UUID AS $$
DECLARE
    v_cluster_id UUID;
BEGIN
    SELECT id INTO v_cluster_id
    FROM territorial_clusters
    WHERE section_id = p_section_id
      AND status IN ('approved', 'active')
      AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(centroid_lng, centroid_lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          p_max_distance_meters
      )
    ORDER BY ST_Distance(
        ST_SetSRID(ST_MakePoint(centroid_lng, centroid_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    )
    LIMIT 1;
    
    RETURN v_cluster_id;
END;
$$ LANGUAGE plpgsql;

-- 6. View: cluster overview for coordinators
CREATE OR REPLACE VIEW v_cluster_overview AS
SELECT 
    tc.id,
    tc.cluster_name,
    tc.cluster_key,
    tc.centroid_lat,
    tc.centroid_lng,
    tc.radius_meters,
    tc.contacts_count,
    tc.status,
    tc.ai_confidence,
    tc.created_at,
    
    -- Section info
    es.section_number,
    ed.district_number,
    
    -- Manzanero info
    po.name AS manzanero_name,
    po.phone AS manzanero_phone,
    
    -- Contact breakdown
    (SELECT COUNT(*) FROM political_contacts pc WHERE pc.cluster_id = tc.id AND pc.support_level = 'hard_supporter') AS hard_supporters,
    (SELECT COUNT(*) FROM political_contacts pc WHERE pc.cluster_id = tc.id AND pc.support_level = 'soft_supporter') AS soft_supporters,
    (SELECT COUNT(*) FROM political_contacts pc WHERE pc.cluster_id = tc.id AND pc.support_level = 'undecided') AS undecided,
    
    -- Top issues
    (SELECT array_agg(DISTINCT unnest) FROM political_contacts pc, unnest(pc.issues_of_interest) WHERE pc.cluster_id = tc.id LIMIT 5) AS top_issues

FROM territorial_clusters tc
JOIN electoral_sections es ON tc.section_id = es.id
JOIN electoral_districts ed ON es.district_id = ed.id
LEFT JOIN political_operators po ON tc.assigned_manzanero_id = po.id;

-- 7. RLS for development
ALTER TABLE territorial_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for development" ON territorial_clusters FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON cluster_history FOR ALL USING (true);
