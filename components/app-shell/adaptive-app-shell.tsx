"use client";

import {
  ActionIcon,
  AppShell,
  Burger,
  Button,
  Group,
  Menu,
  NavLink,
  Title,
  Tooltip
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconArrowLeft, IconUser } from "@tabler/icons-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
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

function CampaignNavbar({ campaignId }: { campaignId: string }) {
  const pathname = usePathname();
  const settingsHref = `/campaign/${campaignId}/settings` as Route;
  const inviteHref = `/campaign/${campaignId}/invite` as Route;

  return (
    <AppShell.Navbar p="md">
      <NavLink
        active={pathname === settingsHref || pathname === (`/campaign/${campaignId}` as Route)}
        component={Link}
        href={settingsHref}
        label="Ustawienia"
      />
      <NavLink active={pathname === inviteHref} component={Link} href={inviteHref} label="Zaproszenia" />
      <NavLink component={Link} href={"/dashboard" as Route} label="Wszystkie fabuły" mt="xl" />
    </AppShell.Navbar>
  );
}

type AdaptiveAppShellProps = {
  children: ReactNode;
};

export function AdaptiveAppShell({ children }: AdaptiveAppShellProps) {
  const { config } = useTopBar();
  const pathname = usePathname();
  const [mobileNavOpened, { toggle: toggleMobileNav }] = useDisclosure();

  const campaignMatch = pathname.match(/^\/campaign\/([^/]+)/);
  const campaignIdFromPath = campaignMatch?.[1] ?? null;
  const showCampaignNavbar = Boolean(campaignIdFromPath);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={
        showCampaignNavbar && campaignIdFromPath
          ? {
              width: 260,
              breakpoint: "sm",
              collapsed: { mobile: !mobileNavOpened }
            }
          : undefined
      }
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md" wrap="nowrap" gap="md">
          <Group gap="sm" miw={0} style={{ flex: 1 }} wrap="nowrap">
            {showCampaignNavbar ? (
              <Burger hiddenFrom="sm" onClick={toggleMobileNav} opened={mobileNavOpened} size="sm" />
            ) : null}
            {config.variant === "app" ? (
              <Link
                href={"/dashboard" as Route}
                prefetch
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <Title c="inherit" lineClamp={1} order={4}>
                  Campaign Layer
                </Title>
              </Link>
            ) : (
              <>
                <Tooltip label="Wszystkie fabuły">
                  <ActionIcon
                    aria-label="Powrót do listy fabuł"
                    component={Link}
                    href={"/dashboard" as Route}
                    size="lg"
                    variant="subtle"
                  >
                    <IconArrowLeft size={20} />
                  </ActionIcon>
                </Tooltip>
                <Title lineClamp={1} maw={{ base: "40vw", sm: 360 }} order={4}>
                  {config.campaignName}
                </Title>
                <Group gap={4} ml="md" visibleFrom="sm" wrap="nowrap">
                  <Button disabled size="xs" variant="default">
                    Fabuła
                  </Button>
                  <Button disabled size="xs" variant="default">
                    Sesje
                  </Button>
                </Group>
              </>
            )}
          </Group>
          <AccountActions />
        </Group>
      </AppShell.Header>
      {showCampaignNavbar && campaignIdFromPath ? (
        <CampaignNavbar campaignId={campaignIdFromPath} />
      ) : null}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
