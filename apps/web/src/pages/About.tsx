import { ExternalLink, Github } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">About SwimTO</h1>

          <div className="prose prose-blue dark:prose-invert max-w-none">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              SwimTO is an open-source application that aggregates and displays indoor community pool 
              drop-in swim schedules for the City of Toronto. Our goal is to make it easier for Toronto 
              residents to find convenient swimming times at community centers near them.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Features</h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>🗺️ Interactive map showing all pools with lane swim sessions</li>
              <li>📅 Comprehensive weekly schedules with times and locations</li>
              <li>🔄 Automatically updated data from City of Toronto Open Data</li>
              <li>📱 Responsive design that works on all devices</li>
              <li>🏗️ Self-hosted on Raspberry Pi k3s cluster</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Data Sources</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This application uses data from the{' '}
              <a
                href="https://open.toronto.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
              >
                City of Toronto Open Data Portal
                <ExternalLink className="w-4 h-4" />
              </a>
              , including:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 mb-6">
              <li>Recreation facilities metadata (pools.xml)</li>
              <li>Pool schedules (when available via API)</li>
              <li>Facility web pages (as fallback)</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              This data is licensed under the{' '}
              <a
                href="https://open.toronto.ca/open-data-license/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 dark:text-primary-400 hover:underline"
              >
                Open Government Licence – Toronto
              </a>
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Technology Stack</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Backend</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• FastAPI</li>
                  <li>• PostgreSQL</li>
                  <li>• SQLAlchemy</li>
                  <li>• Playwright & BeautifulSoup</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Frontend</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• React 18</li>
                  <li>• TypeScript</li>
                  <li>• Vite</li>
                  <li>• Leaflet Maps</li>
                  <li>• Tailwind CSS</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Open Source</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              SwimTO is open source and available on GitHub. Contributions are welcome!
            </p>
            <a
              href="https://github.com/raolivei/swimTO"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">Contact</h2>
            <p className="text-gray-700 dark:text-gray-300">
              For questions, issues, or suggestions, please open an issue on GitHub or contact the maintainer.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
