import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Clock3, LocateFixed, MapPin, SlidersHorizontal } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { LocationSearch } from './LocationSearch'
import type { OsrmRoute, SearchResult } from './types'

export type TravelPreference = 'Fastest' | 'Cheapest' | 'Balanced'

const PREFERENCES: TravelPreference[] = ['Fastest', 'Cheapest', 'Balanced']
const OSRM = 'https://router.project-osrm.org/route/v1/driving'

function toDatetimeLocal(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

async function fetchOsrmRoute(origin: SearchResult, destination: SearchResult): Promise<OsrmRoute> {
  let res: Response
  try {
    res = await fetch(
      `${OSRM}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`,
    )
  } catch {
    throw new Error('OSRM is unreachable — check your internet connection.')
  }
  if (!res.ok) throw new Error(`OSRM returned HTTP ${res.status}. Try again shortly.`)
  const data = await res.json() as {
    code: string
    routes: Array<{
      distance: number
      duration: number
      geometry: { coordinates: [number, number][] }
    }>
  }
  if (data.code !== 'Ok' || !data.routes[0]) {
    throw new Error('No drivable route found between these two locations.')
  }
  const r = data.routes[0]
  return {
    distanceMeters: r.distance,
    durationSeconds: r.duration,
    geometry: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  }
}

type Phase = 'idle' | 'routing' | 'analyzing'

type RoutePlannerProps = {
  analyzing: boolean
  onRouteReady: (
    origin: SearchResult,
    destination: SearchResult,
    route: OsrmRoute,
    preference: TravelPreference,
    departureTime: string,
  ) => void | Promise<void>
  onError: (msg: string) => void
}

const phaseLabel: Record<Phase, string> = {
  idle: 'Find Best Route',
  routing: 'Drawing Route…',
  analyzing: 'Analyzing with AI…',
}

export function RoutePlanner({ analyzing, onRouteReady, onError }: RoutePlannerProps) {
  const [origin, setOrigin] = useState<SearchResult | null>(null)
  const [destination, setDestination] = useState<SearchResult | null>(null)
  const [preference, setPreference] = useState<TravelPreference>('Balanced')
  const [departureTime, setDepartureTime] = useState(toDatetimeLocal(new Date()))
  const [phase, setPhase] = useState<Phase>('idle')

  const currentPhase: Phase = analyzing ? 'analyzing' : phase
  const busy = currentPhase !== 'idle'

  const handleFindRoute = async () => {
    if (!origin || !destination) {
      onError('Select both a starting point and a destination from the suggestions.')
      return
    }
    setPhase('routing')
    try {
      const route = await fetchOsrmRoute(origin, destination)
      setPhase('analyzing')
      await onRouteReady(origin, destination, route, preference, departureTime)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Routing failed. Please try again.')
    } finally {
      setPhase('idle')
    }
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1a73e8]">Trip Planner</p>
          <h2 className="mt-1 text-xl font-semibold text-[#202124]">Plan a live route</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fce8e6] text-[#ea4335]">
          <MapPin size={18} />
        </div>
      </div>

      <div className="space-y-3">
        <LocationSearch
          label="Current Location"
          placeholder="Search your starting point"
          icon={<LocateFixed size={14} />}
          value={origin}
          onSelect={setOrigin}
          onClear={() => setOrigin(null)}
        />

        <LocationSearch
          label="Destination"
          placeholder="Search destination"
          icon={<MapPin size={14} />}
          value={destination}
          onSelect={setDestination}
          onClear={() => setDestination(null)}
        />

        <div className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-[#5f6368]">
            <SlidersHorizontal size={14} /> Travel Preference
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PREFERENCES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPreference(item)}
                disabled={busy}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition disabled:pointer-events-none ${
                  preference === item
                    ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]'
                    : 'border-[#e0e0e0] bg-white text-[#5f6368] hover:border-[#1a73e8] hover:text-[#1a73e8]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <label className="block rounded-xl border border-[#e0e0e0] bg-white p-4 transition hover:border-[#1a73e8]">
          <span className="flex items-center gap-2 text-sm font-medium text-[#5f6368]">
            <Clock3 size={14} /> Departure Time
          </span>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            disabled={busy}
            className="mt-2 w-full border-0 bg-transparent text-sm font-semibold text-[#202124] outline-none disabled:opacity-50"
          />
        </label>

        <motion.button
          whileHover={busy ? {} : { scale: 1.01 }}
          whileTap={busy ? {} : { scale: 0.99 }}
          type="button"
          onClick={handleFindRoute}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1557b0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && (
            <span className="mr-1 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          <AnimatePresence mode="wait">
            <motion.span
              key={currentPhase}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              {phaseLabel[currentPhase]}
            </motion.span>
          </AnimatePresence>
          {!busy && <ArrowRight size={16} />}
        </motion.button>
      </div>
    </GlassCard>
  )
}
