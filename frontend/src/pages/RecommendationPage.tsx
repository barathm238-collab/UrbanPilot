import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, BadgeCheck, BatteryCharging, Bike, CloudRain, Clock3, Coins, Footprints, Gauge, Leaf, Loader2, Navigation, Route, Sparkles, Thermometer, TrainFront } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { Timeline } from '../components/ui/Timeline'
import { analyzeEnvironment, type EnvironmentAnalyzeResponse } from '../services/environmentService'
import { journeyTimeline } from '../services/mockData'
import { useRouteStore } from "../store/routeStore";

const metrics = (recommended: any) => [
  {
    label: "Mode",
    value: recommended?.label ?? "-",
    icon: Route,
    tone: "text-cyan-300 bg-cyan-400/10",
  },
  {
    label: "Segments",
    value: `${recommended?.legs?.length ?? 0}`,
    icon: Clock3,
    tone: "text-violet-300 bg-violet-400/10",
  },
  {
    label: "Recommended",
    value: recommended?.recommended ? "Yes" : "No",
    icon: BadgeCheck,
    tone: "text-emerald-300 bg-emerald-400/10",
  },
];

const defaultEnvironmentPayload = {
  origin: {
    lat: 11.0168,
    lng: 76.9558,
  },
  destination: {
    lat: 10.998,
    lng: 76.97,
  },
  departureTime: '2026-07-30T09:00:00',
}

function ImpactStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.045] p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  )
}

