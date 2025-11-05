import { Outlet, NavLink } from 'react-router-dom'
import { Waves, Map, Calendar, Info } from 'lucide-react'

export default function Layout() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base = "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
    return isActive
      ? `${base} bg-primary-500 text-white shadow-sm`
      : `${base} text-gray-700 hover:bg-gray-100`
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <NavLink to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Waves className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold text-gray-900">SwimTO</span>
            </NavLink>

            <nav className="flex gap-2" aria-label="Main navigation">
              <NavLink to="/" end className={navLinkClass}>
                <Waves className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </NavLink>
              <NavLink to="/map" className={navLinkClass}>
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </NavLink>
              <NavLink to="/schedule" className={navLinkClass}>
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Schedule</span>
              </NavLink>
              <NavLink to="/about" className={navLinkClass}>
                <Info className="w-4 h-4" />
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

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Data from{' '}
              <a
                href="https://open.toronto.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                City of Toronto Open Data Portal
              </a>
            </p>
            <p className="mt-1">
              Licensed under the Open Government Licence – Toronto
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

