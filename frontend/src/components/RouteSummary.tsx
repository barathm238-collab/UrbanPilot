import { motion } from 'framer-motion'
import { Clock3, MapPinned, Route, Umbrella } from 'lucide-react'
import type { EnvironmentAnalyzeResponse } from '../services/environmentService'
import { GlassCard } from './ui/GlassCard'

export type RouteDirectionsSummary = {
  distanceText: string
  durationText: string
  polyline: string
}

type RouteSummaryProps = {
  summary?: RouteDirectionsSummary
  environment?: EnvironmentAnalyzeResponse
  loading?: boolean
}

function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />
}

export function RouteSummary({ summary, environment, loading = false }: RouteSummaryProps) {
  const stats = [
    { label: 'ETA', value: summary?.durationText, icon: Clock3, tone: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20' },
    { label: 'Distance', value: summary?.distanceText, icon: Route, tone: 'text-violet-300 bg-violet-400/10 border-violet-400/20' },
    { label: 'Temperature', value: environment ? `${environment.weather.temperature} C` : undefined, icon: Umbrella, tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' },
    { label: 'Rain', value: environment ? (environment.weather.rain ? 'Yes' : 'No') : undefined, icon: Umbrella, tone: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20' },
    { label: 'Delay', value: environment ? `${environment.traffic.delayMinutes} min` : undefined, icon: Clock3, tone: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
    { label: 'Recommendation', value: environment?.recommendation.recommendedTransport, icon: MapPinned, tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' },
  ]

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Live Route Summary</p>
          <h2 className="mt-2 text-[28px] font-semibold text-white">Best route intelligence</h2>
        </div>
        <MapPinned className="text-cyan-300" size={23} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  {loading ? <SkeletonLine className="mt-3 h-7 w-24" /> : <p className="mt-2 text-2xl font-bold text-white">{stat.value ?? '--'}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${stat.tone}`}>
                  <Icon size={18} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}
