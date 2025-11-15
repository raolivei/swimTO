import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution (React StrictMode or re-renders)
    if (hasRun.current) return;
    hasRun.current = true;

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
      setLoading(false);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      setLoading(false);
      return;
    }

    handleGoogleCallback(code)
      .catch((err) => {
        console.error('Auth callback error:', err);
        setError('Failed to complete authentication. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams, handleGoogleCallback]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Error</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

