'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Types
interface SectionData {
  section_number: number;
  district_number: number;
  total_supporters: number;
  total_operators: number;
  coverage_pct: number;
  coordinates: [number, number][];
}

interface DistrictData {
  district_number: number;
  name: string;
  total_sections: number;
  total_supporters: number;
  coverage_pct: number;
  coordinates: [number, number][];
}

interface MapFilters {
  district: number | null;
  metric: 'supporters' | 'coverage' | 'operators';
  level: 'sections' | 'districts';
}

interface ElectoralMapProps {
  accessToken: string;
  sections?: SectionData[];
  districts?: DistrictData[];
  onSectionClick?: (section: SectionData) => void;
  onDistrictClick?: (district: DistrictData) => void;
}

// Color scales based on metric values
const getColor = (value: number, metric: 'supporters' | 'coverage' | 'operators'): string => {
  if (metric === 'coverage') {
    // Coverage: red (0%) -> yellow (50%) -> green (100%)
    if (value >= 80) return '#22c55e'; // green
    if (value >= 60) return '#84cc16'; // lime
    if (value >= 40) return '#eab308'; // yellow
    if (value >= 20) return '#f97316'; // orange
    return '#ef4444'; // red
  } else if (metric === 'supporters') {
    // Supporters: light blue (few) -> dark blue (many)
    if (value >= 300) return '#1e3a8a'; // blue-900
    if (value >= 200) return '#1d4ed8'; // blue-700
    if (value >= 100) return '#3b82f6'; // blue-500
    if (value >= 50) return '#60a5fa';  // blue-400
    return '#93c5fd'; // blue-300
  } else {
    // Operators: similar scale
    if (value >= 10) return '#7c3aed'; // violet-600
    if (value >= 5) return '#8b5cf6';  // violet-500
    if (value >= 3) return '#a78bfa';  // violet-400
    if (value >= 1) return '#c4b5fd';  // violet-300
    return '#e0e7ff'; // indigo-100
  }
};

export default function ElectoralMap({
  accessToken,
  sections = [],
  districts = [],
  onSectionClick,
  onDistrictClick,
}: ElectoralMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  
  const [filters, setFilters] = useState<MapFilters>({
    district: null,
    metric: 'coverage',
    level: 'sections',
  });
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-100.3161, 25.6866], // Monterrey center
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Create popup
    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
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

    // Convert sections to GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: sections
        .filter(s => !filters.district || s.district_number === filters.district)
        .map(section => ({
          type: 'Feature',
          properties: {
            section_number: section.section_number,
            district_number: section.district_number,
            total_supporters: section.total_supporters,
            total_operators: section.total_operators,
            coverage_pct: section.coverage_pct,
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

    // Remove existing layers if they exist
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getLayer(outlineLayerId)) {
      map.current.removeLayer(outlineLayerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Add source
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
    });

    // Add fill layer
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
          0.7,
        ],
      },
    });

    // Add outline layer
    map.current.addLayer({
      id: outlineLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#374151',
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          2,
          0.5,
        ],
      },
    });

    // Hover effects
    let hoveredId: number | null = null;

    map.current.on('mousemove', layerId, (e) => {
      if (!map.current || !e.features || e.features.length === 0) return;
      
      map.current.getCanvas().style.cursor = 'pointer';
      
      const feature = e.features[0];
      const props = feature.properties;
      
      // Update popup
      popup.current?.setLngLat(e.lngLat).setHTML(`
        <div class="p-2 min-w-[150px]">
          <div class="font-bold text-gray-900">Sección ${props?.section_number}</div>
          <div class="text-xs text-gray-500 mb-2">Distrito ${props?.district_number}</div>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Simpatizantes:</span>
              <span class="font-medium">${props?.total_supporters || 0}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Operadores:</span>
              <span class="font-medium">${props?.total_operators || 0}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Cobertura:</span>
              <span class="font-medium">${props?.coverage_pct || 0}%</span>
            </div>
          </div>
        </div>
      `).addTo(map.current);

      // Highlight
      if (hoveredId !== null) {
        map.current.setFeatureState(
          { source: sourceId, id: hoveredId },
          { hover: false }
        );
      }
      hoveredId = feature.id as number;
      map.current.setFeatureState(
        { source: sourceId, id: hoveredId },
        { hover: true }
      );
    });

    map.current.on('mouseleave', layerId, () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
      popup.current?.remove();
      
      if (hoveredId !== null) {
        map.current.setFeatureState(
          { source: sourceId, id: hoveredId },
          { hover: false }
        );
      }
      hoveredId = null;
    });

    // Click handler
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

  // Fit bounds when sections change
  useEffect(() => {
    if (!map.current || !mapLoaded || sections.length === 0) return;

    const filteredSections = filters.district 
      ? sections.filter(s => s.district_number === filters.district)
      : sections;

    if (filteredSections.length === 0) return;

    // Calculate bounds
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    
    filteredSections.forEach(section => {
      section.coordinates.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        minLat = Math.min(minLat, lat);
        maxLng = Math.max(maxLng, lng);
        maxLat = Math.max(maxLat, lat);
      });
    });

    map.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 50, duration: 1000 }
    );
  }, [mapLoaded, sections, filters.district]);

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '500px' }}>
      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <div ref={mapContainer} className="absolute inset-0" style={{ minHeight: '400px' }} />
        
        {/* Section detail panel */}
        {selectedSection && (
          <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 w-72 z-10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">Sección {selectedSection.section_number}</h3>
                <p className="text-sm text-gray-500">Distrito {selectedSection.district_number}</p>
              </div>
              <button 
                onClick={() => setSelectedSection(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
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
              <span className="font-bold">
                {filters.district 
                  ? sections.filter(s => s.district_number === filters.district).length
                  : sections.length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Simpatizantes: </span>
              <span className="font-bold text-blue-600">
                {(filters.district 
                  ? sections.filter(s => s.district_number === filters.district)
                  : sections
                ).reduce((sum, s) => sum + s.total_supporters, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
