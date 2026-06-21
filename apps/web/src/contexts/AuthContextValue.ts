import { createContext } from "react";
import type { User } from "@/lib/api";

export type AuthContextType = {
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
