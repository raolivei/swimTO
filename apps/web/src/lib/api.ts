import axios from "axios";
import type { Facility, SessionWithFacility, ScheduleFilters } from "../types";
import type { SwimTypeFilter } from "./swimTypeFilter";

// Use VITE_API_URL if set (for direct API access), otherwise use relative /api path (for Vite proxy in dev or nginx proxy in production)
// Empty string should also default to /api
let apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || "/api";

// Ensure we use the correct protocol
if (typeof window !== "undefined") {
  const protocol = window.location.protocol;
  const host = window.location.host;

  // If relative path, prepend current origin
  if (!apiBaseUrl.startsWith("http")) {
    apiBaseUrl = `${protocol}//${host}${apiBaseUrl}`;
  }
  // If absolute URL but we are on HTTPS and it is HTTP, upgrade to HTTPS (unless localhost)
  else if (
    protocol === "https:" &&
    apiBaseUrl.startsWith("http:") &&
    !apiBaseUrl.includes("localhost") &&
    !apiBaseUrl.includes("127.0.0.1")
  ) {
    apiBaseUrl = apiBaseUrl.replace("http:", "https:");
  }
}
const API_BASE_URL = apiBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("swimto_auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("swimto_auth_token");
      localStorage.removeItem("swimto_user");
    }
    return Promise.reject(error);
  }
);

export type PoolTypeFilter = "all" | "indoor" | "outdoor";

function resolveFacilityQueryParams(
  poolTypeOrHasLaneSwim: PoolTypeFilter | boolean = "all",
  poolTypeOrSwimType: PoolTypeFilter | SwimTypeFilter = "LANE_SWIM"
): { poolType: PoolTypeFilter; swimType: SwimTypeFilter } {
  if (typeof poolTypeOrHasLaneSwim === "boolean") {
    return {
      poolType:
        poolTypeOrSwimType === "indoor" ||
        poolTypeOrSwimType === "outdoor" ||
        poolTypeOrSwimType === "all"
          ? poolTypeOrSwimType
          : "all",
      swimType: poolTypeOrHasLaneSwim ? "LANE_SWIM" : "ALL",
    };
  }
  return {
    poolType: poolTypeOrHasLaneSwim,
    swimType: poolTypeOrSwimType as SwimTypeFilter,
  };
}

export const facilityApi = {
  getAll: async (
    poolTypeOrHasLaneSwim: PoolTypeFilter | boolean = "all",
    poolTypeOrSwimType: PoolTypeFilter | SwimTypeFilter = "LANE_SWIM"
  ): Promise<Facility[]> => {
    const { poolType, swimType } = resolveFacilityQueryParams(
      poolTypeOrHasLaneSwim,
      poolTypeOrSwimType
    );
    const params: Record<string, string | boolean> = {
      pool_type: poolType,
      has_lane_swim: false,
    };
    if (swimType !== "ALL") {
      params.swim_type = swimType;
    }
    const { data } = await api.get("/facilities", { params });
    return data;
  },

  getById: async (id: string): Promise<Facility> => {
    const { data } = await api.get(`/facilities/${id}`);
    return data;
  },
};

export const scheduleApi = {
  getSchedule: async (
    filters?: ScheduleFilters
  ): Promise<SessionWithFacility[]> => {
    const { data } = await api.get("/schedule", { params: filters });
    return data;
  },

  getToday: async (swimType?: string): Promise<SessionWithFacility[]> => {
    const { data } = await api.get("/schedule/today", {
      params: swimType ? { swim_type: swimType } : {},
    });
    return data;
  },
};

export const healthApi = {
  check: async () => {
    const { data } = await api.get("/health");
    return data;
  },
};

export interface User {
  id: number;
  email: string;
  name?: string;
  picture?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface FavoriteResponse {
  facility_id: string;
  created_at: string;
  facility?: Facility;
}

export const authApi = {
  getGoogleAuthUrl: async (): Promise<{ auth_url: string; redirect_uri: string }> => {
    // Use a shorter timeout for this endpoint since it should return instantly
    // Retry logic for network issues
    const maxRetries = 2;
    let lastError: unknown;
    
    // Pass current origin so backend can construct correct redirect URI
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data } = await api.get("/auth/google-url", {
          timeout: 10000, // 10 seconds - should be instant, but allow some buffer
          params: { origin },
        });
        // Store redirect_uri for use in callback.
        // Use localStorage (not sessionStorage) so it survives the OAuth
        // redirect — Google navigates away and back, clearing sessionStorage
        // on some browsers/devices.
        if (data.redirect_uri) {
          localStorage.setItem("swimto_oauth_redirect_uri", data.redirect_uri);
        }
        return data;
      } catch (error) {
        lastError = error;
        
        // Don't retry on 4xx errors (client errors)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw error;
        }
        
