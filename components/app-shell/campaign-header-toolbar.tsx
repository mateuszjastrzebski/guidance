"use client";

import { ActionIcon, Burger, Group, Title, Tooltip, type MantineSpacing } from "@mantine/core";
import {
  IconArrowLeft,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand
} from "@tabler/icons-react";
import type { Route } from "next";
import Link from "next/link";

import { CampaignTopBarSearch } from "@/components/app-shell/campaign-top-bar-search";
import { CampaignTopBarActions } from "@/components/app-shell/campaign-top-bar-actions";

export type CampaignHeaderToolbarProps = {
  campaignId: string;
  campaignName: string;
  showNavBurger: boolean;
  mobileNavOpened: boolean;
  onToggleMobileNav: () => void;
  /** Ukryty lewy panel (tylko ≥ sm); gdy brak — przycisk się nie renderuje. */
  desktopNavCollapsed?: boolean;
  onToggleDesktopNav?: () => void;
  /** Odstępy między sekcjami w prawym bloku (sesja / zaakceptowali / ustawienia). */
  actionsSectionGap?: MantineSpacing;
};

/**
 * Jednolity pasek nagłówka kampanii (lewa nawigacja + prawe akcje).
 * Używany na dashboardzie fabuły, w ustawieniach i innych trasach `/campaign/[id]/*`, żeby layout był ten sam.
 */
export function CampaignHeaderToolbar({
  campaignId,
  campaignName,
  showNavBurger,
  mobileNavOpened,
  onToggleMobileNav,
  desktopNavCollapsed,
  onToggleDesktopNav,
  actionsSectionGap = "xl"
}: CampaignHeaderToolbarProps) {
  return (
    <Group
      align="center"
      gap="md"
      h="100%"
      justify="space-between"
      miw={0}
      px="md"
      style={{ flex: 1, minWidth: 0, width: "100%" }}
      wrap="nowrap"
    >
      <Group gap="sm" miw={0} style={{ flex: "1 1 0%", minWidth: 0 }} wrap="nowrap">
        {showNavBurger ? (
          <Burger hiddenFrom="sm" onClick={onToggleMobileNav} opened={mobileNavOpened} size="sm" />
        ) : null}
        {onToggleDesktopNav != null && desktopNavCollapsed != null ? (
          <Tooltip label={desktopNavCollapsed ? "Pokaż panel nawigacji" : "Ukryj panel nawigacji"}>
            <ActionIcon
              aria-expanded={!desktopNavCollapsed}
              aria-label={desktopNavCollapsed ? "Pokaż panel nawigacji" : "Ukryj panel nawigacji"}
              onClick={onToggleDesktopNav}
              size="lg"
              variant="subtle"
              visibleFrom="sm"
            >
              {desktopNavCollapsed ? (
                <IconLayoutSidebarLeftExpand size={20} />
              ) : (
                <IconLayoutSidebarLeftCollapse size={20} />
              )}
            </ActionIcon>
          </Tooltip>
        ) : null}
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
          {campaignName}
        </Title>
      </Group>
      <Group
        gap="md"
        miw={120}
        style={{ flex: "1 1 420px", maxWidth: 640, minWidth: 0 }}
        wrap="nowrap"
      >
        <CampaignTopBarSearch />
      </Group>
      <CampaignTopBarActions actionsSectionGap={actionsSectionGap} campaignId={campaignId} />
    </Group>
  );
}
