"use client";

import { Box, Group, Stack, Tabs, Text } from "@mantine/core";

import { BackButton } from "@/components/campaign/back-button";
import { SceneEditor } from "@/components/campaign/scene-editor";
import { SessionOccurrencesSection } from "@/components/campaign/session-occurrences-section";
import type { SceneRecord, SceneReferenceBundle, SessionOccurrence } from "@/lib/scenes";

type SceneDetailPageProps = {
  campaignId: string;
  occurrences: SessionOccurrence[];
  references: SceneReferenceBundle;
  scene: SceneRecord;
};

export function SceneDetailPage({
  campaignId,
  occurrences,
  references,
  scene
}: SceneDetailPageProps) {
  return (
    <Stack gap={0} pb="xl">
      <Box pb="sm" pt="md" px="lg">
        <Group align="center" gap="xs">
          <BackButton />
          <Text c="dimmed" size="sm">
            Szczegóły sceny
          </Text>
        </Group>
      </Box>

      <Tabs defaultValue="scene">
        <Box px="lg">
          <Tabs.List>
            <Tabs.Tab value="scene">Scena</Tabs.Tab>
            <Tabs.Tab value="sessions">Sesje</Tabs.Tab>
          </Tabs.List>
        </Box>

        <Tabs.Panel value="scene" pb="xl" pt="md" px="lg">
          <SceneEditor campaignId={campaignId} references={references} scene={scene} />
        </Tabs.Panel>

        <Tabs.Panel value="sessions" pb="xl" pt="md" px="lg">
          <SessionOccurrencesSection
            emptyMessage="Ta scena nie została jeszcze dodana do żadnej sesji."
            occurrences={occurrences}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
