import { useEffect, useMemo, useState } from 'react'
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api'
import { LocateFixed, MapPin } from 'lucide-react'
import type { Coordinate } from '../services/environmentService'

type GoogleMapViewProps = {
  mapsLoaded: boolean
  loadError?: Error
  start?: Coordinate
  destination?: Coordinate
  routePath: Coordinate[]
  loading?: boolean
}

const defaultCenter = {
  lat: 11.0168,
  lng: 76.9558,
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0B1120' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#020617' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1E293B' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748B' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#020617' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#CBD5E1' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#172554' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#082F49' }] },
]

export function GoogleMapView({ mapsLoaded, loadError, start, destination, routePath, loading = false }: GoogleMapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const center = useMemo(() => start ?? destination ?? defaultCenter, [destination, start])

  useEffect(() => {
    if (!map || !mapsLoaded) {
      return
    }

    const bounds = new google.maps.LatLngBounds()
    const points = [...routePath]

    if (start) {
      points.push(start)
    }
    if (destination) {
      points.push(destination)
    }

    if (points.length === 0) {
      map.setCenter(defaultCenter)
      map.setZoom(12)
      return
    }

    points.forEach((point) => bounds.extend(point))
    map.fitBounds(bounds, 72)
  }, [destination, map, mapsLoaded, routePath, start])

  if (loadError) {
    return (
      <div className="flex h-full min-h-[520px] items-center justify-center bg-[#0B1120]/80 p-8 text-center">
        <div>
          <MapPin className="mx-auto text-rose-300" size={34} />
          <h3 className="mt-4 text-xl font-semibold text-white">Google Maps could not load</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Check the Google Maps API key and browser restrictions, then retry the route search.</p>
        </div>
      </div>
    )
  }

  if (!mapsLoaded) {
    return (
      <div className="relative h-full min-h-[520px] overflow-hidden bg-[#0B1120]">
        <div className="absolute inset-0 ambient-grid opacity-60" />
        <div className="absolute inset-x-8 top-12 h-28 animate-pulse rounded-[30px] bg-white/10" />
        <div className="absolute bottom-12 left-8 right-8 h-40 animate-pulse rounded-[30px] bg-white/[0.07]" />
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[520px]">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        onLoad={setMap}
        options={{
          styles: darkMapStyles,
          disableDefaultUI: false,
          clickableIcons: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
          backgroundColor: '#0B1120',
        }}
      >
        {start ? (
          <MarkerF
            position={start}
            label={{ text: 'S', color: '#FFFFFF', fontWeight: '700' }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#06B6D4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }}
          />
        ) : null}
        {destination ? (
          <MarkerF
            position={destination}
            label={{ text: 'D', color: '#FFFFFF', fontWeight: '700' }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#8B5CF6',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }}
          />
        ) : null}
        {routePath.length > 0 ? (
          <PolylineF
            path={routePath}
            options={{
              strokeColor: '#22D3EE',
              strokeOpacity: 0.92,
              strokeWeight: 6,
              geodesic: true,
            }}
          />
        ) : null}
      </GoogleMap>

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/45 backdrop-blur-sm">
          <div className="rounded-[24px] border border-cyan-400/20 bg-[#0B1120]/80 px-5 py-4 text-center shadow-[0_20px_80px_rgba(2,8,23,0.45)]">
            <LocateFixed className="mx-auto animate-spin text-cyan-300" size={28} />
            <p className="mt-3 text-sm font-semibold text-white">Calculating live route</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
