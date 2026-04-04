"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type TopBarConfig =
  | { variant: "app" }
  | { variant: "campaign"; campaignId: string; campaignName: string };

type TopBarContextValue = {
  config: TopBarConfig;
  setConfig: (config: TopBarConfig) => void;
};

const TopBarContext = createContext<TopBarContextValue | null>(null);

const defaultConfig: TopBarConfig = { variant: "app" };

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<TopBarConfig>(defaultConfig);

  const setConfig = useCallback((next: TopBarConfig) => {
    setConfigState(next);
  }, []);

  const value = useMemo(() => ({ config, setConfig }), [config, setConfig]);

  return <TopBarContext.Provider value={value}>{children}</TopBarContext.Provider>;
}

export function useTopBar() {
  const ctx = useContext(TopBarContext);
  if (!ctx) {
    throw new Error("useTopBar must be used within TopBarProvider");
  }
  return ctx;
}
