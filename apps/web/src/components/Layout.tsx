import { Outlet, Link, useLocation } from 'react-router-dom'
import { Waves, Map, Calendar, Info } from 'lucide-react'

export default function Layout() {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const navLinkClass = (path: string) => {
    const base = "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
    return isActive(path)
      ? `${base} bg-primary-500 text-white`
      : `${base} text-gray-700 hover:bg-gray-100`
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <Waves className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold text-gray-900">SwimTO</span>
            </Link>

            <nav className="flex gap-2">
              <Link to="/" className={navLinkClass('/')}>
                <Waves className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link to="/map" className={navLinkClass('/map')}>
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </Link>
              <Link to="/schedule" className={navLinkClass('/schedule')}>
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Schedule</span>
              </Link>
              <Link to="/about" className={navLinkClass('/about')}>
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">About</span>
              </Link>
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

