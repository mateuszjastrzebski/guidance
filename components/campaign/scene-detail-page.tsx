"use client";

import { Badge, Box, Group, Stack, Tabs, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateSceneTitle } from "@/app/(app)/campaign/[id]/scenes/actions";
import { BackButton } from "@/components/campaign/back-button";
import { EditableEntityTitle } from "@/components/campaign/editable-entity-title";
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
  const router = useRouter();
  const [titleDraft, setTitleDraft] = useState(scene.name);
  const [saveState, setSaveState] = useState<"error" | "saved" | "saving">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string>(scene.updated_at);
  const [, startTransition] = useTransition();

  const saveMetaLabel =
    saveState === "saving"
      ? "Zapisywanie..."
      : saveState === "error"
        ? "Błąd zapisu"
        : `Ostatni zapis: ${formatSavedTime(lastSavedAt)}`;
  const saveMetaColor =
    saveState === "saving" ? "yellow" : saveState === "error" ? "red" : "teal";

  const handleTitleBlur = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === scene.name) {
      setTitleDraft(scene.name);
      return;
    }

    startTransition(async () => {
      setSaveState("saving");
      const result = await updateSceneTitle(campaignId, scene.id, trimmed);
      if (!result.ok) {
        setTitleDraft(scene.name);
        setSaveState("error");
        return;
      }
      if (result.savedAt) {
        setLastSavedAt(result.savedAt);
      }
      setSaveState("saved");
      router.refresh();
    });
  };

  return (
    <Stack gap={0} pb="xl">
      <Box pb="sm" pt="md" px="lg">
        <Group align="flex-start" gap="xs">
          <BackButton />
          <Stack gap={2} style={{ flex: 1 }}>
            <EditableEntityTitle onBlur={handleTitleBlur} onChange={setTitleDraft} value={titleDraft} />
            <Group gap="xs">
              <Badge color={saveMetaColor} variant="light">
                {saveMetaLabel}
              </Badge>
              {scene.thread_label ? <Badge variant="outline">Wątek: {scene.thread_label}</Badge> : null}
            </Group>
          </Stack>
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
          <SceneEditor
            campaignId={campaignId}
            onSaveMetaChange={(next) => {
              setSaveState(next.state);
              if (next.savedAt) {
                setLastSavedAt(next.savedAt);
              }
            }}
            references={references}
            scene={scene}
          />
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

function formatSavedTime(rawValue: string) {
  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) {
    return "przed chwilą";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
