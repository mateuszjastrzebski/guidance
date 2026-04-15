"use client";

import {
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title
} from "@mantine/core";
import type { Route } from "next";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { createScene } from "@/app/(app)/campaign/[id]/scenes/actions";
import type { SceneRecord } from "@/lib/scenes";

type ScenesRosterPageProps = {
  campaignId: string;
  scenes: SceneRecord[];
};

export function ScenesRosterPage({ campaignId, scenes }: ScenesRosterPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const openScene = (sceneId: string) => {
    router.push(`/campaign/${campaignId}/scenes/${sceneId}` as Route);
  };

  const handleCreateScene = () => {
    startTransition(async () => {
      const result = await createScene(campaignId);
      if (!result.ok || !result.sceneId) {
        return;
      }
      router.push(`/campaign/${campaignId}/scenes/${result.sceneId}` as Route);
      router.refresh();
    });
  };

  return (
    <Container pb="xl" pt="md" size="lg">
      <Stack gap="lg">
        <Group align="flex-start" justify="space-between" wrap="wrap">
          <Title order={2}>Sceny</Title>
          <Group>
            <Button loading={isPending} onClick={handleCreateScene} variant="light">
              Nowa scena
            </Button>
          </Group>
        </Group>

        {scenes.length === 0 ? (
          <Text c="dimmed" size="sm">
            Brak scen.
          </Text>
        ) : (
          <Stack gap="md">
            {scenes.map((scene) => (
              <Paper
                key={scene.id}
                onClick={() => openScene(scene.id)}
                p="md"
                radius="md"
                style={{ cursor: "pointer" }}
                withBorder
              >
                <Stack gap="xs">
                  <Title order={4}>{scene.name}</Title>
                  {scene.thread_label ? (
                    <Text c="dimmed" size="sm">
                      Wątek: {scene.thread_label}
                    </Text>
                  ) : null}
                  <Text c="dimmed" lineClamp={2} size="sm">
                    {scene.outline_sections.map((section) => section.title).join(" • ")}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
