import { NavLink, Outlet } from 'react-router-dom'
import { BrainCircuit, Compass, History, LayoutGrid, Map, Navigation, UserRound, Zap } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Home', icon: LayoutGrid },
  { to: '/processing', label: 'Agents', icon: BrainCircuit },
  { to: '/recommendation', label: 'Route', icon: Compass },
  { to: '/compare', label: 'Compare', icon: Navigation },
  { to: '/map', label: 'Live Map', icon: Map },
  { to: '/history', label: 'History', icon: History },
]

export function AppShell() {
  return (
    <div className="relative min-h-screen bg-[#f5f5f5] text-[#202124]">
      {/* ── Navbar ── */}
      <header className="fixed left-0 right-0 top-0 z-[9999] border-b border-[#e0e0e0] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <NavLink to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-white">
              <Zap size={16} />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-[#202124]">UrbanPilot AI</p>
              <p className="truncate text-xs text-[#5f6368]">Multi-Agent Mobility</p>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#e8f0fe] text-[#1a73e8]'
                        : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]'
                    }`
                  }
                >
                  <Icon size={15} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          {/* Right — profile only */}
          <button
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#5f6368] transition hover:bg-[#f1f3f4]"
          >
            <UserRound size={17} />
          </button>
        </div>
      </header>

      <main className="mx-auto min-h-screen max-w-[1440px] px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-[#e0e0e0] bg-white px-2 py-2 lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition ${
                  isActive ? 'text-[#1a73e8]' : 'text-[#5f6368]'
                }`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}
