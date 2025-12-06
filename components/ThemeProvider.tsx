import React, { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useThemeStore } from '@/store/ThemeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { updateResolvedTheme } = useThemeStore();

  useEffect(() => {
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('System theme changed to:', colorScheme);
      updateResolvedTheme();
    });

    return () => subscription?.remove();
  }, [updateResolvedTheme]);

  return <>{children}</>;
};