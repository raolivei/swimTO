import { useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const DISMISS_KEY = 'swimto:install-prompt-dismissed';

export function InstallPrompt() {
  const { canInstall, isIOS, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore storage errors (private mode)
    }
  };

  if (isInstalled || dismissed) return null;

  // Show iOS instructions modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Install SwimTO on iOS
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary-600 dark:text-primary-400">1</span>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  Tap the <Share className="w-4 h-4 inline text-primary-500" /> Share button in Safari
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary-600 dark:text-primary-400">2</span>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  Scroll down and tap <Plus className="w-4 h-4 inline" /> "Add to Home Screen"
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary-600 dark:text-primary-400">3</span>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  Tap "Add" in the top right corner
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="w-full mt-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  // Show install banner for iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[2500] animate-slide-up">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Install SwimTO
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              Add to your home screen for quick access
            </p>
          </div>
          <button
            onClick={() => setShowIOSInstructions(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Show install banner for Chrome/Android
  if (canInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[2500] animate-slide-up">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Install SwimTO
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              Add to your home screen for quick access
            </p>
          </div>
          <button
            onClick={promptInstall}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
