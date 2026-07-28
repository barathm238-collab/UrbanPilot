import { motion } from 'framer-motion'
import { CloudRain, Droplets, Thermometer, Wind } from 'lucide-react'
import type { WeatherImpact } from '../services/environmentService'
import { GlassCard } from './ui/GlassCard'

type WeatherCardProps = {
  weather?: WeatherImpact
  loading?: boolean
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

export function WeatherCard({ weather, loading = false }: WeatherCardProps) {
  return (
    <GlassCard className="h-full p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#5f6368]">Weather</p>
          {loading
            ? <Skeleton className="mt-2 h-6 w-28" />
            : <h3 className="mt-1 text-lg font-semibold text-[#202124]">{weather?.condition ?? 'Ready'}</h3>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]">
          <CloudRain size={18} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : weather ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#5f6368]"><Thermometer size={13} /> Temperature</div>
              <p className="mt-1 text-xl font-semibold text-[#202124]">{weather.temperature}°C</p>
            </div>
            <div className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#5f6368]"><Droplets size={13} /> Humidity</div>
              <p className="mt-1 text-xl font-semibold text-[#202124]">{weather.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#5f6368]"><Wind size={13} /> Wind</div>
            <p className="text-sm font-semibold text-[#202124]">{weather.windSpeed} km/h</p>
          </div>
          <p className="text-sm leading-6 text-[#5f6368]">{weather.description ?? weather.condition}</p>
        </motion.div>
      ) : (
        <p className="text-sm leading-6 text-[#5f6368]">Plan a route to load live weather near your starting point.</p>
      )}
    </GlassCard>
  )
}
