import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, Gauge, MapPin, Navigation2, Route, Timer } from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'

// ── Fix Leaflet default icon paths ──────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const redIcon = new L.Icon({
  iconUrl:       'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
})

// Blue dot for current location
const blueDotIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:20px;height:20px">
    <div class="location-dot-ring" style="position:absolute;inset:0;border-radius:50%;background:rgba(26,115,232,0.25)"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#1a73e8;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>
  </div>`,
  iconSize:   [20, 20],
  iconAnchor: [10, 10],
})

type LatLng = { lat: number; lng: number }

function CenterOnLocation({ position }: { position: LatLng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true })
  }, [map, position])
  return null
}

function formatDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`
}

function haversineMeters(a: LatLng, b: LatLng) {
  const R = 6_371_000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sin2 = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(sin2))
}

export function MapPage() {
  const [currentPos, setCurrentPos]     = useState<LatLng | null>(null)
  const [destination, setDestination]   = useState<LatLng | null>(null)
  const [destInput, setDestInput]       = useState('')
  const [path, setPath]                 = useState<[number, number][]>([])
  const [speed, setSpeed]               = useState<number | null>(null)
  const [geoError, setGeoError]         = useState<string | null>(null)
  const watchRef                        = useRef<number | null>(null)
  const prevPos                         = useRef<LatLng | null>(null)
  const prevTime                        = useRef<number | null>(null)

  // Start watching position
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCurrentPos(now)
        setGeoError(null)

        // Compute speed from successive positions if browser doesn't provide it
        if (pos.coords.speed != null && pos.coords.speed >= 0) {
          setSpeed(Math.round(pos.coords.speed * 3.6)) // m/s → km/h
        } else if (prevPos.current && prevTime.current) {
          const dt = (Date.now() - prevTime.current) / 1000
          if (dt > 0) {
            const dist = haversineMeters(prevPos.current, now)
            setSpeed(Math.round((dist / dt) * 3.6))
          }
        }
        prevPos.current  = now
        prevTime.current = Date.now()

        setPath((p) => [...p.slice(-200), [now.lat, now.lng]])
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    )
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  const distRemaining = currentPos && destination
    ? haversineMeters(currentPos, destination)
    : null

  const etaMinutes = distRemaining != null && speed != null && speed > 0
    ? Math.round((distRemaining / 1000) / (speed / 60))
    : null

  const handleSetDestination = () => {
    // Parse "lat,lng" from input
    const parts = destInput.split(',').map((s) => parseFloat(s.trim()))
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setDestination({ lat: parts[0], lng: parts[1] })
    }
  }

  const defaultCenter: [number, number] = currentPos
    ? [currentPos.lat, currentPos.lng]
    : [20.5937, 78.9629]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#202124]">Live Navigation</h1>
          <p className="text-sm text-[#5f6368]">Real-time location tracking</p>
        </div>
        <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${currentPos ? 'border-[#ceead6] bg-[#e6f4ea] text-[#34a853]' : 'border-[#e0e0e0] bg-[#f8f9fa] text-[#5f6368]'}`}>
          <Navigation2 size={14} />
          {currentPos ? 'GPS Active' : 'Acquiring GPS…'}
        </div>
      </div>

      {/* Geolocation error */}
      {geoError && (
        <div className="flex items-center gap-3 rounded-xl border border-[#f5c6c2] bg-[#fce8e6] p-4">
          <AlertTriangle size={16} className="text-[#ea4335]" />
          <p className="text-sm text-[#202124]">{geoError}</p>
        </div>
      )}

      {/* Destination input */}
      <GlassCard className="p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#5f6368]">Set Destination</p>
        <div className="flex gap-2">
          <input
            value={destInput}
            onChange={(e) => setDestInput(e.target.value)}
            placeholder="Enter lat, lng  e.g. 13.0827, 80.2707"
            className="flex-1 rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] px-4 py-2.5 text-sm text-[#202124] outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
          />
          <button
            onClick={handleSetDestination}
            className="rounded-xl bg-[#1a73e8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1557b0]"
          >
            Set
          </button>
        </div>
      </GlassCard>

      {/* Map */}
      <div className="overflow-hidden rounded-xl border border-[#e0e0e0] shadow-sm" style={{ height: 480 }}>
        <MapContainer
          center={defaultCenter}
          zoom={15}
          scrollWheelZoom
          dragging
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {currentPos && (
            <>
              <Marker position={[currentPos.lat, currentPos.lng]} icon={blueDotIcon} />
              <CenterOnLocation position={currentPos} />
            </>
          )}

          {destination && (
            <Marker position={[destination.lat, destination.lng]} icon={redIcon} />
          )}

          {path.length > 1 && (
            <Polyline
              positions={path}
              pathOptions={{ color: '#4285f4', weight: 4, opacity: 0.85 }}
            />
          )}

          {currentPos && destination && (
            <Polyline
              positions={[[currentPos.lat, currentPos.lng], [destination.lat, destination.lng]]}
              pathOptions={{ color: '#ea4335', weight: 3, opacity: 0.5, dashArray: '8 8' }}
            />
          )}
        </MapContainer>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Current Speed',
            value: speed != null ? `${speed} km/h` : '—',
            icon: Gauge,
            iconBg: 'bg-[#e8f0fe]',
            iconColor: 'text-[#1a73e8]',
          },
          {
            label: 'Distance Remaining',
            value: distRemaining != null ? formatDist(distRemaining) : '—',
            icon: Route,
            iconBg: 'bg-[#fce8e6]',
            iconColor: 'text-[#ea4335]',
          },
          {
            label: 'ETA',
            value: etaMinutes != null ? `${etaMinutes} min` : '—',
            icon: Timer,
            iconBg: 'bg-[#e6f4ea]',
            iconColor: 'text-[#34a853]',
          },
          {
            label: 'Route Points',
            value: path.length > 0 ? String(path.length) : '—',
            icon: MapPin,
            iconBg: 'bg-[#fef7e0]',
            iconColor: 'text-[#fbbc04]',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <GlassCard key={stat.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#5f6368]">{stat.label}</p>
                  <p className="mt-1 text-xl font-semibold text-[#202124]">{stat.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.iconBg} ${stat.iconColor}`}>
                  <Icon size={17} />
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
