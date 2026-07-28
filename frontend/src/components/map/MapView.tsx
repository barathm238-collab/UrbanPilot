import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngBoundsExpression } from 'leaflet'
import { RouteRenderer } from './RouteRenderer'
import type { OsrmRoute, SearchResult } from './types'

type FitBoundsProps = { bounds: LatLngBoundsExpression }

function FitBounds({ bounds }: FitBoundsProps) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(bounds, { padding: [48, 48] })
  }, [bounds, map])
  return null
}

type MapViewProps = {
  origin: SearchResult | null
  destination: SearchResult | null
  route: OsrmRoute | null
  loading: boolean
}

export function MapView({ origin, destination, route, loading }: MapViewProps) {
  const boundsRef = useRef<LatLngBoundsExpression | null>(null)

  if (origin && destination) {
    boundsRef.current = [
      [origin.lat, origin.lon],
      [destination.lat, destination.lon],
    ]
  }

  return (
    <div className="relative min-h-[480px] w-full">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom
        dragging
        className="h-full w-full rounded-xl"
        style={{ background: '#e8eaed', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <RouteRenderer origin={origin} destination={destination} route={route} />
        {boundsRef.current && <FitBounds bounds={boundsRef.current} />}
      </MapContainer>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
          <div className="rounded-xl border border-[#e0e0e0] bg-white px-6 py-4 text-center shadow-md">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#e0e0e0] border-t-[#1a73e8]" />
            <p className="mt-3 text-sm font-medium text-[#202124]">Calculating route…</p>
          </div>
        </div>
      )}
    </div>
  )
}
