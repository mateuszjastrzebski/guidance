"use client";

import { Container, Divider, Stack, Tabs, Text, Title } from "@mantine/core";

import { BackButton } from "@/components/campaign/back-button";
import { PlayerInfosSection } from "@/components/campaign/player-infos-section";

type QuestDetailPageProps = {
  campaignId: string;
  campaignCharacters: { id: string; name: string }[];
  quest: {
    id: string;
    name: string;
    description: string | null;
    status: string;
  };
};

const QUEST_STATUS_LABEL: Record<string, string> = {
  active: "Aktywny",
  completed: "Zakończony",
  suspended: "Wstrzymany"
};

export function QuestDetailPage({ campaignId, campaignCharacters, quest }: QuestDetailPageProps) {
  return (
    <Container pb="xl" pt="md" size="sm">
      <Stack gap="md">
        <BackButton label="Wróć" />
        <Title order={2}>{quest.name}</Title>
        <Text c="dimmed" size="sm">
          Status: {QUEST_STATUS_LABEL[quest.status] ?? quest.status}
        </Text>

        <Tabs defaultValue="info">
          <Tabs.List>
            <Tabs.Tab value="info">Info</Tabs.Tab>
            <Tabs.Tab value="player-infos">Informacje dla graczy</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="info" pt="md">
            <Stack gap="sm">
              {quest.description ? (
                <Text style={{ whiteSpace: "pre-wrap" }}>{quest.description}</Text>
              ) : (
                <Text c="dimmed">Brak opisu.</Text>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="player-infos" pt="md">
            <Divider mb="md" />
            <PlayerInfosSection
              campaignId={campaignId}
              campaignCharacters={campaignCharacters}
              entityRef={{ type: "quest", id: quest.id }}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
