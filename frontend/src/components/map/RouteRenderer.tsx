import L from 'leaflet'
import { useEffect } from 'react'
import { Marker, Polyline, useMap } from 'react-leaflet'
import type { OsrmRoute, SearchResult } from './types'

// Fix Leaflet default icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type RouteRendererProps = {
  origin: SearchResult | null
  destination: SearchResult | null
  route: OsrmRoute | null
}

function AutoZoom({ origin, destination }: { origin: SearchResult; destination: SearchResult }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(
      [[origin.lat, origin.lon], [destination.lat, destination.lon]],
      { padding: [56, 56] },
    )
  }, [map, origin, destination])
  return null
}

export function RouteRenderer({ origin, destination, route }: RouteRendererProps) {
  return (
    <>
      {origin && (
        <Marker position={[origin.lat, origin.lon]} icon={greenIcon} />
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lon]} icon={redIcon} />
      )}
      {route && route.geometry.length > 1 && (
        <Polyline
          positions={route.geometry}
          pathOptions={{ color: '#22D3EE', weight: 5, opacity: 0.9 }}
        />
      )}
      {origin && destination && <AutoZoom origin={origin} destination={destination} />}
    </>
  )
}
