import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
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
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Privacy Policy
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: January 17, 2026
              </p>
            </div>
          </div>

          {/* Privacy Highlight Box */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">
              Our Privacy Commitment
            </h2>
            <p className="text-green-700 dark:text-green-400">
              SwimTO is built with privacy as a core principle. We collect minimal data, 
              never sell your information, and give you full control over your data.
            </p>
          </div>

          <div className="prose prose-blue dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                1. Information We Collect
              </h2>
              
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">
                1.1 Information You Provide
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                When you sign in with Google OAuth, we receive:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Your name (as displayed on your Google account)</li>
                <li>Your email address</li>
                <li>Your profile picture URL</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                We use this information solely to identify your account and personalize your experience (e.g., displaying your name and saving your favorite pools).
              </p>

              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">
                1.2 Information Collected Automatically
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We collect minimal technical information necessary to operate the Service:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Your approximate location (only when you grant permission, to show nearby pools)</li>
                <li>Basic server logs (IP address, request timestamps) for security purposes</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-2">
                1.3 Information We Do NOT Collect
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>We do not use tracking cookies</li>
                <li>We do not use third-party analytics that track you</li>
                <li>We do not collect browsing history</li>
                <li>We do not build advertising profiles</li>
                <li>We do not sell any data to third parties</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Provide and maintain the Service</li>
                <li>Save your preferences (favorite pools, display settings)</li>
                <li>Show pools near your location (when you grant permission)</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Protect against fraudulent or unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                3. Data Storage and Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Your data is stored securely on our self-hosted infrastructure in Canada. We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Encrypted connections (HTTPS) for all data transmission</li>
                <li>Secure authentication via Google OAuth</li>
                <li>Regular security updates and monitoring</li>
                <li>Limited access to personal data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                4. Data Sharing
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights or the safety of users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                5. Your Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Under Canadian privacy law (PIPEDA) and other applicable regulations, you have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li><strong>Access</strong> your personal data</li>
                <li><strong>Correct</strong> inaccurate information</li>
                <li><strong>Delete</strong> your account and associated data</li>
                <li><strong>Withdraw consent</strong> for data processing</li>
                <li><strong>Export</strong> your data in a portable format</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                To exercise these rights, contact us at{" "}
                <a
                  href="mailto:privacy@swimto.app"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  privacy@swimto.app
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                6. Cookies and Local Storage
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We use minimal cookies and local storage:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li><strong>Authentication tokens</strong> - To keep you signed in</li>
                <li><strong>Preferences</strong> - Dark mode setting, favorite pools</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                We do not use tracking cookies or third-party advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                7. Location Data
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                When you grant location permission, we use your approximate location to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Show pools sorted by distance from you</li>
                <li>Display your position on the map</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                Your location is processed locally in your browser and is not stored on our servers. You can revoke location permission at any time through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                8. Children's Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                SwimTO is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                9. Changes to This Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting a notice on the Service. Your continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">
                10. Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                If you have questions about this Privacy Policy or our data practices, contact us at:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mt-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:privacy@swimto.app"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    privacy@swimto.app
                  </a>
                </p>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  <strong>General Inquiries:</strong>{" "}
                  <a
                    href="mailto:hello@swimto.app"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    hello@swimto.app
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
