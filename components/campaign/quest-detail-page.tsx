"use client";

import { Box, Divider, Group, Paper, SimpleGrid, Stack, Tabs, Text, Title } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { updateQuestForBoard } from "@/app/(app)/campaign/[id]/board/quests-actions";
import { QUEST_NAMES } from "@/lib/random-names";
import { BackButton } from "@/components/campaign/back-button";
import { EditableEntityTitle } from "@/components/campaign/editable-entity-title";
import { EntityLinksSection } from "@/components/campaign/entity-links-section";
import { PlayerInfosSection } from "@/components/campaign/player-infos-section";
import { QuestEventsTab } from "@/components/campaign/quest-events-tab";
import type { LinkedItem } from "@/lib/entity-links";

type NamedItem = { id: string; name: string };
type WorldLinksSection = {
  title: string;
  allItems: NamedItem[];
  linkedItems: LinkedItem[];
};

type QuestDetailPageProps = {
  campaignId: string;
  campaignCharacters: NamedItem[];
  npcOptions: NamedItem[];
  locationOptions: NamedItem[];
  quest: { id: string; name: string; description: string | null; status: string };
  worldLinkSections: WorldLinksSection[];
};

const QUEST_STATUS_LABEL: Record<string, string> = {
  active: "Aktywny",
  completed: "Zakończony",
  suspended: "Wstrzymany"
};


export function QuestDetailPage({
  campaignId,
  campaignCharacters,
  npcOptions,
  locationOptions,
  quest,
  worldLinkSections
}: QuestDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nameRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState(quest.name);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [searchParams]);

  const saveNameOnBlur = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === quest.name) return;
    startTransition(async () => {
      await updateQuestForBoard(campaignId, quest.id, {
        name: trimmed,
        description: quest.description
      });
      router.refresh();
    });
  };

  return (
    <Stack gap={0} pb="xl">
      <Box pb="sm" pt="md" px="lg">
        <Group align="flex-start" gap="xs">
          <BackButton />
          <Stack gap={2} style={{ flex: 1 }}>
            <EditableEntityTitle
              onBlur={saveNameOnBlur}
              onChange={setName}
              randomNames={QUEST_NAMES}
              ref={nameRef}
              value={name}
            />
            <Text c="dimmed" size="sm">
              Status: {QUEST_STATUS_LABEL[quest.status] ?? quest.status}
            </Text>
          </Stack>
        </Group>
      </Box>

      <Tabs defaultValue="info">
        <Box px="lg">
          <Tabs.List>
            <Tabs.Tab value="info">Info</Tabs.Tab>
            <Tabs.Tab value="events">Zdarzenia</Tabs.Tab>
            <Tabs.Tab value="player-infos">Informacje dla graczy</Tabs.Tab>
          </Tabs.List>
        </Box>

        <Tabs.Panel value="info" pb="xl" pt="md" px="lg">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Title order={5}>Opis</Title>
                {quest.description ? (
                  <Text style={{ whiteSpace: "pre-wrap" }}>{quest.description}</Text>
                ) : (
                  <Text c="dimmed">Brak opisu.</Text>
                )}
              </Stack>
            </Paper>

            {worldLinkSections.map((section) => (
              <EntityLinksSection
                key={section.title}
                allItems={section.allItems}
                campaignId={campaignId}
                entityId={quest.id}
                entityType="quest"
                linkedItems={section.linkedItems}
                targetType="world_entry"
                title={section.title}
              />
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="events" pb="xl" pt="md" px="lg">
          <QuestEventsTab
            campaignId={campaignId}
            questId={quest.id}
            npcOptions={npcOptions}
            locationOptions={locationOptions}
          />
        </Tabs.Panel>

        <Tabs.Panel value="player-infos" pb="xl" pt="md" px="lg">
          <Divider mb="md" />
          <PlayerInfosSection
            campaignId={campaignId}
            campaignCharacters={campaignCharacters}
            entityRef={{ type: "quest", id: quest.id }}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
