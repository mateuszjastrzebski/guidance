"use client";

import {
  Button,
  Container,
  Divider,
  Group,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateLocation } from "@/app/(app)/campaign/[id]/locations/actions";
import { BackButton } from "@/components/campaign/back-button";
import { PlayerInfosSection } from "@/components/campaign/player-infos-section";

type LocationDetailPageProps = {
  campaignId: string;
  campaignCharacters: { id: string; name: string }[];
  location: {
    id: string;
    name: string;
    description: string | null;
  };
};

export function LocationDetailPage({
  campaignId,
  campaignCharacters,
  location
}: LocationDetailPageProps) {
  const router = useRouter();
  const [name, setName] = useState(location.name);
  const [description, setDescription] = useState(location.description ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setSaveError(null);
    startTransition(async () => {
      const result = await updateLocation(location.id, campaignId, {
        name: name.trim() || location.name,
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

        <Title order={2}>{location.name}</Title>

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
              entityRef={{ type: "location", id: location.id }}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
