import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-gray-50 dark:bg-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Terms of Service
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: January 17, 2026
              </p>
            </div>
          </div>

          <div className="prose prose-blue dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                By accessing and using SwimTO ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                2. Description of Service
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                SwimTO is a web application that aggregates and displays indoor community pool drop-in swim schedules for the City of Toronto. The Service provides:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Interactive map of community pool locations</li>
                <li>Schedule browser with filtering capabilities</li>
                <li>Ability to save favorite facilities</li>
                <li>Mobile-friendly interface</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                3. Data Sources
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                SwimTO uses data from the City of Toronto Open Data Portal, licensed under the{" "}
                <a
                  href="https://open.toronto.ca/open-data-license/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Open Government Licence – Toronto
                </a>
                . While we strive to keep information accurate and up-to-date, we cannot guarantee the accuracy of schedule information. Always verify schedules with the facility directly before visiting.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                4. User Accounts
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Some features require authentication via Google OAuth. By signing in, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Provide accurate account information</li>
                <li>Maintain the security of your account</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                5. Acceptable Use
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems to access the Service excessively</li>
                <li>Reproduce, duplicate, or resell the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                6. Intellectual Property
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                The Service, including its original content, features, and functionality, is owned by SwimTO and is protected by copyright, trademark, and other intellectual property laws. The SwimTO name, logo, and all related marks are trademarks of SwimTO.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                7. Disclaimer of Warranties
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. We do not warrant that the Service will be uninterrupted, secure, or error-free. Schedule information may be inaccurate or outdated.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                In no event shall SwimTO be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. This includes damages for loss of profits, data, or other intangibles, even if we have been advised of the possibility of such damages.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                9. Changes to Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to modify these terms at any time. We will notify users of significant changes by posting a notice on the Service. Your continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                10. Governing Law
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario, Canada, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                11. Contact
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                If you have any questions about these Terms, please contact us at{" "}
                <a
                  href="mailto:hello@swimto.app"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  hello@swimto.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
