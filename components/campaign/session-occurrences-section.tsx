"use client";

import { Badge, Group, Paper, Stack, Text } from "@mantine/core";
import type { Route } from "next";
import Link from "next/link";

import type { SessionOccurrence } from "@/lib/scenes";

type SessionOccurrencesSectionProps = {
  emptyMessage?: string;
  occurrences: SessionOccurrence[];
};

export function SessionOccurrencesSection({
  emptyMessage = "Ta informacja nie występuje jeszcze w żadnej sesji.",
  occurrences
}: SessionOccurrencesSectionProps) {
  if (occurrences.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {occurrences.map((occurrence) => (
        <Paper key={`${occurrence.sceneId}-${occurrence.sessionNumber}`} p="md" radius="md" withBorder>
          <Stack gap={6}>
            <Group justify="space-between" wrap="wrap">
              <Text
                component={Link}
                fw={600}
                href={`/campaign/${occurrence.campaignId}/session-dashboard?session=${occurrence.sessionNumber}` as Route}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {occurrence.label}
              </Text>
              <Badge variant="light">Przez scenę</Badge>
            </Group>
            <Text
              component={Link}
              href={`/campaign/${occurrence.campaignId}/scenes/${occurrence.sceneId}` as Route}
              size="sm"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {occurrence.sceneTitle}
            </Text>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
