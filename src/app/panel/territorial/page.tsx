'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  MapPin, 
  Users, 
  Target, 
  TrendingUp, 
  Download,
  RefreshCw
} from 'lucide-react';

// Dynamic import to avoid SSR issues with Mapbox
const ElectoralMap = dynamic(
  () => import('@/components/panel/ElectoralMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-civix-primary mx-auto mb-2" />
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }
);

// Mock data fallback
const generateMockSections = () => {
  const sections = [];
  const districts = [
    { num: 1, centerLat: 25.75, centerLng: -100.35, count: 30 },
    { num: 2, centerLat: 25.70, centerLng: -100.30, count: 30 },
    { num: 3, centerLat: 25.68, centerLng: -100.38, count: 30 },
    { num: 6, centerLat: 25.65, centerLng: -100.32, count: 30 },
    { num: 8, centerLat: 25.60, centerLng: -100.35, count: 30 },
  ];

  let sectionNum = 1000;
  
  districts.forEach(district => {
    for (let i = 0; i < district.count; i++) {
      const lat = district.centerLat + (Math.random() - 0.5) * 0.1;
      const lng = district.centerLng + (Math.random() - 0.5) * 0.1;
      const size = 0.003 + Math.random() * 0.005;
      
      sections.push({
        section_number: sectionNum++,
        district_number: district.num,
        total_supporters: Math.floor(Math.random() * 400),
        total_operators: Math.floor(Math.random() * 15),
        coverage_pct: Math.floor(Math.random() * 100),
        coordinates: [
          [lng - size, lat - size],
          [lng + size, lat - size],
          [lng + size, lat + size],
          [lng - size, lat + size],
          [lng - size, lat - size],
        ],
      });
    }
  });

  return sections;
};

export default function TerritorialPage() {
  const [allSections, setAllSections] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [colorBy, setColorBy] = useState<'coverage' | 'supporters' | 'operators'>('coverage');
  const [stats, setStats] = useState({
    totalSections: 0,
    totalSupporters: 0,
    totalOperators: 0,
    avgCoverage: 0,
  });

  // Load sections from API
  useEffect(() => {
    const loadSections = async () => {
      setLoading(true);
      try {
        console.log('[TERRITORIAL] Fetching sections...');
        const response = await fetch('/api/panel/territorial/sections');
        const data = await response.json();
        
        console.log('[TERRITORIAL] Response:', { ok: response.ok, featuresCount: data.features?.length });

        if (response.ok && data.features && data.features.length > 0) {
          const realSections = data.features
            .filter((f: any) => f.geometry && f.geometry.coordinates)
            .map((f: any) => ({
              section_number: f.properties.section_number,
              district_number: f.properties.district_number,
              total_supporters: f.properties.total_supporters || 0,
              total_operators: f.properties.total_operators || 0,
              coverage_pct: f.properties.coverage_pct || 0,
              coordinates: f.geometry.coordinates[0], // First ring of polygon
            }));

          console.log(`[TERRITORIAL] Procesadas ${realSections.length} secciones reales`);
          setAllSections(realSections);
          setFilteredSections(realSections);
          updateStats(realSections);
        } else {
          console.warn('[TERRITORIAL] No hay datos válidos, usando mock');
          const mockSections = generateMockSections();
          setAllSections(mockSections);
          setFilteredSections(mockSections);
          updateStats(mockSections);
        }
      } catch (error) {
        console.error('[TERRITORIAL] Error cargando datos:', error);
        const mockSections = generateMockSections();
        setAllSections(mockSections);
        setFilteredSections(mockSections);
        updateStats(mockSections);
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, []);

  // Filter by district
  useEffect(() => {
    if (selectedDistrict) {
      const filtered = allSections.filter(
        s => s.district_number === parseInt(selectedDistrict)
      );
      setFilteredSections(filtered);
      updateStats(filtered);
    } else {
      setFilteredSections(allSections);
      updateStats(allSections);
    }
  }, [selectedDistrict, allSections]);

  const updateStats = (sections: any[]) => {
    if (sections.length === 0) {
      setStats({ totalSections: 0, totalSupporters: 0, totalOperators: 0, avgCoverage: 0 });
      return;
    }
    setStats({
      totalSections: sections.length,
      totalSupporters: sections.reduce((sum, s) => sum + (s.total_supporters || 0), 0),
      totalOperators: sections.reduce((sum, s) => sum + (s.total_operators || 0), 0),
      avgCoverage: Math.round(
        sections.reduce((sum, s) => sum + (s.coverage_pct || 0), 0) / sections.length
      ),
    });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDistrict(e.target.value);
  };

  const handleSectionClick = (section: any) => {
    console.log('Section clicked:', section);
  };

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  if (!mapboxToken) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800">Configuración requerida</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Agrega <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> a tu archivo .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapa Territorial</h1>
            <p className="text-gray-600 text-sm">Visualiza la cobertura electoral por sección</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm">Exportar</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-4 items-center mt-4 pb-4 border-b">
          {/* District filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Distrito:</label>
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="border rounded-lg px-3 py-1.5 text-sm bg-white cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="1">Distrito 01</option>
              <option value="2">Distrito 02</option>
              <option value="3">Distrito 03</option>
              <option value="6">Distrito 06</option>
              <option value="8">Distrito 08</option>
            </select>
          </div>

          {/* Metric selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Colorear por:</label>
            <div className="flex rounded-lg border overflow-hidden">
              {[
                { key: 'coverage', label: 'Cobertura' },
                { key: 'supporters', label: 'Simpatizantes' },
                { key: 'operators', label: 'Operadores' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setColorBy(key as any)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    colorBy === key
                      ? 'bg-civix-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Bajo</span>
            <div className="flex h-3 rounded overflow-hidden">
              <div className="w-6 bg-red-500" />
              <div className="w-6 bg-orange-500" />
              <div className="w-6 bg-yellow-500" />
              <div className="w-6 bg-lime-500" />
              <div className="w-6 bg-green-500" />
            </div>
            <span className="text-xs text-gray-500">Alto</span>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">{stats.totalSections}</p>
                <p className="text-sm text-blue-700">Secciones</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.totalSupporters.toLocaleString()}</p>
                <p className="text-sm text-green-700">Simpatizantes</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-900">{stats.totalOperators}</p>
                <p className="text-sm text-violet-700">Operadores</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-900">{stats.avgCoverage}%</p>
                <p className="text-sm text-amber-700">Cobertura promedio</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-[400px]">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-civix-primary mx-auto mb-2" />
              <p className="text-gray-600">Cargando datos territoriales...</p>
            </div>
          </div>
        ) : (
          <div className="h-full" style={{ minHeight: '500px' }}>
            <ElectoralMap
              accessToken={mapboxToken}
              sections={filteredSections}
              onSectionClick={handleSectionClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}
