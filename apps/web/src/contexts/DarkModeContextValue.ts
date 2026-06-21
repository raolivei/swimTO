import { createContext } from "react";

export type DarkModeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

export const DarkModeContext = createContext<DarkModeContextType | undefined>(
  undefined,
);
