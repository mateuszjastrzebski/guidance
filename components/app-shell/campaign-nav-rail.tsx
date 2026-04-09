"use client";

import { Box, Stack } from "@mantine/core";
import type { ReactNode } from "react";

import classes from "./campaign-nav-rail.module.css";

/** Zgodne z `navbar.width` w AdaptiveAppShell. */
export const CAMPAIGN_NAV_RAIL_WIDTH = 260;

type CampaignNavRailProps = {
  children: ReactNode;
  /** `shell` — wewnątrz `AppShell.Navbar` (obramowanie daje AppShell). `embedded` — w `Main`, z linią jak navbar. */
  variant: "embedded" | "shell";
};

export function CampaignNavRail({ children, variant }: CampaignNavRailProps) {
  if (variant === "shell") {
    return (
      <Stack gap="xs" h="100%" p="md" style={{ flex: 1, minHeight: 0 }}>
        {children}
      </Stack>
    );
  }

  return (
    <Box
      aria-label="Nawigacja ustawień kampanii"
      className={classes.railEmbedded}
      component="nav"
    >
      <Stack gap="xs" style={{ flex: 1 }}>
        {children}
      </Stack>
    </Box>
  );
}
