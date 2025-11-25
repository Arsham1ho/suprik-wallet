import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from './supabase/info';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  gradient: string;
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
  };

  const gradient = themeGradients[theme] || themeGradients.classic;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, gradient }}>
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
