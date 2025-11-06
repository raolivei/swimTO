import { Link } from "react-router-dom";
import { Clock, RefreshCw, Database, Server, CheckCircle, ArrowLeft } from "lucide-react";

export default function RealTimeUpdates() {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-gray-50 to-primary-50/10 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full mb-4">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">
              Always Up-to-Date
            </span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-4">
            Real-Time Updates
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Learn how SwimTO keeps your swim schedules accurate and current
          </p>
        </div>

        {/* How It Works Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary-500" />
            How It Works
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  City of Toronto Open Data
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We pull swim schedules directly from the{" "}
                  <a
                    href="https://open.toronto.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                  >
                    City of Toronto Open Data Portal
                  </a>
                  . This ensures our data comes from the official, authoritative source.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Daily Automatic Refresh
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Our system automatically refreshes the schedule data every day at 2:00 AM EST. 
                  This means you always see the latest information without having to do anything.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Smart Caching
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We use Redis caching to ensure the app loads quickly while still providing 
                  up-to-date information. The cache is automatically invalidated during the 
                  daily refresh.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What Gets Updated Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            What Gets Updated
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Swim Session Times</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start and end times for all sessions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Session Types</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lane swim, recreational, adult, senior
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Facility Information</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Addresses, phone numbers, locations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Special Notes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Closures, restrictions, requirements
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details Section */}
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-primary-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Technical Details
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">Data Sources:</strong> We aggregate data from multiple Toronto Open Data APIs, 
              including the Drop-in Programs API and Parks & Recreation facilities database.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">Update Frequency:</strong> Daily at 2:00 AM EST via automated cron job. 
              Critical updates may be processed more frequently.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">Data Accuracy:</strong> We normalize and validate all data to ensure consistency 
              across different source formats.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">Infrastructure:</strong> Runs on a self-hosted Kubernetes cluster with PostgreSQL 
              for persistent storage and Redis for caching.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Ready to Find Your Next Swim?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/map"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-primary-500/40 transition-all duration-300 transform hover:scale-105"
            >
              View Map
            </Link>
            <Link
              to="/schedule"
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 px-8 py-4 rounded-xl font-bold border-2 border-primary-300 dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
            >
              Browse Schedule
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

