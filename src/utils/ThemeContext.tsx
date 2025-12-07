import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from './supabase/info';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  gradient: string;
}

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  gradient: string;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeGradients: Record<string, string> = {
  classic: 'from-purple-600 to-blue-600',
  midnight: 'from-blue-900 to-indigo-900',
  sunset: 'from-orange-500 to-pink-600',
  forest: 'from-emerald-600 to-teal-600',
  ocean: 'from-cyan-500 to-blue-500',
  aurora: 'from-purple-500 via-pink-500 to-blue-500',
  fire: 'from-red-600 to-yellow-500',
  neon: 'from-green-400 to-cyan-400',
};

const themeColors: Record<string, ThemeColors> = {
  classic: {
    primary: '#9333ea',      // purple-600
    primaryDark: '#7e22ce',  // purple-700
    secondary: '#2563eb',    // blue-600
    accent: '#a855f7',       // purple-500
    gradient: 'from-purple-600 to-blue-600'
  },
  midnight: {
    primary: '#1e3a8a',      // blue-900
    primaryDark: '#1e40af',  // blue-800
    secondary: '#3730a3',    // indigo-900
    accent: '#4f46e5',       // indigo-600
    gradient: 'from-blue-900 to-indigo-900'
  },
  sunset: {
    primary: '#f97316',      // orange-500
    primaryDark: '#ea580c',  // orange-600
    secondary: '#db2777',    // pink-600
    accent: '#fb923c',       // orange-400
    gradient: 'from-orange-500 to-pink-600'
  },
  forest: {
    primary: '#059669',      // emerald-600
    primaryDark: '#047857',  // emerald-700
    secondary: '#0d9488',    // teal-600
    accent: '#10b981',       // emerald-500
    gradient: 'from-emerald-600 to-teal-600'
  },
  ocean: {
    primary: '#06b6d4',      // cyan-500
    primaryDark: '#0891b2',  // cyan-600
    secondary: '#3b82f6',    // blue-500
    accent: '#22d3ee',       // cyan-400
    gradient: 'from-cyan-500 to-blue-500'
  },
  aurora: {
    primary: '#a855f7',      // purple-500
    primaryDark: '#9333ea',  // purple-600
    secondary: '#ec4899',    // pink-500
    accent: '#c084fc',       // purple-400
    gradient: 'from-purple-500 via-pink-500 to-blue-500'
  },
  fire: {
    primary: '#dc2626',      // red-600
    primaryDark: '#b91c1c',  // red-700
    secondary: '#eab308',    // yellow-500
    accent: '#f87171',       // red-400
    gradient: 'from-red-600 to-yellow-500'
  },
  neon: {
    primary: '#4ade80',      // green-400
    primaryDark: '#22c55e',  // green-500
    secondary: '#22d3ee',    // cyan-400
    accent: '#86efac',       // green-300
    gradient: 'from-green-400 to-cyan-400'
  }
};

export function ThemeProvider({ children, walletId }: { children: ReactNode; walletId?: string }) {
  const [theme, setThemeState] = useState('classic');

  useEffect(() => {
    if (walletId) {
      loadTheme();
    } else {
      // Apply default theme when not logged in
      applyThemeToDocument('classic');
    }
  }, [walletId]);

  const loadTheme = async () => {
    if (!walletId) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet/${walletId}/theme`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const savedTheme = data.theme || 'classic';
        setThemeState(savedTheme);
        applyThemeToDocument(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);
  };

  const applyThemeToDocument = (themeId: string) => {
    document.documentElement.setAttribute('data-theme', themeId);
    
    // Apply CSS variables
    const colors = themeColors[themeId] || themeColors.classic;
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-primary-dark', colors.primaryDark);
    document.documentElement.style.setProperty('--color-secondary', colors.secondary);
    document.documentElement.style.setProperty('--color-accent', colors.accent);
  };

  const gradient = themeGradients[theme] || themeGradients.classic;
  const colors = themeColors[theme] || themeColors.classic;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, gradient, colors }}>
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