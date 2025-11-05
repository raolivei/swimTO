import { Outlet, NavLink } from 'react-router-dom'
import { Waves, Map, Calendar, Info } from 'lucide-react'

export default function Layout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base = "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium relative overflow-hidden group"
    return isActive
      ? `${base} bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 scale-105`
      : `${base} text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:scale-105`
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      {/* Header with glassmorphism effect */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 transform hover:scale-105 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full group-hover:bg-primary-500/30 transition-all duration-300"></div>
                <Waves className="w-10 h-10 text-primary-500 relative animate-pulse" />
              </div>
              <div>
                <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">SwimTO</span>
                <p className="text-xs text-gray-500 font-medium">Toronto's Pool Finder</p>
              </div>
            </NavLink>

            <nav className="flex gap-2" aria-label="Main navigation">
              <NavLink to="/" end className={navLinkClass}>
                <Waves className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
              </NavLink>
              <NavLink to="/map" className={navLinkClass}>
                <Map className="w-5 h-5" />
                <span className="hidden sm:inline">Map</span>
              </NavLink>
              <NavLink to="/schedule" className={navLinkClass}>
                <Calendar className="w-5 h-5" />
                <span className="hidden sm:inline">Schedule</span>
              </NavLink>
              <NavLink to="/about" className={navLinkClass}>
                <Info className="w-5 h-5" />
                <span className="hidden sm:inline">About</span>
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer with gradient */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Waves className="w-6 h-6 text-primary-400" />
              <span className="text-xl font-bold text-white">SwimTO</span>
            </div>
            <p className="text-sm text-gray-400">
              Data from{' '}
              <a
                href="https://open.toronto.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 transition-colors underline decoration-primary-400/30 hover:decoration-primary-300"
              >
                City of Toronto Open Data Portal
              </a>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Licensed under the Open Government Licence – Toronto
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

