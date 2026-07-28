import { motion } from 'framer-motion'
import { Activity, BrainCircuit, Cpu, DatabaseZap, GitBranch, Network, Radar, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'
import { agentSteps } from '../services/mockData'
import { useRouteStore } from '../store/routeStore'

const toneClasses = {
  cyan: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-300',
  violet: 'border-violet-400/25 bg-violet-400/10 text-violet-300',
  emerald: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  amber: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
}

const agentIcons = [Radar, DatabaseZap, Network, GitBranch]

function AgentCard({ agent, index }: { agent: (typeof agentSteps)[number]; index: number }) {
  const Icon = agentIcons[index] ?? Cpu
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 }}
      className="rounded-[28px] border border-white/10 bg-[#121826]/75 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.44)] backdrop-blur-2xl [animation:float-card_6s_ease-in-out_infinite]"
      style={{ animationDelay: `${index * 0.45}s` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${toneClasses[agent.tone as keyof typeof toneClasses]}`}>
            <Icon size={18} />
          </div>
          <div>
            <p className="text-[17px] font-semibold text-white">{agent.name}</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">{agent.detail}</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{agent.status}</span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
          <span>Confidence</span>
          <span>{agent.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <motion.div initial={{ width: 0 }} animate={{ width: `${agent.progress}%` }} transition={{ duration: 1, delay: index * 0.16 }} className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400" />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {agent.logs.map((log) => (
          <div key={log} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
            <Activity size={14} className="text-cyan-300" />
            {log}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function ProcessingPage() {

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

  return (
  <div className="space-y-8">
    <section className="grid min-h-[calc(100vh-9rem)] gap-8 lg:grid-cols-12 lg:items-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-4"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-300">
          <Sparkles size={16} />
          Multi-Agent AI Swarm
        </div>

        <h1 className="text-[40px] font-bold leading-[1.08] text-white sm:text-[56px]">
          Four agents are negotiating your route.
        </h1>

        <p className="mt-5 text-lg leading-8 text-slate-400">
          Route detected from{" "}
          <span className="font-semibold text-cyan-300">
            {result.origin_text}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-cyan-300">
            {result.destination_text}
          </span>
          .
          <br />
          <br />
          Geographic Agent has successfully analyzed your request and shared the
          route details with the Transit, Mobility and Synthesis agents for
          further optimization.
        </p>

        <Link
          to="/recommendation"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_36px_rgba(6,182,212,0.24)]"
        >
          View Recommendation
        </Link>
      </motion.div>

        <div className="relative min-h-[690px] lg:col-span-8">
          <div className="absolute inset-0 rounded-[44px] border border-white/10 bg-[#0B1120]/55 shadow-[0_32px_120px_rgba(2,8,23,0.48)] backdrop-blur-2xl" />
          <div className="absolute inset-0 overflow-hidden rounded-[44px]">
            <div className="ambient-grid absolute inset-0 opacity-70" />
            <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/55 to-transparent" />
            <div className="absolute inset-y-10 left-1/2 w-px bg-gradient-to-b from-transparent via-violet-400/55 to-transparent" />
            <div className="absolute left-[10%] top-[18%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_24px_8px_rgba(6,182,212,0.28)]" />
            <div className="absolute right-[13%] top-[30%] h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_24px_8px_rgba(139,92,246,0.26)]" />
            <div className="absolute bottom-[18%] left-[22%] h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_24px_8px_rgba(34,197,94,0.24)]" />
          </div>

          <div className="absolute left-1/2 top-1/2 z-10 flex h-56 w-56 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_110px_rgba(6,182,212,0.28)]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="absolute inset-5 rounded-full border border-dashed border-violet-400/35" />
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }} className="flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-[#121826]/90 text-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <BrainCircuit size={56} />
            </motion.div>
          </div>

          <div className="absolute left-6 top-6 w-[min(320px,calc(100%-3rem))]">
            <AgentCard agent={agentSteps[0]} index={0} />
          </div>
          <div className="absolute right-6 top-20 w-[min(320px,calc(100%-3rem))]">
            <AgentCard agent={agentSteps[1]} index={1} />
          </div>
          <div className="absolute bottom-16 left-10 w-[min(320px,calc(100%-3rem))]">
            <AgentCard agent={agentSteps[2]} index={2} />
          </div>
          <div className="absolute bottom-6 right-8 w-[min(320px,calc(100%-3rem))]">
            <AgentCard agent={agentSteps[3]} index={3} />
          </div>
        </div>
      </section>

      <GlassCard className="overflow-hidden p-0">
        <div className="relative grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
          <div className="absolute left-0 top-0 h-28 w-full bg-gradient-to-r from-cyan-400/10 via-violet-500/10 to-transparent" />
          {['Input signals normalized', 'Agents reached consensus', 'Recommendation explainable'].map((label, index) => (
            <div key={label} className="relative rounded-[24px] border border-white/10 bg-white/[0.045] p-5">
              <p className="text-3xl font-bold text-white">0{index + 1}</p>
              <p className="mt-3 text-sm font-semibold text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
