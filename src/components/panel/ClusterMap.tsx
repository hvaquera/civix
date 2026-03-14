'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Contact {
  lat: number
  lng: number
  support: string
  name?: string
}

interface ClusterData {
  name: string
  centroid_lat: number
  centroid_lng: number
  radius_meters: number
  contacts_count: number
  contact_ids: string[]
  contacts?: Contact[]
  streets: string[]
  dominant_issue: string
  support_breakdown: { hard: number; soft: number; undecided: number }
  confidence: number
  color: string
}

interface ClusterMapProps {
  clusters: ClusterData[]
  center: [number, number]
}

const SUPPORT_COLORS: Record<string, string> = {
  hard_supporter: '#22c55e',
  soft_supporter: '#facc15',
  undecided: '#94a3b8',
  opponent: '#ef4444',
  unknown: '#d1d5db',
}

export default function ClusterMap({ clusters, center }: ClusterMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = L.map(containerRef.current, {
      center: center,
      zoom: 15,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    const bounds = L.latLngBounds([])

    clusters.forEach((cluster) => {
      const clusterCenter = L.latLng(cluster.centroid_lat, cluster.centroid_lng)
      bounds.extend(clusterCenter)

      // Cluster circle
      L.circle(clusterCenter, {
        radius: cluster.radius_meters || 200,
        color: cluster.color,
        fillColor: cluster.color,
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6 4',
      }).addTo(map)

      // Cluster label
      const labelHtml = `
        <div style="
          background: ${cluster.color}; 
          color: white; 
          padding: 6px 10px; 
          border-radius: 8px; 
          font-size: 12px; 
          font-weight: 600;
          box-shadow: 0 2px 8px ${cluster.color}40;
          white-space: nowrap;
          text-align: center;
          line-height: 1.3;
        ">
          ${cluster.name}<br/>
          <span style="font-size: 10px; opacity: 0.85">${cluster.contacts_count} contactos · ${cluster.dominant_issue}</span>
        </div>
      `

      L.marker(clusterCenter, {
        icon: L.divIcon({
          html: labelHtml,
          className: '',
          iconSize: [200, 50],
          iconAnchor: [100, 25],
        }),
      }).addTo(map)

      // Real contact dots — use actual coordinates when available
      if (cluster.contacts && cluster.contacts.length > 0) {
        cluster.contacts.forEach((contact) => {
          const pointColor = SUPPORT_COLORS[contact.support] || SUPPORT_COLORS.unknown
          const point = L.latLng(contact.lat, contact.lng)
          bounds.extend(point)

          L.circleMarker(point, {
            radius: 5,
            color: '#fff',
            fillColor: pointColor,
            fillOpacity: 0.9,
            weight: 1.5,
          }).addTo(map).bindPopup(
            `<div style="font-size:12px"><strong>${contact.name || 'Contacto'}</strong><br/><span style="color:${pointColor}">● ${contact.support?.replace('_', ' ')}</span></div>`,
            { closeButton: false }
          )
        })
      }
    })

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2))
    }

    setTimeout(() => map.invalidateSize(), 200)

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [clusters, center])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
    />
  )
}