function EnvironmentLoading() {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-cyan-300" size={34} />
          <p className="mt-4 text-sm font-semibold text-white">Reading weather and traffic signals</p>
          <div className="mt-4 flex justify-center gap-2">
            {[0, 1, 2].map((item) => (
              <motion.span
                key={item}
                animate={{ opacity: [0.25, 1, 0.25], y: [0, -5, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: item * 0.16 }}
                className="h-2 w-2 rounded-full bg-cyan-300"
              />
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

function EnvironmentError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-400/10 text-rose-300">
            <AlertTriangle size={21} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Environment</p>
            <h2 className="mt-2 text-[24px] font-semibold text-white">Signal unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
          </div>
        </div>
        <button type="button" onClick={onRetry} className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
          Retry
        </button>
      </div>
    </GlassCard>
  )
}

function EnvironmentCards({ analysis }: { analysis: EnvironmentAnalyzeResponse }) {
  return (
    <section className="grid gap-6 lg:grid-cols-12">
      <GlassCard className="p-5 sm:p-6 lg:col-span-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Weather</p>
            <h2 className="mt-2 text-[24px] font-semibold text-white">{analysis.weather.condition}</h2>
          </div>
          <CloudRain className="text-cyan-300" size={24} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <ImpactStat label="Temperature" value={`${analysis.weather.temperature} C`} />
          <ImpactStat label="Humidity" value={`${analysis.weather.humidity}%`} />
          <ImpactStat label="Wind" value={`${analysis.weather.windSpeed} km/h`} />
        </div>
        {analysis.weather.description ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <Thermometer size={15} className="text-cyan-300" />
            {analysis.weather.description}
          </p>
        ) : null}
      </GlassCard>

      <GlassCard className="p-5 sm:p-6 lg:col-span-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Traffic</p>
            <h2 className="mt-2 text-[24px] font-semibold text-white">{analysis.traffic.level}</h2>
          </div>
          <Gauge className="text-amber-300" size={24} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <ImpactStat label="Delay" value={`${analysis.traffic.delayMinutes} min`} />
          <ImpactStat label="Avg Speed" value={`${analysis.traffic.averageSpeed} km/h`} />
          <ImpactStat label="Incidents" value={analysis.traffic.roadIncidents?.length ?? 0} />
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6 lg:col-span-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Travel Impact</p>
            <h2 className="mt-2 text-[24px] font-semibold text-white">Comfort forecast</h2>
          </div>
          <Navigation className="text-emerald-300" size={24} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ImpactStat label="Walking" value={analysis.travelImpact.walkingComfort} />
          <ImpactStat label="Bike" value={analysis.travelImpact.bikeComfort} />
        </div>
        <div className="mt-4 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4">
          <div className="flex items-center gap-3 text-emerald-300">
            {analysis.travelImpact.recommendedTransport.toLowerCase() === 'bike' ? <Bike size={19} /> : <TrainFront size={19} />}
            <p className="text-sm font-semibold">Recommended Transport</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{analysis.travelImpact.recommendedTransport}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{analysis.travelImpact.reason}</p>
        </div>
      </GlassCard>
    </section>
  )
}

export function RecommendationPage() {
<<<<<<< HEAD
  const routeOptionsResult = useRouteStore(
  (state) => state.routeOptionsResult
) as any;

const options = routeOptionsResult?.options ?? [];

const recommended =
  options.find((o: any) => o.recommended) ??
  options[0];
=======
  const [environmentAnalysis, setEnvironmentAnalysis] = useState<EnvironmentAnalyzeResponse | null>(null)
  const [environmentError, setEnvironmentError] = useState<string | null>(null)
  const [environmentLoading, setEnvironmentLoading] = useState(true)

  const loadEnvironmentAnalysis = async () => {
    setEnvironmentLoading(true)
    setEnvironmentError(null)

    try {
      const result = await analyzeEnvironment(defaultEnvironmentPayload)
      setEnvironmentAnalysis(result)
    } catch (error) {
      setEnvironmentAnalysis(null)
      setEnvironmentError(error instanceof Error ? error.message : 'Environmental intelligence is unavailable.')
    } finally {
      setEnvironmentLoading(false)
    }
  }

  useEffect(() => {
    void loadEnvironmentAnalysis()
  }, [])

>>>>>>> 8de0c6751caba22706940708722dd6ad1f6c7be8
  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7">
          <div className="relative h-full overflow-hidden rounded-[40px] border border-white/10 bg-[#0B1120]/70 p-6 shadow-[0_30px_110px_rgba(2,8,23,0.5)] backdrop-blur-2xl sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(6,182,212,0.16),transparent_30%)]" />
            <div className="relative">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
                <BadgeCheck size={16} />
                Recommended Route
              </div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">UrbanPilot selected</p>
              <h1 className="mt-3 text-[42px] font-bold leading-[1.06] text-white sm:text-[56px]">{recommended?.label ?? "No Recommendation"}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                Recommended by the Route Options Agent after comparing all available travel modes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/journey" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_36px_rgba(6,182,212,0.24)]">
                  Book Now <ArrowRight size={17} />
                </Link>
                <Link to="/compare" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-6 py-3 text-sm font-bold text-slate-200">
                  Compare Options
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-5">
          <GlassCard className="h-full p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[22px] font-semibold text-white">Route economics</h2>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">94 score</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {metrics(recommended).map((metric, index) => {
                const Icon = metric.icon
                return (
                  <motion.div key={metric.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className={`${index === 0 ? 'sm:col-span-2' : ''} rounded-[24px] border border-white/10 bg-white/[0.055] p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">{metric.label}</p>
                        <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
                      </div>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.tone}`}>
                        <Icon size={18} />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {environmentLoading ? (
        <EnvironmentLoading />
      ) : environmentError ? (
        <EnvironmentError message={environmentError} onRetry={loadEnvironmentAnalysis} />
      ) : environmentAnalysis ? (
        <EnvironmentCards analysis={environmentAnalysis} />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-12">
        <GlassCard className="p-5 sm:p-6 lg:col-span-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Journey Timeline</p>
              <h2 className="mt-2 text-[28px] font-semibold text-white">Mode handoff plan</h2>
            </div>
            <Route className="text-cyan-300" size={22} />
          </div>
          <Timeline items={journeyTimeline} />
        </GlassCard>

        <GlassCard className="relative overflow-hidden p-5 sm:p-6 lg:col-span-7">
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">AI Explanation</p>
              <h2 className="mt-2 text-[28px] font-semibold text-white">Why UrbanPilot chose this</h2>
            </div>
            <Sparkles className="text-violet-300" size={22} />
          </div>
          <p className="max-w-3xl text-lg leading-8 text-slate-300">
            UrbanPilot selected this journey because the first-mile bike taxi bypasses a congested arterial road, the metro segment is running at four-minute headways, and the final walk is short enough to keep the comfort score above 90 while saving Rs. 182 against cab-only travel.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              ['Traffic avoided', 'CBD cab surge is currently 1.8x.'],
              ['Transfer protected', 'Only one interchange with platform load under threshold.'],
              ['Carbon optimized', 'Estimated emissions drop by 68%.'],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  )
}
