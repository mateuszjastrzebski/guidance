"use client";

import { ActionIcon, AppShell, Box, Group, Menu, NavLink, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconUser } from "@tabler/icons-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  CAMPAIGN_NAV_RAIL_WIDTH,
  CampaignNavRail
} from "@/components/app-shell/campaign-nav-rail";
import { CampaignHeaderToolbar } from "@/components/app-shell/campaign-header-toolbar";
import { useTopBar } from "@/components/app-shell/top-bar-context";

function AccountActions() {
  return (
    <Group gap="xs" wrap="nowrap">
      <Menu position="bottom-end" shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon aria-label="Konto" size="lg" variant="subtle">
            <IconUser size={20} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item disabled>Ustawienia konta (wkrótce)</Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <SignOutButton />
    </Group>
  );
}

function CampaignNavbar() {
  return (
    <AppShell.Navbar p={0}>
      <CampaignNavRail variant="shell">
        <NavLink component={Link} href={"/dashboard" as Route} label="Wszystkie fabuły" />
      </CampaignNavRail>
    </AppShell.Navbar>
  );
}

type AdaptiveAppShellProps = {
  children: ReactNode;
};

export function AdaptiveAppShell({ children }: AdaptiveAppShellProps) {
  const { config, setConfig } = useTopBar();
  const pathname = usePathname();
  const [mobileNavOpened, { toggle: toggleMobileNav }] = useDisclosure();

  const campaignMatch = pathname.match(/^\/campaign\/([^/]+)/);
  const campaignIdFromPath = campaignMatch?.[1] ?? null;
  const isCampaignSettingsRoute = /^\/campaign\/[^/]+\/settings(\/.*)?$/.test(pathname);
  const inCampaignShell = Boolean(campaignIdFromPath);
  const showCampaignMainNavbar = inCampaignShell && !isCampaignSettingsRoute;

  useEffect(() => {
    if (!campaignIdFromPath && config.variant === "campaign") {
      setConfig({ variant: "app" });
    }
  }, [campaignIdFromPath, config.variant, setConfig]);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={
        showCampaignMainNavbar && campaignIdFromPath
          ? {
              width: CAMPAIGN_NAV_RAIL_WIDTH,
              breakpoint: "sm",
              collapsed: { mobile: !mobileNavOpened }
            }
          : undefined
      }
      padding="md"
    >
      <AppShell.Header>
        <Box
          component="div"
          h="100%"
          miw={0}
          style={{ alignItems: "center", display: "flex", width: "100%" }}
        >
          {inCampaignShell && campaignIdFromPath ? (
            <CampaignHeaderToolbar
              campaignId={campaignIdFromPath}
              campaignName={config.variant === "campaign" ? config.campaignName : "Fabuła"}
              mobileNavOpened={mobileNavOpened}
              onToggleMobileNav={toggleMobileNav}
              showNavBurger={showCampaignMainNavbar}
            />
          ) : (
            <Group gap="md" h="100%" justify="space-between" px="md" style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
              <Group gap="sm" miw={0} style={{ flex: 1 }} wrap="nowrap">
                <Link
                  href={"/dashboard" as Route}
                  prefetch
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  <Title c="inherit" lineClamp={1} order={4}>
                    Campaign Layer
                  </Title>
                </Link>
              </Group>
              <AccountActions />
            </Group>
          )}
        </Box>
      </AppShell.Header>
      {showCampaignMainNavbar && campaignIdFromPath ? <CampaignNavbar /> : null}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
