import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { ThemePreset } from "../types/logo";
import {
  generateCSSVariables,
  injectCSSVariables,
  removeCSSVariables,
} from "../lib/themeGenerator";
import { useDarkMode } from "./DarkModeContext";

interface ThemeSystemContextType {
  presets: ThemePreset[];
  activePreset: ThemePreset | null;
  isLoading: boolean;
  addPreset: (preset: ThemePreset) => void;
  updatePreset: (id: string, updates: Partial<ThemePreset>) => void;
  deletePreset: (id: string) => void;
  setActivePreset: (id: string | null) => void;
  exportPresets: () => string;
  importPresets: (jsonString: string) => boolean;
  clearPresets: () => void;
}

const ThemeSystemContext = createContext<ThemeSystemContextType | undefined>(
  undefined
);

const STORAGE_KEY = "swimto_theme_presets";
const ACTIVE_PRESET_KEY = "swimto_active_preset";

interface ThemeSystemProviderProps {
  children: ReactNode;
}

export function ThemeSystemProvider({ children }: ThemeSystemProviderProps) {
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [activePreset, setActivePresetState] = useState<ThemePreset | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastInjectedVars, setLastInjectedVars] = useState<Record<
    string,
    string
  > | null>(null);
  const { isDarkMode } = useDarkMode();

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const storedPresets = localStorage.getItem(STORAGE_KEY);
      const storedActiveId = localStorage.getItem(ACTIVE_PRESET_KEY);

      if (storedPresets) {
        const parsed = JSON.parse(storedPresets) as ThemePreset[];
        setPresets(parsed);

        // Restore active preset
        if (storedActiveId) {
          const active = parsed.find((p) => p.id === storedActiveId);
          if (active) {
            setActivePresetState(active);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load theme presets:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      } catch (error) {
        console.error("Failed to save theme presets:", error);
      }
    }
  }, [presets, isLoading]);

  // Apply active theme CSS variables
  useEffect(() => {
    if (activePreset) {
      // Remove previous variables before injecting new ones
      if (lastInjectedVars) {
        removeCSSVariables(lastInjectedVars);
      }

      const vars = generateCSSVariables(activePreset.theme, isDarkMode);
      injectCSSVariables(vars);
      setLastInjectedVars(vars);

      // Save active preset ID
      localStorage.setItem(ACTIVE_PRESET_KEY, activePreset.id);
    } else {
      // Remove custom variables when no preset is active
      if (lastInjectedVars) {
        removeCSSVariables(lastInjectedVars);
        setLastInjectedVars(null);
      }
      localStorage.removeItem(ACTIVE_PRESET_KEY);
    }
  }, [activePreset, isDarkMode]);

  /**
   * Add a new preset
   */
  const addPreset = useCallback((preset: ThemePreset) => {
    setPresets((prev) => {
      // Deactivate all existing presets if new one is active
      const updated = preset.isActive
        ? prev.map((p) => ({ ...p, isActive: false }))
        : prev;

      return [...updated, preset];
    });

    if (preset.isActive) {
      setActivePresetState(preset);
    }
  }, []);

  /**
   * Update an existing preset
   */
  const updatePreset = useCallback(
    (id: string, updates: Partial<ThemePreset>) => {
      setPresets((prev) => {
        const updated = prev.map((p) => {
          if (p.id === id) {
            const updatedPreset = {
              ...p,
              ...updates,
              updatedAt: new Date().toISOString(),
            };

            // Update active preset if it's the one being updated
            if (activePreset?.id === id) {
              setActivePresetState(updatedPreset);
            }

            return updatedPreset;
          }

          // Deactivate other presets if this one is being activated
          if (updates.isActive && p.isActive) {
            return { ...p, isActive: false };
          }

          return p;
        });

        return updated;
      });
    },
    [activePreset]
  );

  /**
   * Delete a preset
   */
  const deletePreset = useCallback(
    (id: string) => {
      setPresets((prev) => prev.filter((p) => p.id !== id));

      // Clear active preset if it's being deleted
      if (activePreset?.id === id) {
        setActivePresetState(null);
      }
    },
    [activePreset]
  );

  /**
   * Set the active preset
   */
  const setActivePreset = useCallback(
    (id: string | null) => {
      if (id === null) {
        setActivePresetState(null);
        setPresets((prev) => prev.map((p) => ({ ...p, isActive: false })));
        return;
      }

      const preset = presets.find((p) => p.id === id);
      if (preset) {
        setActivePresetState(preset);
        setPresets((prev) =>
          prev.map((p) => ({
            ...p,
            isActive: p.id === id,
          }))
        );
      }
    },
    [presets]
  );

  /**
   * Export all presets as JSON
   */
  const exportPresets = useCallback(() => {
    const data = {
      version: "1.0.0",
      exported: new Date().toISOString(),
      presets,
    };
    return JSON.stringify(data, null, 2);
  }, [presets]);

  /**
   * Import presets from JSON
   */
  const importPresets = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);

      if (!data.presets || !Array.isArray(data.presets)) {
        throw new Error("Invalid format");
      }

      setPresets(data.presets);

      // If there was an active preset, try to restore it
      const activeId = localStorage.getItem(ACTIVE_PRESET_KEY);
      if (activeId) {
        const active = data.presets.find((p: ThemePreset) => p.id === activeId);
        if (active) {
          setActivePresetState(active);
        }
      }

      return true;
    } catch (error) {
      console.error("Failed to import presets:", error);
      return false;
    }
  }, []);

  /**
   * Clear all presets
   */
  const clearPresets = useCallback(() => {
    setPresets([]);
    setActivePresetState(null);
  }, []);

  const value: ThemeSystemContextType = {
    presets,
    activePreset,
    isLoading,
    addPreset,
    updatePreset,
    deletePreset,
    setActivePreset,
    exportPresets,
    importPresets,
    clearPresets,
  };

  return (
    <ThemeSystemContext.Provider value={value}>
      {children}
    </ThemeSystemContext.Provider>
  );
}

/**
 * Hook to use the theme system context
 */
export function useThemeSystem() {
  const context = useContext(ThemeSystemContext);
  if (context === undefined) {
    throw new Error("useThemeSystem must be used within a ThemeSystemProvider");
  }
  return context;
}
