-- ============================================================================
-- CIVIX - PostGIS: Polígonos de Secciones Electorales Monterrey
-- Fuente: INE Cartografía Electoral 2025
-- Total: 761 secciones con geometría
-- ============================================================================

-- Primero, habilitar PostGIS (ejecutar UNA VEZ en Supabase)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Agregar columna de geometría a la tabla electoral_sections si no existe
ALTER TABLE electoral_sections 
ADD COLUMN IF NOT EXISTS geom geometry(Polygon, 4326);

-- Crear índice espacial para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_electoral_sections_geom 
ON electoral_sections USING GIST (geom);

-- ============================================================================
-- ACTUALIZAR SECCIONES CON SUS POLÍGONOS
-- ============================================================================