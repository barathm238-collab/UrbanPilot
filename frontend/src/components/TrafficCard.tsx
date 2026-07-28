import { motion } from 'framer-motion'
import { Gauge, Timer, TriangleAlert } from 'lucide-react'
import type { TrafficImpact } from '../services/environmentService'
import { GlassCard } from './ui/GlassCard'

type TrafficCardProps = {
  traffic?: TrafficImpact
  loading?: boolean
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

export function TrafficCard({ traffic, loading = false }: TrafficCardProps) {
  return (
    <GlassCard className="h-full p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#5f6368]">Traffic</p>
          {loading
            ? <Skeleton className="mt-2 h-6 w-24" />
            : <h3 className="mt-1 text-lg font-semibold text-[#202124]">{traffic?.level ?? 'Standby'}</h3>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fef7e0] text-[#fbbc04]">
          <Gauge size={18} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : traffic ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#5f6368]"><Timer size={13} /> Delay</div>
              <p className="mt-1 text-xl font-semibold text-[#202124]">{traffic.delayMinutes} min</p>
            </div>
            <div className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#5f6368]"><Gauge size={13} /> Avg Speed</div>
              <p className="mt-1 text-xl font-semibold text-[#202124]">{traffic.averageSpeed} km/h</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#5f6368]"><TriangleAlert size={13} /> Incidents</div>
            <p className="text-sm font-semibold text-[#202124]">{traffic.roadIncidents?.length ?? 0}</p>
          </div>
        </motion.div>
      ) : (
        <p className="text-sm leading-6 text-[#5f6368]">Live congestion, delay, and incident signals appear after route search.</p>
      )}
    </GlassCard>
  )
}
