"use client";

import {
  ActionIcon,
  Divider,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { useMemo, useState, useTransition, useEffect, useRef } from "react";

import { updateSceneSections } from "@/app/(app)/campaign/[id]/scenes/actions";
import type { SceneRecord, SceneReferenceBundle, SceneSection } from "@/lib/scenes";

type SceneEditorProps = {
  campaignId: string;
  compact?: boolean;
  onSaveMetaChange?: (value: { savedAt?: string; state: "error" | "saved" | "saving" }) => void;
  references: SceneReferenceBundle;
  scene: SceneRecord;
};

type SaveState = "error" | "saved" | "saving";

function createSection(): SceneSection {
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `section-${Date.now()}`;
  return { body: "", id, order: Date.now(), title: "Nowa sekcja" };
}

function matchesSearch(name: string, query: string) {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

export function SceneEditor({
  campaignId,
  compact = false,
  onSaveMetaChange,
  references,
  scene
}: SceneEditorProps) {
  const [sections, setSections] = useState<SceneSection[]>(scene.outline_sections);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const lastSavedJsonRef = useRef(JSON.stringify(scene.outline_sections));

  useEffect(() => {
    setSections(scene.outline_sections);
    lastSavedJsonRef.current = JSON.stringify(scene.outline_sections);
  }, [scene.id, scene.outline_sections]);

  const filteredSearchResults = useMemo(() => {
    if (!search.trim()) {
      return references.searchResults.slice(0, 8);
    }
    return references.searchResults.filter((item) => matchesSearch(item.name, search)).slice(0, 8);
  }, [references.searchResults, search]);

  useEffect(() => {
    const serialized = JSON.stringify(sections);
    if (serialized === lastSavedJsonRef.current) {
      return;
    }

    setSaveState("saving");
    onSaveMetaChange?.({ state: "saving" });
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        const result = await updateSceneSections(campaignId, scene.id, sections);
        if (!result.ok) {
          setSaveState("error");
          onSaveMetaChange?.({ state: "error" });
          showNotification({
            color: "red",
            message: result.error ?? "Nie udało się zapisać sceny.",
            title: "Błąd autosave"
          });
          return;
        }
        lastSavedJsonRef.current = serialized;
        setSaveState("saved");
        onSaveMetaChange?.({ savedAt: result.savedAt, state: "saved" });
      });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [campaignId, scene.id, sections, startTransition]);

  const setSectionField = (id: string, field: "body" | "title", value: string) => {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, [field]: value } : section))
    );
  };

  const addSectionAt = (index: number) => {
    setSections((current) => {
      const next = [...current];
      next.splice(index, 0, createSection());
      return next.map((section, order) => ({ ...section, order }));
    });
  };

  const removeSection = (id: string) => {
    setSections((current) =>
      current
        .filter((section) => section.id !== id)
        .map((section, index) => ({ ...section, order: index }))
    );
  };

  return (
    <Stack gap="lg">
      <Group align="flex-start" grow wrap="nowrap">
        <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
          <SectionInsertLine compact={compact} onClick={() => addSectionAt(0)} />
          {sections.map((section, index) => (
            <Stack key={section.id} gap="md">
              <Paper p={compact ? "md" : "lg"} radius="lg" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <TextInput
                      onChange={(event) => setSectionField(section.id, "title", event.currentTarget.value)}
                      placeholder="Tytuł sekcji"
                      styles={{ root: { flex: 1 } }}
                      value={section.title}
                    />
                    <ActionIcon
                      aria-label={`Usuń sekcję ${index + 1}`}
                      color="red"
                      onClick={() => removeSection(section.id)}
                      variant="subtle"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                  <Textarea
                    autosize
                    minRows={compact ? 4 : 6}
                    onChange={(event) => setSectionField(section.id, "body", event.currentTarget.value)}
                    placeholder="Rozpisz przebieg sceny, punkty zwrotne, emocje i możliwe reakcje."
                    value={section.body}
                  />
                </Stack>
              </Paper>
              <SectionInsertLine compact={compact} onClick={() => addSectionAt(index + 1)} />
            </Stack>
          ))}
        </Stack>

        <Paper p={compact ? "md" : "lg"} radius="lg" style={{ minWidth: compact ? 280 : 340, width: compact ? 300 : 360 }} withBorder>
          <Stack gap="md">
            <Stack gap={6}>
              <Title order={4}>Referencje sceny</Title>
              <Text c="dimmed" size="sm">
                Na razie wyświetlamy encje pomocnicze. Drag and drop do treści dodamy później.
              </Text>
            </Stack>

            <TextInput
              leftSection={<IconSearch size={16} />}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Szukaj innych encji kampanii"
              value={search}
            />

            <ScrollArea.Autosize mah={compact ? 520 : 720} offsetScrollbars>
              <Stack gap="md">
                <ReferenceGroup items={references.playerCharacters} title="Postacie graczy" />
                <ReferenceGroup items={references.characters} title="Postacie z wątku" />
                <ReferenceGroup items={references.npcs} title="NPC" />
                <ReferenceGroup items={references.locations} title="Miejsca" />
                <Divider />
                <ReferenceSearchResults items={filteredSearchResults} />
              </Stack>
            </ScrollArea.Autosize>
          </Stack>
        </Paper>
      </Group>

      {isPending ? (
        <Text c="dimmed" size="sm">
          Trwa zapis zmian…
        </Text>
      ) : null}
    </Stack>
  );
}

function SectionInsertLine({
  compact,
  onClick
}: {
  compact: boolean;
  onClick: () => void;
}) {
  return (
    <Group gap="sm" wrap="nowrap">
      <Divider style={{ flex: 1 }} />
      <ActionIcon
        aria-label="Dodaj sekcję"
        color="blue"
        onClick={onClick}
        radius="xl"
        size={compact ? "md" : "lg"}
        variant="light"
      >
        <IconPlus size={16} />
      </ActionIcon>
      <Divider style={{ flex: 1 }} />
    </Group>
  );
}

function ReferenceGroup({
  items,
  title
}: {
  items: Array<{ id: string; name: string }>;
  title: string;
}) {
  return (
    <Stack gap="xs">
      <Text fw={600} size="sm">
        {title}
      </Text>
      {items.length === 0 ? (
        <Text c="dimmed" size="sm">
          Brak elementów.
        </Text>
      ) : (
        items.map((item) => (
          <Paper key={item.id} p="xs" radius="md" withBorder>
            <Text size="sm">{item.name}</Text>
          </Paper>
        ))
      )}
    </Stack>
  );
}

function ReferenceSearchResults({
  items
}: {
  items: Array<{ id: string; kind: "character" | "quest" | "world_entry"; meta?: string; name: string }>;
}) {
  return (
    <Stack gap="xs">
      <Text fw={600} size="sm">
        Inne encje kampanii
      </Text>
      {items.length === 0 ? (
        <Text c="dimmed" size="sm">
          Nic nie pasuje do wyszukiwania.
        </Text>
      ) : (
        items.map((item) => (
          <Paper key={`${item.kind}-${item.id}`} p="xs" radius="md" withBorder>
            <Stack gap={2}>
              <Text size="sm">{item.name}</Text>
              <Text c="dimmed" size="xs">
                {item.meta ?? item.kind}
              </Text>
            </Stack>
          </Paper>
        ))
      )}
    </Stack>
  );
}
