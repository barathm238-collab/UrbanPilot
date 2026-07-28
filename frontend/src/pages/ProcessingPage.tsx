import { motion } from 'framer-motion'
import { Activity, BrainCircuit, Cpu, DatabaseZap, GitBranch, Network, Radar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { agentSteps } from '../services/mockData'
import { useRouteStore } from '../store/routeStore'

const agentIcons = [Radar, DatabaseZap, Network, GitBranch]

const toneClasses = {
  cyan:    'border-[#d2e3fc] bg-[#e8f0fe] text-[#1a73e8]',
  violet:  'border-[#e8d5fb] bg-[#f3e8fd] text-[#7c3aed]',
  emerald: 'border-[#ceead6] bg-[#e6f4ea] text-[#34a853]',
  amber:   'border-[#fde9b0] bg-[#fef7e0] text-[#fbbc04]',
}

function AgentCard({ agent, index }: { agent: (typeof agentSteps)[number]; index: number }) {
  const Icon = agentIcons[index] ?? Cpu
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border border-[#e0e0e0] bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${toneClasses[agent.tone as keyof typeof toneClasses]}`}>
            <Icon size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#202124]">{agent.name}</p>
            <p className="mt-0.5 text-xs leading-5 text-[#5f6368]">{agent.detail}</p>
          </div>
        </div>
        <span className="rounded-full border border-[#e0e0e0] bg-[#f8f9fa] px-2.5 py-1 text-xs font-medium text-[#5f6368]">
          {agent.status}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-[#5f6368]">
          <span>Confidence</span>
          <span>{agent.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#e0e0e0]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.progress}%` }}
            transition={{ duration: 0.9, delay: index * 0.12 }}
            className="h-1.5 rounded-full bg-[#1a73e8]"
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {agent.logs.map((log) => (
          <div key={log} className="flex items-center gap-2 rounded-lg border border-[#e0e0e0] bg-[#f8f9fa] px-3 py-2 text-xs text-[#5f6368]">
            <Activity size={12} className="text-[#1a73e8]" />
            {log}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function ProcessingPage() {
  const geographicResult = useRouteStore((state) => state.geographicResult)

<<<<<<< HEAD
  const geographicResult = useRouteStore(
  (state) => state.geographicResult
)

const routeOptionsResult = useRouteStore(
  (state) => state.routeOptionsResult
)
  const result = geographicResult as {
  origin_text?: string
  destination_text?: string
}

  console.log("Geographic Result:", geographicResult)
  console.log("Route Options Result:", routeOptionsResult)
=======
  // Safe cast — geographicResult is `unknown`, guard every access
  const result = (geographicResult ?? {}) as {
    origin_text?: string
    destination_text?: string
  }

  const originText      = result?.origin_text      ?? null
  const destinationText = result?.destination_text ?? null
  const hasRoute        = Boolean(originText && destinationText)
>>>>>>> 8de0c6751caba22706940708722dd6ad1f6c7be8

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-12 lg:items-start">

        {/* Left — description */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-4"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d2e3fc] bg-[#e8f0fe] px-3 py-1.5 text-sm font-medium text-[#1a73e8]">
            <BrainCircuit size={15} />
            Multi-Agent AI Swarm
          </div>

          <h1 className="text-2xl font-semibold text-[#202124] sm:text-3xl">
            Four agents are negotiating your route.
          </h1>

          <div className="mt-4 text-sm leading-7 text-[#5f6368]">
            {hasRoute ? (
              <p>
                Route detected from{' '}
                <span className="font-semibold text-[#1a73e8]">{originText}</span>
                {' '}to{' '}
                <span className="font-semibold text-[#1a73e8]">{destinationText}</span>.
              </p>
            ) : (
              <p className="rounded-xl border border-[#fde9b0] bg-[#fef7e0] px-4 py-3 text-[#5f6368]">
                No route data available yet. Go to the Home page and search for a route first.
              </p>
            )}
            <p className="mt-3">
              Geographic Agent has successfully analyzed your request and shared the route details
              with the Transit, Mobility and Synthesis agents for further optimization.
            </p>
          </div>

          <Link
            to="/recommendation"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1557b0]"
          >
            View Recommendation
          </Link>
        </motion.div>

        {/* Right — agent cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          {agentSteps.map((agent, index) => (
            <AgentCard key={agent.name} agent={agent} index={index} />
          ))}
        </div>
      </section>

      {/* Summary strip */}
      <GlassCard className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {['Input signals normalized', 'Agents reached consensus', 'Recommendation explainable'].map((label, index) => (
            <div key={label} className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-4">
              <p className="text-2xl font-bold text-[#1a73e8]">0{index + 1}</p>
              <p className="mt-2 text-sm font-medium text-[#202124]">{label}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
