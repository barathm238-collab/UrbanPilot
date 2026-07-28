import { motion } from 'framer-motion'
import { ArrowRight, Bike, BrainCircuit, Car, Footprints, LocateFixed, MapPin, Radio, Route, ShieldCheck, Sparkles, TrainFront } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { JourneyCard } from '../components/ui/JourneyCard'
import { recentTrips, savedPlaces, trafficOverview } from '../services/mockData'
import { useState } from 'react'
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

  return (
    <GlassCard className="gradient-border p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Route Query</p>
          <h3 className="mt-2 text-[22px] font-semibold text-white">Where should the agents optimize?</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <Route size={19} />
        </div>
      </div>

      <div className="space-y-4">
        <label className="block rounded-[22px] border border-white/10 bg-white/[0.055] p-4">
          <span className="flex items-center gap-2 text-sm text-slate-400"><LocateFixed size={15} /> Current Location</span>
          <input
  className="mt-2 w-full border-0 bg-transparent text-base font-semibold text-white outline-none placeholder:text-slate-600"
  value={origin}
  onChange={(e) => setOrigin(e.target.value)}
/>
        </label>
        <label className="block rounded-[22px] border border-white/10 bg-white/[0.055] p-4">
          <span className="flex items-center gap-2 text-sm text-slate-400"><MapPin size={15} /> Destination</span>
          <input
  className="mt-2 w-full border-0 bg-transparent text-base font-semibold text-white outline-none placeholder:text-slate-600"
  value={destination}
  onChange={(e) => setDestination(e.target.value)}
/>
        </label>
        <div>
          <p className="mb-3 text-sm text-slate-400">Travel Preference</p>
          <div className="flex flex-wrap gap-2">
            {preferenceChips.map((value) => (
              <button
                key={value}
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  value === 'Balanced'
                    ? 'border-cyan-400/35 bg-cyan-400/15 text-cyan-200 shadow-[0_0_24px_rgba(6,182,212,0.16)]'
                    : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-violet-400/30 hover:text-white'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <button
  onClick={handleSearch}
  disabled={loading}
  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3B82F6] via-[#06B6D4] to-[#8B5CF6] px-5 py-4 text-sm font-bold text-white shadow-[0_0_38px_rgba(6,182,212,0.28)] transition hover:scale-[1.01]"
>
  {loading ? 'Finding Route...' : 'Find Best Route'}
  <ArrowRight size={17} />
</button>
      </div>
    </GlassCard>
  )
}

function CityIntelligenceVisual() {
  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-[36px] border border-white/10 bg-[#0B1120]/60 shadow-[0_32px_120px_rgba(2,8,23,0.48)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(6,182,212,0.22),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.2),transparent_34%)]" />
      <div className="absolute inset-0 ambient-grid opacity-70" />

      <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute left-1/2 top-[18%] z-10 flex h-36 w-36 -translate-x-1/2 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_90px_rgba(6,182,212,0.28)] backdrop-blur-xl">
        <BrainCircuit size={54} className="text-cyan-200" />
      </motion.div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 560" role="img" aria-label="AI routed city mobility visualization">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="55%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        <path d="M84 440 C 185 332, 246 454, 350 340 S 528 224, 678 292" fill="none" stroke="url(#routeGradient)" strokeWidth="6" strokeLinecap="round" className="route-dash" />
        <path d="M88 444 C 188 336, 250 458, 354 344 S 532 228, 682 296" fill="none" stroke="rgba(6,182,212,0.22)" strokeWidth="22" strokeLinecap="round" />
      </svg>

      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-3 px-8 pb-8">
        {[96, 142, 108, 178, 132, 210, 156, 118, 186].map((height, index) => (
          <div key={index} className="w-[8%] max-w-[54px] rounded-t-2xl border border-white/10 bg-gradient-to-b from-white/18 to-white/[0.035]" style={{ height }} />
        ))}
      </div>

      <motion.div animate={{ x: [0, 230, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-[26%] left-[14%] flex h-11 w-20 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-400/15 text-cyan-200 shadow-[0_0_32px_rgba(6,182,212,0.26)]">
        <TrainFront size={20} />
      </motion.div>
      <motion.div animate={{ x: [0, -120, 0], y: [0, 70, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute right-[18%] top-[48%] flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-400/15 text-emerald-200">
        <Bike size={18} />
      </motion.div>

      {[
        { label: 'ETA', value: '26 min', icon: Radio, className: 'left-6 top-10', tone: 'cyan' },
        { label: 'Fare', value: 'Rs. 142', icon: Car, className: 'right-6 top-20', tone: 'violet' },
        { label: 'Carbon Saved', value: '1.8 kg', icon: ShieldCheck, className: 'left-8 bottom-16', tone: 'emerald' },
        { label: 'Walk', value: '700 m', icon: Footprints, className: 'right-8 bottom-20', tone: 'amber' },
      ].map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div key={stat.label} animate={{ y: [0, -10, 0] }} transition={{ duration: 4 + index, repeat: Infinity }} className={`absolute ${stat.className} rounded-[24px] border border-white/10 bg-[#121826]/75 p-4 shadow-[0_18px_60px_rgba(2,8,23,0.42)] backdrop-blur-2xl`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${statToneClasses[stat.tone as keyof typeof statToneClasses]}`}>
                <Icon size={17} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-base font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export function HomePage() {
  return (
    <div className="space-y-14">
      <section className="grid min-h-[calc(100vh-9rem)] items-center gap-8 lg:grid-cols-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-5">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-300">
            <Sparkles size={16} />
            Autonomous city routing is live
          </div>
          <h1 className="text-[42px] font-bold leading-[1.04] text-white sm:text-[56px] lg:text-[64px]">
            AI That Thinks Before You Travel
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
            UrbanPilot orchestrates Metro, Cab, Bike Taxi and Walking through collaborating AI agents that reason over cost, ETA, comfort, carbon and live city context.
          </p>
          <div className="mt-8">
            <SearchCard />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 }} className="lg:col-span-7">
          <CityIntelligenceVisual />
        </motion.div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Memory Layer</p>
              <h2 className="mt-2 text-[34px] font-semibold text-white sm:text-[40px]">Recent intelligent journeys</h2>
            </div>
            <Link to="/history" className="hidden text-sm font-semibold text-cyan-300 sm:block">View history</Link>
          </div>
          <div className="space-y-3">
            {recentTrips.map((trip) => (
              <JourneyCard key={trip.id} title={trip.title} subtitle={trip.mode} savings={trip.savings} eta={trip.time} />
            ))}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-5">
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[22px] font-semibold text-white">Pinned locations</h3>
              <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-sm text-slate-400">3 active</span>
            </div>
            <div className="space-y-3">
              {savedPlaces.map((place) => (
                <div key={place.id} className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-cyan-400/10 p-2 text-cyan-300"><MapPin size={16} /></div>
                    <div>
                      <p className="text-sm font-semibold text-white">{place.label}</p>
                      <p className="text-sm text-slate-400">{place.detail}</p>
                    </div>
                  </div>
                  <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 sm:block">{place.signal}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[22px] font-semibold text-white">Traffic intelligence</h3>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-300">Live</span>
            </div>
            <div className="space-y-4">
              {trafficOverview.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-semibold text-white">{item.value}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/8">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 0.9 }} className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  )
}
