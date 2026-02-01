import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme storage key
const THEME_STORAGE_KEY = 'suprik_theme';
const ACCENT_COLOR_STORAGE_KEY = 'suprik_accent_color';
const LIGHT_MODE_STORAGE_KEY = 'suprik_light_mode';

// Accent color options for wallet theme
export interface AccentColorOption {
  id: string;
  name: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  gradient: string;
  previewClass: string;
}

export const accentColorOptions: AccentColorOption[] = [
  {
    id: 'purple',
    name: 'Purple',
    primary: '#9333ea',
    primaryDark: '#7e22ce',
    secondary: '#2563eb',
    accent: '#a855f7',
    gradient: 'from-purple-600 to-blue-600',
    previewClass: 'bg-purple-500',
  },
  {
    id: 'orange',
    name: 'Orange',
    primary: '#f97316',
    primaryDark: '#ea580c',
    secondary: '#fb923c',
    accent: '#fdba74',
    gradient: 'from-orange-500 to-orange-600',
    previewClass: 'bg-orange-500',
  },
  {
    id: 'blue',
    name: 'Blue',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    secondary: '#60a5fa',
    accent: '#93c5fd',
    gradient: 'from-blue-500 to-blue-600',
    previewClass: 'bg-blue-500',
  },
  {
    id: 'green',
    name: 'Green',
    primary: '#22c55e',
    primaryDark: '#16a34a',
    secondary: '#4ade80',
    accent: '#86efac',
    gradient: 'from-green-500 to-emerald-600',
    previewClass: 'bg-green-500',
  },
  {
    id: 'pink',
    name: 'Pink',
    primary: '#ec4899',
    primaryDark: '#db2777',
    secondary: '#f472b6',
    accent: '#f9a8d4',
    gradient: 'from-pink-500 to-pink-600',
    previewClass: 'bg-pink-500',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    primary: '#06b6d4',
    primaryDark: '#0891b2',
    secondary: '#22d3ee',
    accent: '#67e8f9',
    gradient: 'from-cyan-500 to-cyan-600',
    previewClass: 'bg-cyan-500',
  },
  {
    id: 'red',
    name: 'Red',
    primary: '#ef4444',
    primaryDark: '#dc2626',
    secondary: '#f87171',
    accent: '#fca5a5',
    gradient: 'from-red-500 to-red-600',
    previewClass: 'bg-red-500',
  },
  {
    id: 'yellow',
    name: 'Gold',
    primary: '#eab308',
    primaryDark: '#ca8a04',
    secondary: '#facc15',
    accent: '#fde047',
    gradient: 'from-yellow-500 to-amber-600',
    previewClass: 'bg-yellow-500',
  },
  {
    id: 'steel',
    name: 'Steel Blue',
    primary: '#2596be',
    primaryDark: '#1e7a9c',
    secondary: '#3bacd4',
    accent: '#5dc4e8',
    gradient: 'from-sky-500 to-blue-600',
    previewClass: 'bg-sky-500',
  },
  {
    id: 'violet',
    name: 'Violet',
    primary: '#8042e0',
    primaryDark: '#6a35bc',
    secondary: '#9a66e8',
    accent: '#b48aef',
    gradient: 'from-violet-500 to-purple-600',
    previewClass: 'bg-violet-500',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    primary: '#5218af',
    primaryDark: '#42138c',
    secondary: '#6b30c9',
    accent: '#8a52e0',
    gradient: 'from-indigo-600 to-purple-700',
    previewClass: 'bg-indigo-600',
  },
];

// Get accent color from localStorage
export function getStoredAccentColor(walletId?: string): string {
  try {
    const key = walletId ? `${ACCENT_COLOR_STORAGE_KEY}_${walletId}` : ACCENT_COLOR_STORAGE_KEY;
    return localStorage.getItem(key) || 'indigo';
  } catch {
    return 'indigo';
  }
}

