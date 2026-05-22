'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
}

export class MapErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // Suppress Leaflet-specific errors that don't affect functionality
    if (error.message?.includes('_leaflet_pos') || error.message?.includes('leaflet')) {
      console.warn('[MapErrorBoundary] Suppressed Leaflet error:', error.message)
      this.setState({ hasError: false }) // Auto-recover
      return
    }
    console.error('[MapErrorBoundary] Map error:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-400">Error cargando mapa. Recarga la página.</p>
        </div>
      )
    }
    return this.props.children
  }
}
