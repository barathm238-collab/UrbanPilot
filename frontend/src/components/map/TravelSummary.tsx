import { motion } from 'framer-motion'
import { Bike, Clock3, Footprints, Gauge, MapPin, Route, Sparkles, Thermometer, Timer, TriangleAlert } from 'lucide-react'
import type { EnvironmentAnalyzeResponse } from '../../services/environmentService'
import { GlassCard } from '../ui/GlassCard'
import type { OsrmRoute } from './types'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

function StatTile({ label, value, icon: Icon, iconBg, iconColor, loading }: {
  label: string
  value?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  loading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#e0e0e0] bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#5f6368]">{label}</p>
          {loading
            ? <Skeleton className="mt-2 h-6 w-20" />
            : <p className="mt-1 text-xl font-semibold text-[#202124]">{value ?? '—'}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
          <Icon size={17} />
        </div>
      </div>
    </motion.div>
  )
}

type TravelSummaryProps = {
  route: OsrmRoute | null
  environment: EnvironmentAnalyzeResponse | null
  loading: boolean
}

function formatDuration(seconds: number) {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

export function TravelSummary({ route, environment, loading }: TravelSummaryProps) {
  const stats = [
    { label: 'ETA',         value: route ? formatDuration(route.durationSeconds) : undefined,              icon: Clock3,       iconBg: 'bg-[#e8f0fe]', iconColor: 'text-[#1a73e8]' },
    { label: 'Distance',    value: route ? formatDistance(route.distanceMeters) : undefined,               icon: Route,        iconBg: 'bg-[#e8f0fe]', iconColor: 'text-[#4285f4]' },
    { label: 'Temperature', value: environment ? `${environment.weather.temperature}°C` : undefined,       icon: Thermometer,  iconBg: 'bg-[#e6f4ea]', iconColor: 'text-[#34a853]' },
    { label: 'Delay',       value: environment ? `${environment.traffic.delayMinutes} min` : undefined,    icon: Timer,        iconBg: 'bg-[#fef7e0]', iconColor: 'text-[#fbbc04]' },
    { label: 'Avg Speed',   value: environment ? `${environment.traffic.averageSpeed} km/h` : undefined,   icon: Gauge,        iconBg: 'bg-[#fef7e0]', iconColor: 'text-[#fbbc04]' },
    { label: 'Incidents',   value: environment ? String(environment.traffic.roadIncidents?.length ?? 0) : undefined, icon: TriangleAlert, iconBg: 'bg-[#fce8e6]', iconColor: 'text-[#ea4335]' },
  ]

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#5f6368]">Live Route Summary</p>
            <h2 className="mt-1 text-lg font-semibold text-[#202124]">Best route intelligence</h2>
          </div>
          <MapPin className="text-[#ea4335]" size={20} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => (
            <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} iconBg={s.iconBg} iconColor={s.iconColor} loading={loading} />
          ))}
        </div>
      </GlassCard>

      {(loading || environment) && (
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5f6368]">Recommendation</p>
              {loading
                ? <Skeleton className="mt-2 h-6 w-36" />
                : <h2 className="mt-1 text-lg font-semibold text-[#202124]">{environment?.recommendation.recommendedTransport}</h2>}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f4ea] text-[#34a853]">
              <Sparkles size={18} />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : environment ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#5f6368]"><Footprints size={13} /> Walking Comfort</div>
                  <p className="mt-1 text-base font-semibold text-[#202124]">{environment.recommendation.walkingComfort}</p>
                </div>
                <div className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#5f6368]"><Bike size={13} /> Bike Comfort</div>
                  <p className="mt-1 text-base font-semibold text-[#202124]">{environment.recommendation.bikeComfort}</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-[#5f6368]">{environment.recommendation.reason}</p>
            </motion.div>
          ) : null}
        </GlassCard>
      )}
    </div>
  )
}
