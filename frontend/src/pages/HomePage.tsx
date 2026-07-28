import { useState } from 'react'
<<<<<<< HEAD
import { runGeographicAgent, runRouteOptionsAgent } from '../services/api'
import { useRouteStore } from '../store/routeStore'

const preferenceChips = ['Cheapest', 'Fastest', 'Balanced', 'Luxury', 'Eco']

const statToneClasses = {
  cyan: 'bg-cyan-400/10 text-cyan-300',
  violet: 'bg-violet-400/10 text-violet-300',
  emerald: 'bg-emerald-400/10 text-emerald-300',
  amber: 'bg-amber-400/10 text-amber-300',
}

function SearchCard() {

  const navigate = useNavigate()

  const {
  setQuery,
  setGeographicResult,
  setRouteOptionsResult,
} = useRouteStore()

  const [origin, setOrigin] = useState('North Loop, Sector 12')

  const [destination, setDestination] = useState('Skyline Tower, Business District')

  const [loading, setLoading] = useState(false)

  async function handleSearch() {
  try {
    setLoading(true)

    const message = `I need to go from ${origin} to ${destination}`

    setQuery(message)

    // Agent 1
    const geoResponse = await runGeographicAgent(message)

    console.log("Geographic:", geoResponse)

    setGeographicResult(geoResponse.result)

    // Agent 2
    const routeResponse = await runRouteOptionsAgent(
      geoResponse.result
    )

    console.log("Route Options:", routeResponse)

    setRouteOptionsResult(routeResponse.result)

    navigate("/processing")

  } catch (err) {

    console.error(err)

    alert("Backend request failed")

  } finally {

    setLoading(false)

  }
}
=======
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle2, MapPinned } from 'lucide-react'
import { MapView } from '../components/map/MapView'
import { RoutePlanner, type TravelPreference } from '../components/map/RoutePlanner'
import { TravelSummary } from '../components/map/TravelSummary'
import type { OsrmRoute, SearchResult } from '../components/map/types'
import { RecommendationCard } from '../components/RecommendationCard'
import { TrafficCard } from '../components/TrafficCard'
import { GlassCard } from '../components/ui/GlassCard'
import { WeatherCard } from '../components/WeatherCard'
import { analyzeEnvironment, type EnvironmentAnalyzeResponse } from '../services/environmentService'
>>>>>>> 8de0c6751caba22706940708722dd6ad1f6c7be8

function StatusBanner({ type, message }: { type: 'error' | 'success'; message: string }) {
  const isError = type === 'error'
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
      <div className={`flex gap-3 rounded-xl border p-4 ${isError ? 'border-[#f5c6c2] bg-[#fce8e6]' : 'border-[#ceead6] bg-[#e6f4ea]'}`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isError ? 'bg-[#ea4335]/10 text-[#ea4335]' : 'bg-[#34a853]/10 text-[#34a853]'}`}>
          {isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#202124]">
            {isError ? 'Route unavailable' : 'Analysis complete'}
          </p>
          <p className="mt-0.5 text-sm text-[#5f6368]">{message}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function HomePage() {
  const [origin, setOrigin] = useState<SearchResult | null>(null)
  const [destination, setDestination] = useState<SearchResult | null>(null)
  const [route, setRoute] = useState<OsrmRoute | null>(null)
  const [environment, setEnvironment] = useState<EnvironmentAnalyzeResponse | null>(null)
  const [activePreference, setActivePreference] = useState<TravelPreference>('Balanced')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleRouteReady = async (
    org: SearchResult,
    dest: SearchResult,
    osrmRoute: OsrmRoute,
    preference: TravelPreference,
    departureTime: string,
  ) => {
    setOrigin(org)
    setDestination(dest)
    setRoute(osrmRoute)
    setActivePreference(preference)
    setEnvironment(null)
    setError(null)
    setSuccessMsg(null)
    setAnalyzing(true)

    try {
      const result = await analyzeEnvironment({
        origin: { lat: org.lat, lng: org.lon },
        destination: { lat: dest.lat, lng: dest.lon },
        departureTime: new Date(departureTime).toISOString(),
      })
      setEnvironment(result)
      setSuccessMsg(`Route analyzed — ${result.recommendation.recommendedTransport} recommended.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Environmental analysis failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Main planner + map ── */}
      <section className="grid gap-5 lg:grid-cols-12 lg:items-start">

        {/* Left panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 lg:col-span-5"
        >
          <div>
            <h1 className="text-2xl font-semibold text-[#202124] sm:text-3xl">
              Plan the route the city is giving you now.
            </h1>
          </div>

          <RoutePlanner
            analyzing={analyzing}
            onRouteReady={handleRouteReady}
            onError={(msg) => { setError(msg); setSuccessMsg(null) }}
          />

          {/* Active preference chip */}
          <GlassCard className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fce8e6] text-[#ea4335]">
                <MapPinned size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#202124]">Preference: {activePreference}</p>
                <p className="text-xs text-[#5f6368]">OpenStreetMap · Nominatim · OSRM · UrbanPilot AI</p>
              </div>
            </div>
          </GlassCard>

          <AnimatePresence mode="wait">
            {error && <StatusBanner key="error" type="error" message={error} />}
            {!error && successMsg && <StatusBanner key="success" type="success" message={successMsg} />}
          </AnimatePresence>
        </motion.div>

        {/* Right panel — map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="space-y-4 lg:col-span-7"
        >
          <div className="overflow-hidden rounded-xl border border-[#e0e0e0] shadow-sm">
            <MapView
              origin={origin}
              destination={destination}
              route={route}
              loading={analyzing}
            />
          </div>

          <TravelSummary route={route} environment={environment} loading={analyzing} />
        </motion.div>
      </section>

      {/* ── Intelligence cards (appear after route is analyzed) ── */}
      <AnimatePresence>
        {(analyzing || environment) && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <WeatherCard weather={environment?.weather} loading={analyzing} />
            <TrafficCard traffic={environment?.traffic} loading={analyzing} />
            <RecommendationCard recommendation={environment?.recommendation} loading={analyzing} />
          </motion.section>
        )}
      </AnimatePresence>


    </div>
  )
}
