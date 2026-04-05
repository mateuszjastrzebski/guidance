"use client";

import { Box, Flex, NavLink } from "@mantine/core";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { CampaignNavRail } from "@/components/app-shell/campaign-nav-rail";

type CampaignSettingsLayoutProps = {
  children: ReactNode;
  params: { id: string };
};

export default function CampaignSettingsLayout({ children, params }: CampaignSettingsLayoutProps) {
  const pathname = usePathname();
  const settingsHref = `/campaign/${params.id}/settings` as Route;
  const invitationsHref = `/campaign/${params.id}/settings/invitations` as Route;
  const onInvitations = pathname.startsWith(`/campaign/${params.id}/settings/invitations`);

  /** Wysokość treści w Main: viewport minus nagłówek AppShell i pionowy padding Main (zmienne z Mantine). */
  const settingsShellMinHeight =
    "calc(100dvh - var(--app-shell-header-offset, 3.5rem) - var(--app-shell-padding, var(--mantine-spacing-md)) - var(--app-shell-padding, var(--mantine-spacing-md)))";

  return (
    <Box style={{ minHeight: settingsShellMinHeight }}>
      <Flex
        align={{ base: "flex-start", sm: "stretch" }}
        direction={{ base: "column", sm: "row" }}
        gap={{ base: "lg", sm: "xl" }}
        h={{ base: "auto", sm: "100%" }}
      >
      <CampaignNavRail variant="embedded">
        <NavLink
          active={!onInvitations}
          component={Link}
          href={settingsHref}
          label="Ustawienia"
          prefetch
        />
        <NavLink
          active={onInvitations}
          component={Link}
          href={invitationsHref}
          label="Zaproszenia"
          prefetch
        />
      </CampaignNavRail>
      <Box maw="100%" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </Box>
      </Flex>
    </Box>
  );
}
