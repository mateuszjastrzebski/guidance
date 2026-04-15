"use client";

import {
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { updateWorldEntry } from "@/app/(app)/campaign/[id]/world/actions";
import type { CharacterConfigRow } from "@/app/(app)/campaign/[id]/world/[collectionSlug]/[entryId]/configurator-actions";
import { BackButton } from "@/components/campaign/back-button";
import { CharacterConfiguratorTab } from "@/components/campaign/character-configurator-tab";
import { EditableEntityTitle } from "@/components/campaign/editable-entity-title";
import { EntityLinksSection } from "@/components/campaign/entity-links-section";
import { PlayerInfosSection } from "@/components/campaign/player-infos-section";
import { SessionOccurrencesSection } from "@/components/campaign/session-occurrences-section";
import { WorldEntryThreadsTab } from "@/components/campaign/world-entry-threads-tab";
import type { LinkedItem } from "@/lib/entity-links";
import { getRandomNamesForTemplate } from "@/lib/random-names";
import type { SessionOccurrence } from "@/lib/scenes";
import {
  getWorldTemplateDefinition,
  type WorldCollection,
  type WorldEntry
} from "@/lib/world";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type NamedItem = { id: string; name: string };
type WorldLinksSection = {
  title: string;
  allItems: NamedItem[];
  linkedItems: LinkedItem[];
};

type WorldEntryDetailPageProps = {
  campaignId: string;
  campaignCharacters: NamedItem[];
  collection: WorldCollection;
  entry: WorldEntry;
  occurrences: SessionOccurrence[];
  allQuests: NamedItem[];
  linkedQuests: LinkedItem[];
  worldLinkSections: WorldLinksSection[];
  characterConfig?: CharacterConfigRow | null;
};


export function WorldEntryDetailPage({
  campaignId,
  campaignCharacters,
  collection,
  entry,
  occurrences,
  allQuests,
  linkedQuests,
  worldLinkSections,
  characterConfig = null
}: WorldEntryDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nameRef = useRef<HTMLTextAreaElement>(null);
  const template = getWorldTemplateDefinition(collection.template_key);
  const [name, setName] = useState(entry.name);
  const [summary, setSummary] = useState(entry.summary ?? "");
  const [portraitUrl, setPortraitUrl] = useState(entry.portrait_url ?? "");
  const [levelRaw, setLevelRaw] = useState(entry.level != null ? String(entry.level) : "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const initialFieldValues = useMemo(() => {
    const currentData = entry.data ?? {};
    return Object.fromEntries(
      (template?.fields ?? []).map((field) => [field.key, String(currentData[field.key] ?? "")])
    ) as Record<string, string>;
  }, [entry.data, template]);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(initialFieldValues);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [searchParams]);

  const saveNameOnBlur = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === entry.name) return;
    startTransition(async () => {
      await updateWorldEntry(campaignId, entry.id, collection, {
        name: trimmed,
        summary,
        portrait_url: portraitUrl,
        level: levelRaw,
        ...fieldValues
      });
      router.refresh();
    });
  };

  const save = () => {
    setSaveError(null);
    startTransition(async () => {
      const result = await updateWorldEntry(campaignId, entry.id, collection, {
        name: name.trim() || entry.name,
        summary,
        portrait_url: portraitUrl,
        level: levelRaw,
        ...fieldValues
      });
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Stack gap={0} pb="xl">
      <Box pb="sm" pt="md" px="lg">
        <Group align="flex-start" gap="xs">
          <BackButton />
          <Group align="flex-start" gap="md" wrap="nowrap" style={{ flex: 1 }}>
            {portraitUrl ? (
              <Image alt="" fit="cover" h={40} radius="sm" src={portraitUrl} w={30} style={{ flexShrink: 0, marginTop: 4 }} />
            ) : (
              <Avatar color="gray" radius="sm" size="md" style={{ flexShrink: 0, marginTop: 4 }}>
                {initials(name || entry.name)}
              </Avatar>
            )}
            <EditableEntityTitle
              onBlur={saveNameOnBlur}
              onChange={setName}
              randomNames={getRandomNamesForTemplate(collection.template_key)}
              ref={nameRef}
              value={name}
            />
          </Group>
        </Group>
      </Box>

      <Tabs defaultValue="info">
        <Box px="lg">
          <Tabs.List>
            <Tabs.Tab value="info">Info</Tabs.Tab>
            <Tabs.Tab value="threads">Wątki</Tabs.Tab>
            <Tabs.Tab value="player-infos">Informacje dla graczy</Tabs.Tab>
            <Tabs.Tab value="sessions">Sesje</Tabs.Tab>
            {collection.template_key === "npc" ? (
              <Tabs.Tab value="configurator">Konfigurator</Tabs.Tab>
            ) : null}
          </Tabs.List>
        </Box>

        <Tabs.Panel value="info" pb="xl" pt="md" px="lg">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Stack gap="md">
                <Title order={5}>Dane podstawowe</Title>
                <Textarea
                  autosize
                  label="Opis"
                  maxRows={12}
                  minRows={4}
                  onChange={(e) => setSummary(e.currentTarget.value)}
                  value={summary}
                />
                {template?.supportsLevel ? (
                  <TextInput
                    label="Poziom"
                    onChange={(e) => setLevelRaw(e.currentTarget.value)}
                    type="number"
                    value={levelRaw}
                  />
                ) : null}
                <TextInput
                  label="Portret URL"
                  onChange={(e) => setPortraitUrl(e.currentTarget.value)}
                  value={portraitUrl}
                />
                {template?.fields.map((field) =>
                  field.type === "textarea" ? (
                    <Textarea
                      key={field.key}
                      autosize
                      label={field.label}
                      maxRows={8}
                      minRows={2}
                      onChange={(e) =>
                        setFieldValues((prev) => ({ ...prev, [field.key]: e.currentTarget.value }))
                      }
                      value={fieldValues[field.key] ?? ""}
                    />
                  ) : (
                    <TextInput
                      key={field.key}
                      label={field.label}
                      onChange={(e) =>
                        setFieldValues((prev) => ({ ...prev, [field.key]: e.currentTarget.value }))
                      }
                      type={field.type === "number" ? "number" : "text"}
                      value={fieldValues[field.key] ?? ""}
                    />
                  )
                )}
                {saveError ? (
                  <Text c="red" size="sm">
                    {saveError}
                  </Text>
                ) : null}
                <Divider />
                <Group justify="flex-end">
                  <Button loading={isPending} onClick={save}>
                    Zapisz
                  </Button>
                </Group>
              </Stack>
            </Paper>

            {worldLinkSections.map((section) => (
              <EntityLinksSection
                key={section.title}
                allItems={section.allItems}
                campaignId={campaignId}
                entityId={entry.id}
                entityType="world_entry"
                linkedItems={section.linkedItems}
                targetType="world_entry"
                title={section.title}
              />
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="threads" pb="xl" pt="md" px="lg">
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
            <WorldEntryThreadsTab
              allQuests={allQuests}
              campaignId={campaignId}
              entryId={entry.id}
              linkedQuestIds={linkedQuests.map((q) => q.id)}
            />
            <EntityLinksSection
              allItems={allQuests}
              campaignId={campaignId}
              entityId={entry.id}
              entityType="world_entry"
              linkedItems={linkedQuests}
              targetType="quest"
              title="Zarządzaj połączeniami"
            />
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="player-infos" pb="xl" pt="md" px="lg">
          <Divider mb="md" />
          <PlayerInfosSection
            campaignCharacters={campaignCharacters}
            campaignId={campaignId}
            entityRef={{ type: "world_entry", id: entry.id }}
          />
        </Tabs.Panel>

        <Tabs.Panel value="sessions" pb="xl" pt="md" px="lg">
          <SessionOccurrencesSection occurrences={occurrences} />
        </Tabs.Panel>

        {collection.template_key === "npc" ? (
          <Tabs.Panel value="configurator" pb="xl" pt="md" px="lg">
            <CharacterConfiguratorTab
              campaignId={campaignId}
              config={characterConfig}
              worldEntryId={entry.id}
            />
          </Tabs.Panel>
        ) : null}
      </Tabs>
    </Stack>
  );
}
