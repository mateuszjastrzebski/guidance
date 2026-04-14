"use client";

import { ActionIcon, Group, Tooltip, type MantineSpacing } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import type { Route } from "next";
import Link from "next/link";

type CampaignTopBarActionsProps = {
  campaignId: string;
  actionsSectionGap?: MantineSpacing;
};

export function CampaignTopBarActions({
  campaignId,
  actionsSectionGap = "xl"
}: CampaignTopBarActionsProps) {
  const settingsHref = `/campaign/${campaignId}/settings` as Route;

  return (
    <Group
      gap={actionsSectionGap}
      justify="flex-end"
      miw={0}
      style={{ flex: "0 0 auto", maxWidth: "100%", position: "relative" }}
      wrap="nowrap"
    >
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
