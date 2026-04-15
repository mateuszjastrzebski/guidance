"use client";

import {
  Badge,
  Button,
  Container,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import type { Route } from "next";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createScene } from "@/app/(app)/campaign/[id]/scenes/actions";
import type { SceneRecord } from "@/lib/scenes";

type ScenesRosterPageProps = {
  campaignId: string;
  plannerEvents: Array<{ label: string; value: string }>;
  scenes: SceneRecord[];
};

export function ScenesRosterPage({ campaignId, plannerEvents, scenes }: ScenesRosterPageProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string | null>("all");
  const [selectedPlannerEventId, setSelectedPlannerEventId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredScenes = useMemo(() => {
    return scenes.filter((scene) => {
      const matchesQuery =
        !query.trim() || scene.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "manual" && scene.source_type !== "planner_event") ||
        (sourceFilter === "planner_event" && scene.source_type === "planner_event");
      return matchesQuery && matchesSource;
    });
  }, [query, scenes, sourceFilter]);

  const openScene = (sceneId: string) => {
    router.push(`/campaign/${campaignId}/scenes/${sceneId}` as Route);
  };

  const handleCreateScene = (sourceEventId?: string | null) => {
    startTransition(async () => {
      const result = await createScene(campaignId, { sourceEventId: sourceEventId ?? undefined });
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
          <Stack gap={4}>
            <Title order={2}>Sceny</Title>
            <Text c="dimmed" size="sm">
              Sceny są trwałe, zapisują się w tle i mogą pojawiać się w wielu sesjach.
            </Text>
          </Stack>
          <Group>
            <Button loading={isPending} onClick={() => handleCreateScene()} variant="light">
              Nowa scena
            </Button>
            <Select
              clearable
              data={plannerEvents}
              onChange={(value) => setSelectedPlannerEventId(value)}
              placeholder="Utwórz z eventu"
              searchable
              value={selectedPlannerEventId}
              w={260}
            />
            <Button
              disabled={!selectedPlannerEventId}
              loading={isPending}
              onClick={() => handleCreateScene(selectedPlannerEventId)}
            >
              Z eventu
            </Button>
          </Group>
        </Group>

        <Group grow align="flex-end">
          <TextInput
            label="Filtruj po tytule"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="np. Audiencja u księcia"
            value={query}
          />
          <Select
            data={[
              { label: "Wszystkie źródła", value: "all" },
              { label: "Sceny ręczne", value: "manual" },
              { label: "Sceny z eventu", value: "planner_event" }
            ]}
            label="Źródło"
            onChange={setSourceFilter}
            value={sourceFilter}
          />
        </Group>

        {filteredScenes.length === 0 ? (
          <Text c="dimmed" size="sm">
            Brak scen spełniających kryteria.
          </Text>
        ) : (
          <Stack gap="md">
            {filteredScenes.map((scene) => (
              <Paper
                key={scene.id}
                onClick={() => openScene(scene.id)}
                p="md"
                radius="md"
                style={{ cursor: "pointer" }}
                withBorder
              >
                <Stack gap="xs">
                  <Group justify="space-between" wrap="wrap">
                    <Title order={4}>{scene.name}</Title>
                    <Group gap="xs">
                      {scene.source_type === "planner_event" ? (
                        <Badge variant="dot">Z eventu</Badge>
                      ) : (
                        <Badge variant="light">Ręczna</Badge>
                      )}
                      {scene.session_numbers.length > 0 ? (
                        <Badge variant="light">
                          Sesje: {scene.session_numbers.join(", ")}
                        </Badge>
                      ) : null}
                    </Group>
                  </Group>
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
