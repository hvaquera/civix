'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MarkerData {
  id: string
  label: string
  lat: number
  lng: number
}

interface IssueMapProps {
  markers: MarkerData[]
  center?: [number, number]
  zoom?: number
}

export default function IssueMap({ markers, center, zoom = 14 }: IssueMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const defaultCenter: [number, number] = center || [25.6866, -100.3161]

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom,
      scrollWheelZoom: true,
    })
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map)

    const bounds: L.LatLngExpression[] = []

    markers.forEach((m, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background: #0ea5e9;
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 12px; font-weight: 700;
        ">${i + 1}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      L.marker([m.lat, m.lng], { icon })
        .addTo(map)
        .bindPopup(`<div style="font-size:13px"><strong>${m.label}</strong></div>`)

      bounds.push([m.lat, m.lng])
    })

    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50], maxZoom: 16 })
    } else if (bounds.length === 1) {
      map.setView(bounds[0] as L.LatLngExpression, 16)
    }

    // Force resize after mount (fixes grey tiles)
    setTimeout(() => map.invalidateSize(), 200)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div 
      ref={containerRef} 
      className="w-full rounded-lg" 
      style={{ height: '100%', minHeight: 350 }} 
    />
  )
}
