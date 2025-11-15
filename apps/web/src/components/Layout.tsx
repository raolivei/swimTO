import { Outlet, NavLink } from "react-router-dom";
import {
  Waves,
  Map,
  Calendar,
  Info,
  Moon,
  Sun,
  LogIn,
  LogOut,
  User,
  AlertCircle,
  X,
} from "lucide-react";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";

export default function Layout() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const {
    user,
    isAuthenticated,
    login,
    logout,
    isLoading,
    loginError,
    isLoggingIn,
    clearLoginError,
  } = useAuth();
  const [showLoginError, setShowLoginError] = useState(false);

  useEffect(() => {
    if (loginError) {
      setShowLoginError(true);
    }
  }, [loginError]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base =
      "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium relative overflow-hidden group";
    return isActive
      ? `${base} bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 scale-105`
      : `${base} text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:scale-105`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-primary-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <NavLink
              to="/"
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-all duration-300 transform hover:scale-105 group"
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full group-hover:bg-primary-500/30 transition-all duration-300"></div>
                <Waves className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500 relative animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                  SwimTO
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
                  Toronto's Pool Finder
                </p>
              </div>
            </NavLink>

            <div className="flex items-center gap-2">
              <nav className="flex gap-2" aria-label="Main navigation">
                <NavLink to="/" end className={navLinkClass}>
                  <Waves className="w-5 h-5" />
                  <span className="hidden sm:inline">Home</span>
                </NavLink>
                <NavLink to="/map" className={navLinkClass}>
                  <Map className="w-5 h-5" />
                  <span className="hidden sm:inline">Map</span>
                </NavLink>
                <NavLink to="/schedule" className={navLinkClass}>
                  <Calendar className="w-5 h-5" />
                  <span className="hidden sm:inline">Schedule</span>
                </NavLink>
                <NavLink to="/about" className={navLinkClass}>
                  <Info className="w-5 h-5" />
                  <span className="hidden sm:inline">About</span>
                </NavLink>
              </nav>
              {isAuthenticated ? (
                <div className="flex items-center gap-2 ml-2">
                  <NavLink
                    to="/profile"
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 text-sm group"
                  >
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name || user.email}
                        className="w-6 h-6 rounded-full object-cover group-hover:scale-110 transition-transform"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Hide image on error and show User icon instead
                          console.error(
                            "Profile picture failed to load:",
                            user.picture
                          );
                          e.currentTarget.style.display = "none";
                          const userIcon = e.currentTarget.nextElementSibling;
                          if (userIcon) userIcon.classList.remove("hidden");
                        }}
                        onLoad={() =>
                          console.log("Profile picture loaded successfully")
                        }
                      />
                    ) : null}
                    <User
                      className={`w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors ${
                        user?.picture ? "hidden" : ""
                      }`}
                    />
                    <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white max-w-[120px] truncate transition-colors">
                      {user?.name?.split(" ")[0] || user?.email}
                    </span>
                  </NavLink>
                  <button
                    onClick={logout}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-110 group"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                  </button>
                </div>
              ) : (
                <div className="ml-2 relative">
                  <button
                    onClick={login}
                    disabled={isLoading || isLoggingIn}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    aria-label="Login with Google"
                    title="Login with Google"
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="hidden sm:inline">Logging in...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span className="hidden sm:inline">Login</span>
                      </>
                    )}
                  </button>
                  {showLoginError && loginError && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-3 z-50">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                            Login Failed
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-400">
                            {loginError}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowLoginError(false);
                            clearLoginError();
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          aria-label="Dismiss error"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={toggleDarkMode}
                className="ml-2 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-110 group"
                aria-label={
                  isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                }
                title={
                  isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500 group-hover:rotate-45 transition-transform duration-300" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700 group-hover:-rotate-12 transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-t border-gray-700 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Waves className="w-6 h-6 text-primary-400" />
              <span className="text-xl font-bold text-white">SwimTO</span>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Data from{" "}
              <a
                href="https://open.toronto.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 transition-colors underline decoration-primary-400/30 hover:decoration-primary-300"
              >
                City of Toronto Open Data Portal
              </a>
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-600">
              Licensed under the Open Government Licence – Toronto
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