        // On last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    
    // Should never reach here, but TypeScript needs this
    throw lastError;
  },

  googleCallback: async (code: string): Promise<TokenResponse> => {
    // Retrieve the redirect_uri that was used when generating the auth URL.
    // Stored in localStorage so it survives the Google OAuth redirect.
    const stored = localStorage.getItem("swimto_oauth_redirect_uri");
    localStorage.removeItem("swimto_oauth_redirect_uri"); // Clean up

    // Fall back to constructing from current origin if localStorage was cleared
    const redirect_uri =
      stored ?? (typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined);

    const { data } = await api.post("/auth/google-callback", null, {
      params: { code, redirect_uri },
    });
    return data;
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get("/auth/me");
    return data;
  },
};

export const favoritesApi = {
  getAll: async (): Promise<FavoriteResponse[]> => {
    const { data } = await api.get("/favorites");
    return data;
  },

  add: async (facilityId: string): Promise<FavoriteResponse> => {
    const { data } = await api.post("/favorites", { facility_id: facilityId });
    return data;
  },

  remove: async (facilityId: string): Promise<void> => {
    await api.delete(`/favorites/${facilityId}`);
  },

  check: async (
    facilityId: string
  ): Promise<{ is_favorite: boolean; facility_id: string }> => {
    const { data } = await api.get(`/favorites/check/${facilityId}`);
    return data;
  },
};


/**
 * Get a user-friendly error message from an API error
 * Provides specific details for common error scenarios
 */
export function getApiErrorMessage(error: unknown): {
  title: string;
  message: string;
  details: string;
  suggestions: string[];
} {
  if (axios.isAxiosError(error)) {
    // Network error - no response received
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      return {
        title: "Network Connection Failed",
        message: "Unable to connect to the SwimTO server.",
        details: `Error: ${error.message}. Attempted URL: ${error.config?.baseURL || API_BASE_URL}${error.config?.url || ""}`,
        suggestions: [
          "Check that you are connected to WiFi or cellular data",
          "Try disabling any VPN or proxy connections",
          "If on mobile, try switching between WiFi and cellular data",
          "The server may be temporarily down - try again in a few minutes",
        ],
      };
    }

    // Timeout error
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return {
        title: "Request Timed Out",
        message: "The server took too long to respond.",
        details: `Timeout after ${
          (axios.defaults.timeout || 30000) / 1000
        } seconds`,
        suggestions: [
          "Check your internet connection speed",
          "Try again - the server may be experiencing high load",
          "If on cellular, try switching to WiFi for better connection",
        ],
      };
    }

    // Server responded with an error
    if (error.response) {
      const status = error.response.status;

      if (status === 404) {
        return {
          title: "Data Not Found",
          message: "The requested data is not available.",
          details: `HTTP ${status}: ${error.message}`,
          suggestions: [
            "The schedule data may be temporarily unavailable",
            "Try refreshing the page",
            "Contact support if this persists",
          ],
        };
      }

      if (status >= 500) {
        return {
          title: "Server Error",
          message: "The SwimTO server encountered an error.",
          details: `HTTP ${status}: ${error.response.statusText}`,
          suggestions: [
            "The server is experiencing issues",
            "Try again in a few minutes",
            "Check our status page for updates",
          ],
        };
      }

      return {
        title: "API Error",
        message: "An error occurred while fetching data.",
        details: `HTTP ${status}: ${
          error.response.statusText || error.message
        }`,
        suggestions: [
          "Try refreshing the page",
          "Clear your browser cache",
          "Contact support if the issue persists",
        ],
      };
    }

    // DNS/hostname resolution error (common on iPhone)
    if (error.message.includes("getaddrinfo") || error.code === "ENOTFOUND") {
      return {
        title: "Cannot Reach Server",
        message: "Unable to resolve server hostname.",
        details: `DNS Error: ${error.message}`,
        suggestions: [
          "Check that you are connected to the internet",
          "Try disabling any VPN or content blockers",
          "If on iPhone: Settings > Safari > Clear History and Website Data",
          "Try using a different network (WiFi vs cellular)",
        ],
      };
    }

    // Connection refused (server not running)
    if (error.code === "ECONNREFUSED") {
      return {
        title: "Server Unavailable",
        message: "The SwimTO server is not accepting connections.",
        details: `Connection refused to ${API_BASE_URL}. API endpoint: ${error.config?.url || "unknown"}`,
        suggestions: [
          "The server may be down for maintenance",
          "Try again in a few minutes",
          "Contact support if this persists",
        ],
      };
    }
  }

  // Generic error fallback
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  return {
    title: "Unexpected Error",
    message: "An unexpected error occurred.",
    details: errorMessage,
    suggestions: [
      "Try refreshing the page",
      "Check your internet connection",
      "Clear your browser cache and cookies",
      "Try a different browser",
      "Contact support if the issue persists",
    ],
  };
}

export default api;
