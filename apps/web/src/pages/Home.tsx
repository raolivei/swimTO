import { Link } from 'react-router-dom'
import { Map, Calendar, Waves, Sparkles, Clock, MapPin } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section with animated gradient */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-blue-600 text-white py-24 overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Toronto's Premier Pool Finder</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
              Find Your Perfect
              <br />
              <span className="bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                Swim Time
              </span>
            </h1>
            <p className="text-xl text-primary-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Discover indoor pool drop-in swim schedules across Toronto. 
              Over 50+ community centers with lane swim sessions near you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/map"
                className="group bg-white text-primary-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105"
              >
                <Map className="w-5 h-5 group-hover:animate-bounce" />
                View Map
              </Link>
              <Link
                to="/schedule"
                className="group bg-primary-700/50 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700/70 transition-all duration-300 border-2 border-white/30 flex items-center justify-center gap-3 transform hover:scale-105"
              >
                <Calendar className="w-5 h-5 group-hover:animate-bounce" />
                Browse Schedule
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-gray-600 font-medium">Community Centers</div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary-600 mb-2">200+</div>
              <div className="text-gray-600 font-medium">Weekly Sessions</div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Schedule Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with glassmorphism */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features to help you find and plan your swim sessions
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Interactive Map</h3>
              <p className="text-gray-600 leading-relaxed">
                Explore all Toronto community centers with lane swim sessions on an interactive map with real-time availability.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Smart Schedules</h3>
              <p className="text-gray-600 leading-relaxed">
                View comprehensive schedules with times, locations, and session types. Filter by your preferences.
              </p>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Real-Time Updates</h3>
              <p className="text-gray-600 leading-relaxed">
                Automatically updated schedules from City of Toronto Open Data. Always current, always accurate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA with gradient */}
      <section className="py-20 bg-gradient-to-r from-primary-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Ready to Dive In?</h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Find your nearest pool and start swimming today. Join thousands of swimmers across Toronto.
          </p>
          <Link
            to="/map"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-10 py-5 rounded-xl font-bold hover:shadow-2xl hover:shadow-primary-500/40 transition-all duration-300 transform hover:scale-105"
          >
            <Map className="w-6 h-6 group-hover:animate-bounce" />
            Explore Pools Now
          </Link>
        </div>
      </section>
    </div>
  )
}

