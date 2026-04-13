"use client";

import {
  Avatar,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateNpc } from "@/app/(app)/campaign/[id]/npcs/actions";
import { BackButton } from "@/components/campaign/back-button";
import { PlayerInfosSection } from "@/components/campaign/player-infos-section";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type NpcDetailPageProps = {
  campaignId: string;
  campaignCharacters: { id: string; name: string }[];
  npc: {
    id: string;
    name: string;
    description: string | null;
    level: number | null;
    portrait_url: string | null;
  };
};

export function NpcDetailPage({ campaignId, campaignCharacters, npc }: NpcDetailPageProps) {
  const router = useRouter();
  const [name, setName] = useState(npc.name);
  const [description, setDescription] = useState(npc.description ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setSaveError(null);
    startTransition(async () => {
      const result = await updateNpc(npc.id, campaignId, {
        name: name.trim() || npc.name,
        description: description.trim() || null
      });
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Container pb="xl" pt="md" size="sm">
      <Stack gap="md">
        <BackButton label="Wróć" />

        <Group gap="md" wrap="nowrap">
          {npc.portrait_url ? (
            <Image
              alt=""
              fit="cover"
              h={96}
              radius="md"
              src={npc.portrait_url}
              w={72}
            />
          ) : (
            <Avatar color="gray" radius="md" size="xl">
              {initials(npc.name)}
            </Avatar>
          )}
          <Stack gap={4}>
            <Title order={2}>{npc.name}</Title>
            {npc.level != null ? (
              <Text c="dimmed" size="sm">
                Poziom {npc.level}
              </Text>
            ) : null}
          </Stack>
        </Group>

        <Tabs defaultValue="info">
          <Tabs.List>
            <Tabs.Tab value="info">Info</Tabs.Tab>
            <Tabs.Tab value="player-infos">Informacje dla graczy</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="info" pt="md">
            <Stack gap="md">
              <TextInput
                label="Nazwa"
                onChange={(e) => setName(e.currentTarget.value)}
                value={name}
              />
              <Textarea
                autosize
                label="Opis"
                maxRows={12}
                minRows={4}
                onChange={(e) => setDescription(e.currentTarget.value)}
                value={description}
              />
              {saveError ? (
                <Text c="red" size="sm">
                  {saveError}
                </Text>
              ) : null}
              <Divider />
              <Group justify="flex-end">
                <Button loading={isPending} onClick={save} variant="filled">
                  Zapisz
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="player-infos" pt="md">
            <Divider mb="md" />
            <PlayerInfosSection
              campaignId={campaignId}
              campaignCharacters={campaignCharacters}
              entityRef={{ type: "npc", id: npc.id }}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
