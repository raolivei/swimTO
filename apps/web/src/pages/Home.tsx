import { Link } from 'react-router-dom'
import { Map, Calendar, Waves } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Waves className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-4">
              Find Your Perfect Swim Time
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Discover indoor pool drop-in swim schedules across Toronto. 
              Lane swim sessions at community centers near you.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/map"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center gap-2"
              >
                <Map className="w-5 h-5" />
                View Map
              </Link>
              <Link
                to="/schedule"
                className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors border-2 border-white flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Browse Schedule
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Map className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
              <p className="text-gray-600">
                Explore all Toronto community centers with lane swim sessions on an interactive map.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Weekly Schedules</h3>
              <p className="text-gray-600">
                View comprehensive schedules with times, locations, and session types.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Waves className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Up-to-Date Data</h3>
              <p className="text-gray-600">
                Automatically updated schedules from City of Toronto Open Data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Dive In?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Find your nearest pool and start swimming today.
          </p>
          <Link
            to="/map"
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            <Map className="w-5 h-5" />
            Explore Pools
          </Link>
        </div>
      </section>
    </div>
  )
}

