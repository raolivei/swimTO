// Color scale from 50 (lightest) to 900 (darkest)
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

// Individual logo data
export interface Logo {
  id: string;
  imageData: string; // base64 or data URL
  prompt: string;
  generation: number;
  parentId: string | null;
  createdAt: string;
  isFavorite: boolean;
  metadata: {
    model?:
      | "dalle-3"
      | "leonardo"
      | "stable-diffusion"
      | "midjourney"
      | "manual";
    iterationNotes?: string;
  };
}

// Complete design system theme
export interface DesignTheme {
  id: string;
  logoId: string;
  name: string;
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    background: {
      light: string;
      dark: string;
    };
    surface: {
      light: string;
      dark: string;
    };
    text: {
      primary: { light: string; dark: string };
      secondary: { light: string; dark: string };
    };
    border: {
      light: string;
      dark: string;
    };
  };
  typography: {
    fontFamily: string;
    headingWeight: number;
    bodyWeight: number;
    scale: number; // multiplier for text sizes (0.8 - 1.2)
  };
  spacing: {
    unit: number; // base spacing unit in px (4, 6, 8)
    scale: number[]; // multipliers [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16]
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: string;
  };
}

// Saved theme preset (logo + theme combination)
export interface ThemePreset {
  id: string;
  name: string;
  logo: Logo;
  theme: DesignTheme;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Color extraction result
export interface ExtractedColors {
  dominant: string[]; // Top 5-8 dominant colors
  primary: string; // Main color (emphasis on blue)
  secondary: string; // Complementary color
  accent: string; // Highlight color
  neutrals: string[]; // Grays/whites/blacks
}

// Shape analysis result
export interface ShapeAnalysis {
  circularity: number; // 0-1, how round vs angular
  complexity: number; // 0-1, how detailed vs simple
  density: number; // 0-1, how compact vs spacious
  hasText: boolean; // Whether logo contains text
}

// Complete logo analysis
export interface LogoAnalysis {
  colors: ExtractedColors;
  shapes: ShapeAnalysis;
  suggestedTheme: Partial<DesignTheme>;
}

// Theme editor state
export interface ThemeEditorState {
  currentLogo: Logo | null;
  currentTheme: DesignTheme | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  history: {
    past: DesignTheme[];
    future: DesignTheme[];
  };
}

// Export format for sharing themes
export interface ThemeExport {
  version: string;
  preset: ThemePreset;
  cssVariables: Record<string, string>;
  tailwindConfig: object;
}
