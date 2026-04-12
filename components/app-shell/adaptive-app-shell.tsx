"use client";

import { ActionIcon, AppShell, Box, Divider, Group, Menu, NavLink, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconUser } from "@tabler/icons-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  CAMPAIGN_NAV_RAIL_WIDTH,
  CampaignNavRail
} from "@/components/app-shell/campaign-nav-rail";
import { CampaignHeaderToolbar } from "@/components/app-shell/campaign-header-toolbar";
import { useTopBar } from "@/components/app-shell/top-bar-context";

const DESKTOP_NAV_COLLAPSED_STORAGE_KEY = "campaign-layer-sidenav-desktop-collapsed";

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
  const pathname = usePathname();
  const campaignMatch = pathname.match(/^\/campaign\/([^/]+)/);
  const campaignId = campaignMatch?.[1];
  if (!campaignId) {
    return null;
  }

  const campaignRoot = `/campaign/${campaignId}` as Route;
  const planner2Href = `${campaignRoot}/planner-2` as Route;
  const planner2Exact =
    pathname === planner2Href ||
    pathname === `${planner2Href}/` ||
    pathname === campaignRoot ||
    pathname === `${campaignRoot}/`;

  return (
    <AppShell.Navbar p={0}>
      <CampaignNavRail variant="shell">
        <Text c="dimmed" fw={600} px={8} size="xs" tt="uppercase">Kampania</Text>
        <NavLink
          active={pathname.startsWith(`${campaignRoot}/session-dashboard`)}
          component={Link}
          href={`${campaignRoot}/session-dashboard` as Route}
          label="Pulpit sesji"
          prefetch
        />
        <NavLink
          active={planner2Exact}
          component={Link}
          href={planner2Href}
          label="Planner"
          prefetch
        />
        <NavLink
          active={pathname.startsWith(`${campaignRoot}/threads`)}
          component={Link}
          href={`${campaignRoot}/threads` as Route}
          label="Wątki"
          prefetch
        />
        <NavLink
          active={pathname.startsWith(`${campaignRoot}/quests`)}
          component={Link}
          href={`${campaignRoot}/quests` as Route}
          label="Zadania"
          prefetch
        />
        <NavLink
          active={pathname.startsWith(`${campaignRoot}/scenes`)}
          component={Link}
          href={`${campaignRoot}/scenes` as Route}
          label="Sceny"
          prefetch
        />

        <Divider my={4} />

        <Text c="dimmed" fw={600} px={8} size="xs" tt="uppercase">Świat</Text>
        <NavLink
          active={pathname.startsWith(`${campaignRoot}/player-characters`)}
          component={Link}
          href={`${campaignRoot}/player-characters` as Route}
          label="Postacie graczy"
          prefetch
        />
        <NavLink
          active={pathname.startsWith(`${campaignRoot}/npcs`)}
          component={Link}
          href={`${campaignRoot}/npcs` as Route}
          label="NPC"
          prefetch
        />
        <NavLink
          active={pathname.startsWith(`${campaignRoot}/locations`)}
          component={Link}
          href={`${campaignRoot}/locations` as Route}
          label="Miejsca"
          prefetch
        />

        <Divider my={4} />

        <Text c="dimmed" fw={600} px={8} size="xs" tt="uppercase">Narzędzia</Text>
        <NavLink
          active={pathname.startsWith(`${campaignRoot}/shop-generator`)}
          component={Link}
          href={`${campaignRoot}/shop-generator` as Route}
          label="Generator sklepów"
          prefetch
        />
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
  const [mobileNavOpened, { close: closeMobileNav, toggle: toggleMobileNav }] = useDisclosure();
  /**
   * Mantine: `navbar.collapsed.desktop === true` ⇒ navbar schowany (patrz przykład CollapseDesktop w docs).
   * Trzymamy stan „panel widoczny” jak w docs (`desktopOpened`), w localStorage zapisujemy dotychczasowy znacznik „schowany”.
   */
  const [desktopNavbarOpened, setDesktopNavbarOpened] = useState(true);

  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(DESKTOP_NAV_COLLAPSED_STORAGE_KEY);
      if (raw === null) return;
      const storedCollapsed = JSON.parse(raw) === true;
      setDesktopNavbarOpened(!storedCollapsed);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        DESKTOP_NAV_COLLAPSED_STORAGE_KEY,
        JSON.stringify(!desktopNavbarOpened)
      );
    } catch {
      /* ignore */
    }
  }, [desktopNavbarOpened]);

  const toggleDesktopNav = useCallback(() => {
    setDesktopNavbarOpened((o) => !o);
  }, []);

  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  const campaignMatch = pathname.match(/^\/campaign\/([^/]+)/);
  const campaignIdFromPath = campaignMatch?.[1] ?? null;
  const isCampaignSettingsRoute = /^\/campaign\/[^/]+\/settings(\/.*)?$/.test(pathname);
  const isCampaignWhiteboardRoute = /^\/campaign\/[^/]+(?:\/planner-2)?$/.test(pathname);
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
              collapsed: { desktop: !desktopNavbarOpened, mobile: !mobileNavOpened }
            }
          : undefined
      }
      padding={isCampaignWhiteboardRoute ? 0 : "md"}
      styles={
        isCampaignWhiteboardRoute
          ? {
              root: { minHeight: "100dvh" },
              main: {
                display: "flex",
                flex: 1,
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden"
              }
            }
          : undefined
      }
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
              desktopNavCollapsed={showCampaignMainNavbar ? !desktopNavbarOpened : undefined}
              mobileNavOpened={mobileNavOpened}
              onToggleDesktopNav={showCampaignMainNavbar ? toggleDesktopNav : undefined}
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
