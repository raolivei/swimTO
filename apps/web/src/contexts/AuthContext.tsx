import { createContext, useContext, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  authApi,
  type User,
  favoritesApi,
  getApiErrorMessage,
} from "@/lib/api";
import { useNavigate, useLocation } from "react-router-dom";
import { syncLocalFavoritesToBackend } from "@/lib/utils";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  clearLoginError: () => void;
  logout: () => void;
  handleGoogleCallback: (code: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "swimto_auth_token";
const USER_KEY = "swimto_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Try to load user from localStorage
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Check if user is authenticated by fetching current user
  const { isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        return null;
      }
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        return userData;
      } catch (error) {
        // Token is invalid, clear it
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        return null;
      }
    },
    enabled: !!localStorage.getItem(AUTH_TOKEN_KEY),
    retry: false,
  });

  const login = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const { auth_url } = await authApi.getGoogleAuthUrl();
      if (!auth_url) {
        throw new Error("No authentication URL received from server");
      }
      // Redirect to Google OAuth
      window.location.href = auth_url;
      // Note: setIsLoggingIn(false) is not called here because we're redirecting
    } catch (error) {
      console.error("Failed to get Google auth URL:", error);
      const errorInfo = getApiErrorMessage(error);
      // Provide more detailed error message
      let errorMessage = errorInfo.message || "Failed to initiate login. Please try again.";
      
      // Check if it's a network error
      if (errorInfo.title === "Network Connection Failed" || errorInfo.title === "Server Unavailable") {
        errorMessage = "Unable to connect to the authentication server. Please check your connection and try again.";
      }
      
      // Check if OAuth is not configured
      if (axios.isAxiosError(error) && error.response?.status === 503) {
        errorMessage = "Google authentication is not configured on the server. Please contact support.";
      }
      
      setLoginError(errorMessage);
      setIsLoggingIn(false);
    }
  };

  const clearLoginError = () => {
    setLoginError(null);
  };

  const handleGoogleCallback = async (code: string) => {
    try {
      const response = await authApi.googleCallback(code);
      localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setUser(response.user);

      // Sync local favorites to backend
      await syncLocalFavoritesToBackend({
        add: async (facilityId: string) => {
          await favoritesApi.add(facilityId);
          return;
        },
      });

      // Invalidate and refetch favorites
      queryClient.invalidateQueries({ queryKey: ["favorites"] });

      // Redirect to home or previous location
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Failed to handle Google callback:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);

    // Clear all favorites queries
    queryClient.removeQueries({ queryKey: ["favorites"] });

    // Redirect to home
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginError,
        isLoggingIn,
        login,
        clearLoginError,
        logout,
        handleGoogleCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
