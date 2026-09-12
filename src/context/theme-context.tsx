'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from './auth-context';
import { THEMES, ThemeName, WALLPAPERS, WallpaperName } from '@/constants';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

interface ThemeContextType {
  themeName: ThemeName;
  wallpaper: WallpaperName;
  theme: (typeof THEMES)[ThemeName];
  setTheme: (theme: ThemeName) => Promise<void>;
  setWallpaper: (wallpaper: WallpaperName) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [themeName, setThemeName] = useState<ThemeName>('DARK');
  const [wallpaper, setWallpaperState] = useState<WallpaperName>('NONE');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (user) {
      setThemeName((user.selected_theme_name as ThemeName) || 'DARK');
      setWallpaperState((user.chat_wallpaper as WallpaperName) || 'NONE');
    }
    setHydrated(true);
  }, [user]);

  const theme = THEMES[themeName] ?? THEMES.DARK;

  const setTheme = async (newTheme: ThemeName) => {
    setThemeName(newTheme);
  };

  const setWallpaper = async (newWallpaper: WallpaperName) => {
    setWallpaperState(newWallpaper);
  };

  const value = useMemo(
    () => ({ themeName, wallpaper, theme, setTheme, setWallpaper }),
    [themeName, wallpaper, theme]
  );

  if (!hydrated) {
    return (
      <ThemeContext.Provider
        value={{
          themeName: 'DARK',
          wallpaper: 'NONE',
          theme: THEMES.DARK,
          setTheme: async () => {},
          setWallpaper: async () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const wallpaperUri = (name: WallpaperName) => WALLPAPERS[name];
