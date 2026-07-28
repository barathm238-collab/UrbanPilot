import { motion } from 'framer-motion'
import { Bike, Footprints, Sparkles, TrainFront } from 'lucide-react'
import type { TravelImpact } from '../services/environmentService'
import { GlassCard } from './ui/GlassCard'

type RecommendationCardProps = {
  recommendation?: TravelImpact
  loading?: boolean
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

export function RecommendationCard({ recommendation, loading = false }: RecommendationCardProps) {
  const transport = recommendation?.recommendedTransport ?? 'Awaiting Route'
  const TransportIcon = transport.toLowerCase().includes('bike') ? Bike : TrainFront

  return (
    <GlassCard className="h-full p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#5f6368]">Recommendation</p>
          {loading
            ? <Skeleton className="mt-2 h-6 w-36" />
            : <h3 className="mt-1 text-lg font-semibold text-[#202124]">{transport}</h3>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f4ea] text-[#34a853]">
          <Sparkles size={18} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : recommendation ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-[#ceead6] bg-[#e6f4ea] p-3">
            <TransportIcon size={18} className="text-[#34a853]" />
            <p className="text-base font-semibold text-[#202124]">{recommendation.recommendedTransport}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#5f6368]"><Footprints size={13} /> Walking</div>
              <p className="mt-1 text-sm font-semibold text-[#202124]">{recommendation.walkingComfort}</p>
            </div>
            <div className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#5f6368]"><Bike size={13} /> Bike</div>
              <p className="mt-1 text-sm font-semibold text-[#202124]">{recommendation.bikeComfort}</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-[#5f6368]">{recommendation.reason}</p>
        </motion.div>
      ) : (
        <p className="text-sm leading-6 text-[#5f6368]">UrbanPilot will recommend a mode after checking live route, weather, and traffic.</p>
      )}
    </GlassCard>
  )
}
