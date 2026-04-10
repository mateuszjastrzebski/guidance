"use client";

import { ActionIcon, Avatar, Group, Text, Tooltip, type MantineSpacing } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import type { Route } from "next";
import Link from "next/link";

import { MOCK_SESSION_RSVP_PLAYERS } from "@/lib/mocks/demo-campaign-roster";

/** Tymczasowe dane UI — zastąpić fetch z Supabase (sesje / RSVP). */
const MOCK_NEXT_SESSION_AT = new Date("2026-04-12T19:00:00");

const AVATAR_GAP_PX = 8;

const formatSessionFull = (d: Date) =>
  new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);

const formatSessionShort = (d: Date) =>
  new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(d);

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Inset ring — bez zewnętrznego „badge”, nie psuje layoutu ani inicjałów. */
function avatarStylesForRsvp(accepted: boolean) {
  if (accepted) {
    return {
      root: {
        boxShadow: "inset 0 0 0 2px var(--mantine-color-teal-filled)"
      }
    } as const;
  }
  return {
    root: {
      filter: "grayscale(1)",
      opacity: 0.48
    }
  } as const;
}

type CampaignTopBarActionsProps = {
  campaignId: string;
  /** Odstępy między: sesja | zaakceptowali+awatary | ustawienia */
  actionsSectionGap?: MantineSpacing;
};

export function CampaignTopBarActions({
  campaignId,
  actionsSectionGap = "xl"
}: CampaignTopBarActionsProps) {
  const settingsHref = `/campaign/${campaignId}/settings` as Route;
  const playerCharactersHref = `/campaign/${campaignId}/player-characters` as Route;
  const sessionTooltip = formatSessionFull(MOCK_NEXT_SESSION_AT);

  return (
    <Group
      gap={actionsSectionGap}
      justify="flex-end"
      miw={0}
      style={{ flex: "0 0 auto", maxWidth: "100%", position: "relative" }}
      wrap="nowrap"
    >
      <Tooltip label={sessionTooltip}>
        <Group align="center" gap={6} miw={0} visibleFrom="sm" wrap="nowrap">
          <Text c="dimmed" component="span" size="sm" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
            Następna sesja
          </Text>
          <Text fw={600} lineClamp={1} size="md">
            {formatSessionFull(MOCK_NEXT_SESSION_AT)}
          </Text>
        </Group>
      </Tooltip>
      <Tooltip label={sessionTooltip}>
        <Group align="center" gap={4} hiddenFrom="sm" miw={0} wrap="nowrap">
          <Text c="dimmed" component="span" size="xs" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
            Następna sesja
          </Text>
          <Text fw={600} lineClamp={1} maw={140} size="sm">
            {formatSessionShort(MOCK_NEXT_SESSION_AT)}
          </Text>
        </Group>
      </Tooltip>

      <Group align="center" gap="sm" justify="flex-end" style={{ flexShrink: 0 }} wrap="nowrap">
        <Text c="dimmed" hiddenFrom="sm" size="xs" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
          Zaakceptowali
        </Text>
        <Text c="dimmed" size="sm" style={{ flexShrink: 0, whiteSpace: "nowrap" }} visibleFrom="sm">
          Zaakceptowali
        </Text>
        <Group gap={AVATAR_GAP_PX} justify="flex-end" style={{ flexShrink: 0 }} wrap="nowrap">
          {MOCK_SESSION_RSVP_PLAYERS.map((p) => (
            <Tooltip
              key={p.id}
              label={`${p.name} — ${p.accepted ? "Potwierdzono obecność" : "Oczekuje na potwierdzenie"}`}
            >
              <Avatar
                aria-label={p.name}
                color={p.accepted ? "cyan" : "gray"}
                component={Link}
                href={playerCharactersHref}
                prefetch
                radius="xl"
                size="sm"
                styles={avatarStylesForRsvp(p.accepted)}
              >
                {initials(p.name)}
              </Avatar>
            </Tooltip>
          ))}
        </Group>
      </Group>

      <Tooltip label="Ustawienia kampanii">
        <ActionIcon
          aria-label="Ustawienia kampanii"
          component={Link}
          href={settingsHref}
          prefetch
          size="lg"
          style={{ flexShrink: 0 }}
          variant="subtle"
        >
          <IconSettings size={20} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
