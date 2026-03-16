'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface SectionData {
  section_number: number;
  district_number: number;
  total_supporters: number;
  total_operators: number;
  coverage_pct: number;
  estimated_houses: number;
  total_contacts: number;
  coordinates: [number, number][];
}

interface ElectoralMapProps {
  accessToken: string;
  sections?: SectionData[];
  onSectionClick?: (section: SectionData) => void;
}

const getColor = (value: number, metric: 'supporters' | 'coverage' | 'operators'): string => {
  if (metric === 'coverage') {
    if (value >= 80) return '#22c55e';
    if (value >= 60) return '#84cc16';
    if (value >= 40) return '#eab308';
    if (value >= 20) return '#f97316';
    return '#ef4444';
  } else if (metric === 'supporters') {
    if (value >= 300) return '#1e3a8a';
    if (value >= 200) return '#1d4ed8';
    if (value >= 100) return '#3b82f6';
    if (value >= 50) return '#60a5fa';
    return '#93c5fd';
  } else {
    if (value >= 10) return '#7c3aed';
    if (value >= 5) return '#8b5cf6';
    if (value >= 3) return '#a78bfa';
    if (value >= 1) return '#c4b5fd';
    return '#e0e7ff';
  }
};

export default function ElectoralMap({
  accessToken,
  sections = [],
  onSectionClick,
}: ElectoralMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  
  const [filters, setFilters] = useState<{
    district: number | null;
    metric: 'supporters' | 'coverage' | 'operators';
  }>({
    district: null,
    metric: 'coverage',
  });
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(11);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-100.3161, 25.6866],
      zoom: 11,
      minZoom: 9,
      maxZoom: 19,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.current.on('load', () => {
      if (!map.current) return;
      setMapLoaded(true);

      // Add OSM Buildings layer — visible at zoom 16+
      map.current.addSource('osm-buildings', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8',
      });

      map.current.addLayer({
        id: 'buildings-3d',
        source: 'osm-buildings',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['get', 'height'],
            0, '#e2e8f0',
            20, '#94a3b8',
          ],
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            16, ['get', 'height']
          ],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.6,
        },
      });

      // Also add flat building outlines for zoom 15+
      map.current.addLayer({
        id: 'buildings-outline',
        source: 'osm-buildings',
        'source-layer': 'building',
        type: 'line',
        minzoom: 15,
        paint: {
          'line-color': '#94a3b8',
          'line-width': 0.5,
          'line-opacity': 0.5,
        },
      });
    });

    map.current.on('zoom', () => {
      if (map.current) setCurrentZoom(Math.round(map.current.getZoom()));
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [accessToken]);

  // Add/update section polygons
  useEffect(() => {
    if (!map.current || !mapLoaded || sections.length === 0) return;

    const sourceId = 'sections-source';
    const layerId = 'sections-layer';
    const outlineLayerId = 'sections-outline';

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: sections
        .filter(s => !filters.district || s.district_number === filters.district)
        .map((section, idx) => ({
          type: 'Feature',
          id: idx,
          properties: {
            section_number: section.section_number,
            district_number: section.district_number,
            total_supporters: section.total_supporters,
            total_operators: section.total_operators,
            coverage_pct: section.coverage_pct,
            estimated_houses: section.estimated_houses || 0,
            total_contacts: section.total_contacts || 0,
            color: getColor(
              filters.metric === 'coverage' ? section.coverage_pct :
              filters.metric === 'supporters' ? section.total_supporters :
              section.total_operators,
              filters.metric
            ),
          },
          geometry: {
            type: 'Polygon',
            coordinates: [section.coordinates],
          },
        })),
    };

    if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
    if (map.current.getLayer(outlineLayerId)) map.current.removeLayer(outlineLayerId);
    if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

    map.current.addSource(sourceId, { type: 'geojson', data: geojson });

    // Insert section layers BELOW the buildings layers
    map.current.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.9,
          0.6,
        ],
      },
    }, 'buildings-outline'); // Insert below buildings

    map.current.addLayer({
      id: outlineLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#1f2937',
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          2.5,
          0.8,
        ],
      },
    }, 'buildings-outline');

    // Hover
    let hoveredId: number | null = null;

    map.current.on('mousemove', layerId, (e) => {
      if (!map.current || !e.features || e.features.length === 0) return;
      map.current.getCanvas().style.cursor = 'pointer';
      const feature = e.features[0];
      const p = feature.properties || {};

      const houses = p.estimated_houses || 0;
      const contacts = p.total_contacts || 0;
      const penetration = houses > 0 ? ((contacts / houses) * 100).toFixed(1) : '—';
      const delta = houses > 0 ? houses - contacts : 0;

      popup.current?.setLngLat(e.lngLat).setHTML(`
        <div style="padding:8px;min-width:200px;font-family:system-ui">
          <div style="font-weight:700;font-size:14px;color:#111">Sección ${p.section_number}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:8px">Distrito ${p.district_number}</div>
          <div style="display:grid;grid-template-columns:1fr auto;gap:4px;font-size:12px">
            <span style="color:#6b7280">Simpatizantes:</span>
            <span style="font-weight:600;text-align:right">${p.total_supporters || 0}</span>
            <span style="color:#6b7280">Operadores:</span>
            <span style="font-weight:600;text-align:right">${p.total_operators || 0}</span>
            <span style="color:#6b7280">Cobertura:</span>
            <span style="font-weight:600;text-align:right">${p.coverage_pct || 0}%</span>
          </div>
          <div style="border-top:1px solid #e5e7eb;margin-top:8px;padding-top:8px;display:grid;grid-template-columns:1fr auto;gap:4px;font-size:12px">
            <span style="color:#6b7280">🏠 Viviendas estimadas:</span>
            <span style="font-weight:600;text-align:right">${houses > 0 ? houses.toLocaleString() : 'Sin dato'}</span>
            <span style="color:#6b7280">👥 Contactos registrados:</span>
            <span style="font-weight:600;text-align:right;color:#2563eb">${contacts}</span>
            <span style="color:#6b7280">📊 Penetración:</span>
            <span style="font-weight:600;text-align:right;color:${parseFloat(penetration as string) > 5 ? '#16a34a' : '#dc2626'}">${penetration}%</span>
            ${delta > 0 ? `<span style="color:#6b7280">🎯 Faltan por tocar:</span><span style="font-weight:600;text-align:right;color:#ea580c">${delta.toLocaleString()}</span>` : ''}
          </div>
        </div>
      `).addTo(map.current);

      if (hoveredId !== null) {
        map.current.setFeatureState({ source: sourceId, id: hoveredId }, { hover: false });
      }
      hoveredId = feature.id as number;
      map.current.setFeatureState({ source: sourceId, id: hoveredId }, { hover: true });
    });

    map.current.on('mouseleave', layerId, () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
      popup.current?.remove();
      if (hoveredId !== null) {
        map.current.setFeatureState({ source: sourceId, id: hoveredId }, { hover: false });
      }
      hoveredId = null;
    });

    map.current.on('click', layerId, (e) => {
      if (!e.features || e.features.length === 0) return;
      const props = e.features[0].properties;
      const section = sections.find(s => s.section_number === props?.section_number);
      if (section) {
        setSelectedSection(section);
        onSectionClick?.(section);
      }
    });

  }, [mapLoaded, sections, filters, onSectionClick]);

  // Fit bounds
  useEffect(() => {
    if (!map.current || !mapLoaded || sections.length === 0) return;
    const filtered = filters.district ? sections.filter(s => s.district_number === filters.district) : sections;
    if (filtered.length === 0) return;

    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    filtered.forEach(s => s.coordinates.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng); minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng); maxLat = Math.max(maxLat, lat);
    }));

    map.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 50, duration: 1000 });
  }, [mapLoaded, sections, filters.district]);

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '500px' }}>
      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <div ref={mapContainer} className="absolute inset-0" style={{ minHeight: '400px' }} />
        
        {/* Zoom hint */}
        {currentZoom < 15 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs z-10 pointer-events-none">
            Zoom in para ver edificios y casas
          </div>
        )}
        {currentZoom >= 15 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600/80 text-white px-3 py-1.5 rounded-full text-xs z-10 pointer-events-none flex items-center gap-1.5">
            🏠 Mostrando edificios — Zoom {currentZoom}
          </div>
        )}

        {/* Section detail panel */}
        {selectedSection && (
          <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 w-80 z-10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">Sección {selectedSection.section_number}</h3>
                <p className="text-sm text-gray-500">Distrito {selectedSection.district_number}</p>
              </div>
              <button onClick={() => setSelectedSection(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Simpatizantes</span>
                <span className="text-xl font-bold text-blue-600">{selectedSection.total_supporters}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-violet-50 rounded-lg">
                <span className="text-sm text-gray-600">Operadores</span>
                <span className="text-xl font-bold text-violet-600">{selectedSection.total_operators}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Cobertura</span>
                <span className="text-xl font-bold text-green-600">{selectedSection.coverage_pct}%</span>
              </div>
              {selectedSection.estimated_houses > 0 && (
                <>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
                      <span className="text-sm text-gray-600">🏠 Viviendas</span>
                      <span className="text-xl font-bold text-amber-600">{selectedSection.estimated_houses.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                    <span className="text-sm text-gray-600">🎯 Faltan tocar</span>
                    <span className="text-xl font-bold text-orange-600">
                      {(selectedSection.estimated_houses - (selectedSection.total_contacts || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-civix-500 h-2 rounded-full transition-all" 
                      style={{ width: `${Math.min(((selectedSection.total_contacts || 0) / selectedSection.estimated_houses) * 100, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    {((selectedSection.total_contacts || 0) / selectedSection.estimated_houses * 100).toFixed(1)}% de penetración
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t">
              <button className="w-full bg-civix-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-civix-primary/90 transition-colors">
                Ver detalle completo
              </button>
            </div>
          </div>
        )}

        {/* Stats overlay */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow p-3 z-10">
          <div className="text-xs text-gray-500 mb-1">
            {filters.district ? `Distrito ${filters.district}` : 'Monterrey'}
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-600">Secciones: </span>
              <span className="font-bold">{sections.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Simpatizantes: </span>
              <span className="font-bold text-blue-600">
                {sections.reduce((sum, s) => sum + s.total_supporters, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
