"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useLocalStorage } from "@mantine/hooks";
import { createContext, useContext, useEffect, type ReactNode } from "react";

import {
  APP_THEME_STORAGE_KEY,
  DEFAULT_APP_THEME,
  getMantineTheme,
  isAppThemeName,
  type AppThemeName
} from "@/lib/styles/app-theme";

type AppThemeContextValue = {
  themeName: AppThemeName;
  setThemeName: (themeName: AppThemeName) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [themeName, setThemeName] = useLocalStorage<AppThemeName>({
    key: APP_THEME_STORAGE_KEY,
    defaultValue: DEFAULT_APP_THEME,
    getInitialValueInEffect: false,
    deserialize: (value) => (isAppThemeName(value) ? value : DEFAULT_APP_THEME),
    serialize: (value) => value
  });

  useEffect(() => {
    document.documentElement.dataset.appTheme = themeName;
  }, [themeName]);

  return (
    <AppThemeContext.Provider value={{ themeName, setThemeName }}>
      <MantineProvider defaultColorScheme="auto" theme={getMantineTheme(themeName)}>
        <Notifications position="top-right" />
        {children}
      </MantineProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}
