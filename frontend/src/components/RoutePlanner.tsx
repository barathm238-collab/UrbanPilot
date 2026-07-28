import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Clock3, LocateFixed, MapPin, Route, SlidersHorizontal } from 'lucide-react'
import type { Coordinate } from '../services/environmentService'
import { GlassCard } from './ui/GlassCard'
import type { RouteDirectionsSummary } from './RouteSummary'

export type TravelPreference = 'Fastest' | 'Cheapest' | 'Balanced'

export type PlannedRoute = {
  origin: Coordinate
  destination: Coordinate
  summary: RouteDirectionsSummary
  path: Coordinate[]
}

type RoutePlannerProps = {
  mapsLoaded: boolean
  disabled?: boolean
  loading?: boolean
  onRouteReady: (route: PlannedRoute, preference: TravelPreference, departureTime: string) => void | Promise<void>
  onError: (message: string) => void
}

const preferences: TravelPreference[] = ['Fastest', 'Cheapest', 'Balanced']

function toDatetimeLocalValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 16)
}

export function RoutePlanner({ mapsLoaded, disabled = false, loading = false, onRouteReady, onError }: RoutePlannerProps) {
  const originContainerRef = useRef<HTMLDivElement>(null)
  const destinationContainerRef = useRef<HTMLDivElement>(null)
  const originPlaceRef = useRef<google.maps.places.Place | null>(null)
  const destinationPlaceRef = useRef<google.maps.places.Place | null>(null)
  const [preference, setPreference] = useState<TravelPreference>('Balanced')
  const [departureTime, setDepartureTime] = useState(toDatetimeLocalValue(new Date()))
  const [calculatingDirections, setCalculatingDirections] = useState(false)

  useEffect(() => {
    if (!mapsLoaded) return

    function mountAutocomplete(
      container: HTMLDivElement,
      placeRef: React.MutableRefObject<google.maps.places.Place | null>,
      placeholder: string,
    ) {
      const el = new (window as any).google.maps.places.PlaceAutocompleteElement({
        componentRestrictions: { country: 'in' },
      }) as HTMLElement
      el.setAttribute('placeholder', placeholder)
      el.className = 'mt-2 w-full border-0 bg-transparent text-base font-semibold text-white outline-none [color-scheme:dark] gmp-autocomplete'
      el.addEventListener('gmp-placeselect', (e: Event) => {
        const place: google.maps.places.Place = (e as CustomEvent).detail.place
        placeRef.current = place
      })
      container.innerHTML = ''
      container.appendChild(el)
      return () => { container.innerHTML = '' }
    }

    const cleanupOrigin = originContainerRef.current
      ? mountAutocomplete(originContainerRef.current, originPlaceRef, 'Search your starting point')
      : undefined
    const cleanupDest = destinationContainerRef.current
      ? mountAutocomplete(destinationContainerRef.current, destinationPlaceRef, 'Search destination')
      : undefined

    return () => { cleanupOrigin?.(); cleanupDest?.() }
  }, [mapsLoaded])

  const handleFindRoute = async () => {
    if (!mapsLoaded || disabled) {
      onError('Google Maps is not ready yet.')
      return
    }

    const originPlace = originPlaceRef.current
    const destinationPlace = destinationPlaceRef.current
    const origin = originPlace?.location ? { lat: originPlace.location.lat(), lng: originPlace.location.lng() } : null
    const destination = destinationPlace?.location ? { lat: destinationPlace.location.lat(), lng: destinationPlace.location.lng() } : null

    if (!origin || !destination) {
      onError('Choose both current location and destination from Google Places suggestions.')
      return
    }

    setCalculatingDirections(true)

    try {
      const directionsService = new google.maps.DirectionsService()
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: preference !== 'Fastest',
        drivingOptions: {
          departureTime: new Date(departureTime),
          trafficModel: preference === 'Balanced' ? google.maps.TrafficModel.BEST_GUESS : google.maps.TrafficModel.OPTIMISTIC,
        },
      })
      const route = result.routes[0]
      const leg = route?.legs[0]

      if (!route || !leg) {
        onError('Google Directions did not return a usable route.')
        return
      }

      await onRouteReady(
        {
          origin,
          destination,
          summary: {
            distanceText: leg.distance?.text ?? 'Unknown',
            durationText: leg.duration_in_traffic?.text ?? leg.duration?.text ?? 'Unknown',
            polyline: route.overview_polyline,
          },
          path: route.overview_path.map((point) => ({
            lat: point.lat(),
            lng: point.lng(),
          })),
        },
        preference,
        departureTime,
      )
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Google Directions failed to calculate this route.')
    } finally {
      setCalculatingDirections(false)
    }
  }

  const busy = loading || calculatingDirections

  return (
    <GlassCard className="gradient-border p-5 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Trip Planner</p>
          <h2 className="mt-2 text-[28px] font-semibold text-white">Plan a live route</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <Route size={20} />
        </div>
      </div>

      <div className="space-y-4">
        <label className="block rounded-[24px] border border-white/10 bg-white/[0.055] p-4 transition hover:border-cyan-400/30 hover:bg-white/[0.075]">
          <span className="flex items-center gap-2 text-sm text-slate-400"><LocateFixed size={15} /> Current Location</span>
          {mapsLoaded
            ? <div ref={originContainerRef} className="mt-2" />
            : <input disabled placeholder="Loading Google Places..." className="mt-2 w-full border-0 bg-transparent text-base font-semibold text-slate-500 outline-none" />}
        </label>

        <label className="block rounded-[24px] border border-white/10 bg-white/[0.055] p-4 transition hover:border-violet-400/30 hover:bg-white/[0.075]">
          <span className="flex items-center gap-2 text-sm text-slate-400"><MapPin size={15} /> Destination</span>
          {mapsLoaded
            ? <div ref={destinationContainerRef} className="mt-2" />
            : <input disabled placeholder="Loading Google Places..." className="mt-2 w-full border-0 bg-transparent text-base font-semibold text-slate-500 outline-none" />}
        </label>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
          <p className="mb-3 flex items-center gap-2 text-sm text-slate-400"><SlidersHorizontal size={15} /> Travel Preference</p>
          <div className="grid grid-cols-3 gap-2">
            {preferences.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPreference(item)}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  preference === item
                    ? 'border-cyan-400/35 bg-cyan-400/15 text-cyan-200 shadow-[0_0_24px_rgba(6,182,212,0.16)]'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-400/30 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <label className="block rounded-[24px] border border-white/10 bg-white/[0.055] p-4 transition hover:border-emerald-400/30 hover:bg-white/[0.075]">
          <span className="flex items-center gap-2 text-sm text-slate-400"><Clock3 size={15} /> Departure Time</span>
          <input type="datetime-local" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} className="mt-2 w-full border-0 bg-transparent text-base font-semibold text-white outline-none [color-scheme:dark]" />
        </label>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="button"
          onClick={handleFindRoute}
          disabled={disabled || busy || !mapsLoaded}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3B82F6] via-[#06B6D4] to-[#8B5CF6] px-5 py-4 text-sm font-bold text-white shadow-[0_0_38px_rgba(6,182,212,0.28)] transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Finding Best Route...' : 'Find Best Route'} <ArrowRight size={17} />
        </motion.button>
      </div>
    </GlassCard>
  )
}
