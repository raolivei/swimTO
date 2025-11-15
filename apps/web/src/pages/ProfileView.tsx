import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useQuery } from "@tanstack/react-query";
import { facilityApi } from "@/lib/api";
import { User, Star, MapPin, Calendar, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProfileView() {
  const { user, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();

  // Fetch favorite facilities details
  const { data: facilities } = useQuery({
    queryKey: ["facilities"],
    queryFn: () => facilityApi.getAll(true),
    enabled: isAuthenticated && favorites.size > 0,
  });

  const favoriteFacilities = facilities?.filter((f) =>
    favorites.has(f.facility_id)
  );

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Not Logged In
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to view your profile
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-20rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Artistic Swimming Pool Banner */}
          <div className="relative h-48 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 overflow-hidden">
            {/* Pool water gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-300/30 via-blue-400/20 to-blue-600/40"></div>

            {/* Pool lane dividers */}
            <div className="absolute inset-0 flex justify-around opacity-15">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-0.5 h-full bg-white/40 relative">
                  {/* Dashed lane markers */}
                  <div className="absolute top-0 left-0 right-0 h-full flex flex-col justify-around">
                    {[...Array(8)].map((_, j) => (
                      <div key={j} className="h-4 bg-white/60"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Water ripples and bubbles */}
            <div className="absolute inset-0">
              {/* Large bubbles */}
              <div className="absolute top-8 right-16 w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm animate-pulse"></div>
              <div
                className="absolute top-16 right-40 w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute top-12 left-20 w-16 h-16 rounded-full bg-white/8 backdrop-blur-sm animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>

              {/* Small bubbles */}
              <div className="absolute top-20 right-28 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm"></div>
              <div className="absolute top-24 right-52 w-4 h-4 rounded-full bg-white/25 backdrop-blur-sm"></div>
              <div className="absolute top-14 left-32 w-5 h-5 rounded-full bg-white/15 backdrop-blur-sm"></div>
              <div className="absolute top-28 left-48 w-3 h-3 rounded-full bg-white/30 backdrop-blur-sm"></div>
            </div>

            {/* Animated water surface waves */}
            <div className="absolute inset-0 opacity-25">
              <svg
                className="absolute bottom-0 w-full h-40"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                style={{ animation: "wave 8s ease-in-out infinite" }}
              >
                <path
                  d="M0,30 C150,60 350,10 600,40 C850,70 1050,20 1200,50 L1200,120 L0,120 Z"
                  fill="currentColor"
                  className="text-white opacity-30"
                />
              </svg>
              <svg
                className="absolute bottom-0 w-full h-36"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                style={{
                  animation: "wave 10s ease-in-out infinite",
                  animationDelay: "-2s",
                }}
              >
                <path
                  d="M0,50 C200,80 400,30 650,60 C850,90 1000,40 1200,60 L1200,120 L0,120 Z"
                  fill="currentColor"
                  className="text-white opacity-40"
                />
              </svg>
              <svg
                className="absolute bottom-0 w-full h-32"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,70 C250,100 450,50 700,80 C900,110 1100,60 1200,80 L1200,120 L0,120 Z"
                  fill="currentColor"
                  className="text-white opacity-50"
                />
              </svg>
            </div>

            {/* Caustic light effect (water light patterns) */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/30 rounded-full blur-3xl animate-pulse"></div>
              <div
                className="absolute top-8 right-1/3 w-40 h-40 bg-cyan-200/20 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
              <div
                className="absolute top-4 left-1/2 w-24 h-24 bg-white/25 rounded-full blur-2xl animate-pulse"
                style={{ animationDelay: "2s" }}
              ></div>
            </div>
          </div>

          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-20">
              {/* Profile Picture */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || user.email}
                    className="relative w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-2xl object-cover ring-4 ring-primary-400/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="relative w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-2xl ring-4 ring-primary-400/30">
                    <User className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user.name || "User"}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <p className="text-sm">{user.email}</p>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-gray-500 dark:text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <p className="text-sm">
                    Member since{" "}
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Favorites Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Favorite Pools
            </h2>
            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              {favorites.size} {favorites.size === 1 ? "pool" : "pools"}
            </span>
          </div>

          {favorites.size === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No favorite pools yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Click the star icon on any pool to add it to your favorites
              </p>
              <Link
                to="/schedule"
                className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Browse Schedule
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {favoriteFacilities?.map((facility) => (
                <Link
                  key={facility.facility_id}
                  to="/schedule"
                  className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 hover:shadow-md"
                >
                  <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {facility.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {facility.address}
                    </p>
                    {facility.district && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {facility.district}
                      </p>
                    )}
                  </div>
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