// Save accent color to localStorage
export function saveStoredAccentColor(accentColorId: string, walletId?: string): void {
  try {
    const key = walletId ? `${ACCENT_COLOR_STORAGE_KEY}_${walletId}` : ACCENT_COLOR_STORAGE_KEY;
    localStorage.setItem(key, accentColorId);
  } catch (e) {
    console.warn('[Theme] Failed to save accent color:', e);
  }
}

// Get theme from localStorage
export function getStoredTheme(walletId?: string): string {
  try {
    const key = walletId ? `${THEME_STORAGE_KEY}_${walletId}` : THEME_STORAGE_KEY;
    return localStorage.getItem(key) || 'classic';
  } catch {
    return 'classic';
  }
}

// Save theme to localStorage
export function saveStoredTheme(theme: string, walletId?: string): void {
  try {
    const key = walletId ? `${THEME_STORAGE_KEY}_${walletId}` : THEME_STORAGE_KEY;
    localStorage.setItem(key, theme);
  } catch (e) {
    console.warn('[Theme] Failed to save theme:', e);
  }
}

interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  gradient: string;
}

// Get light mode from localStorage
export function getStoredLightMode(): boolean {
  try {
    return localStorage.getItem(LIGHT_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

// Save light mode to localStorage
export function saveStoredLightMode(isLightMode: boolean): void {
  try {
    localStorage.setItem(LIGHT_MODE_STORAGE_KEY, isLightMode ? 'true' : 'false');
  } catch (e) {
    console.warn('[Theme] Failed to save light mode:', e);
  }
}

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  gradient: string;
  colors: ThemeColors;
  accentColor: string;
  setAccentColor: (accentColorId: string) => void;
  isLightMode: boolean;
  setLightMode: (isLight: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, walletId }: { children: ReactNode; walletId?: string }) {
  const [theme, setThemeState] = useState('classic');
  const [accentColor, setAccentColorState] = useState('indigo');
  const [isLightMode, setLightModeState] = useState(false);

  useEffect(() => {
    // Load theme from localStorage (instant, no server call)
    const savedTheme = getStoredTheme(walletId);
    const savedAccentColor = getStoredAccentColor(walletId);
    const savedLightMode = getStoredLightMode();
    setThemeState(savedTheme);
    setAccentColorState(savedAccentColor);
    setLightModeState(savedLightMode);
    applyAccentColorToDocument(savedAccentColor);
    applyLightModeToDocument(savedLightMode);
  }, [walletId]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    // Save to localStorage (client-side persistence)
    saveStoredTheme(newTheme, walletId);
  };

  const setAccentColor = (accentColorId: string) => {
    setAccentColorState(accentColorId);
    applyAccentColorToDocument(accentColorId);
    // Save to localStorage (client-side persistence)
    saveStoredAccentColor(accentColorId, walletId);
  };

  const setLightMode = (isLight: boolean) => {
    setLightModeState(isLight);
    applyLightModeToDocument(isLight);
    // Save to localStorage (client-side persistence)
    saveStoredLightMode(isLight);
  };

  const applyAccentColorToDocument = (accentColorId: string) => {
    const accentOption = accentColorOptions.find(c => c.id === accentColorId) || accentColorOptions[0];

    document.documentElement.setAttribute('data-accent', accentColorId);

    // Apply CSS variables for accent color
    document.documentElement.style.setProperty('--color-primary', accentOption.primary);
    document.documentElement.style.setProperty('--color-primary-dark', accentOption.primaryDark);
    document.documentElement.style.setProperty('--color-secondary', accentOption.secondary);
    document.documentElement.style.setProperty('--color-accent', accentOption.accent);
  };

  const applyLightModeToDocument = (isLight: boolean) => {
    if (isLight) {
      document.documentElement.classList.add('light-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  };

  // Get gradient based on accent color
  const accentOption = accentColorOptions.find(c => c.id === accentColor) || accentColorOptions[0];
  const gradient = accentOption.gradient;
  const colors: ThemeColors = {
    primary: accentOption.primary,
    primaryDark: accentOption.primaryDark,
    secondary: accentOption.secondary,
    accent: accentOption.accent,
    gradient: accentOption.gradient,
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, gradient, colors, accentColor, setAccentColor, isLightMode, setLightMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}