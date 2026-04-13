"use client";

import {
  Avatar,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Stack,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updatePlayerCharacter } from "@/app/(app)/campaign/[id]/player-characters/actions";
import { BackButton } from "@/components/campaign/back-button";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type PlayerCharacterDetailPageProps = {
  campaignId: string;
  character: {
    id: string;
    name: string;
    level: number | null;
    portrait_url: string | null;
  };
};

export function PlayerCharacterDetailPage({
  campaignId,
  character
}: PlayerCharacterDetailPageProps) {
  const router = useRouter();
  const [name, setName] = useState(character.name);
  const [levelRaw, setLevelRaw] = useState(character.level != null ? String(character.level) : "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setSaveError(null);
    const levelNum = levelRaw.trim() ? Number(levelRaw.trim()) : null;
    if (levelRaw.trim() && (!Number.isFinite(levelNum) || !Number.isInteger(levelNum) || levelNum! < 1)) {
      setSaveError("Poziom musi być dodatnią liczbą całkowitą.");
      return;
    }
    startTransition(async () => {
      const result = await updatePlayerCharacter(character.id, campaignId, {
        name: name.trim() || character.name,
        level: levelNum
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
          {character.portrait_url ? (
            <Image
              alt=""
              fit="cover"
              h={96}
              radius="md"
              src={character.portrait_url}
              w={72}
            />
          ) : (
            <Avatar color="grape" radius="md" size="xl">
              {initials(character.name)}
            </Avatar>
          )}
          <Stack gap={4}>
            <Title order={2}>{character.name}</Title>
            {character.level != null ? (
              <Text c="dimmed" size="sm">
                Poziom {character.level}
              </Text>
            ) : null}
          </Stack>
        </Group>

        <Stack gap="md">
          <TextInput
            label="Nazwa"
            onChange={(e) => setName(e.currentTarget.value)}
            value={name}
          />
          <TextInput
            description="Opcjonalnie"
            label="Poziom"
            onChange={(e) => setLevelRaw(e.currentTarget.value)}
            placeholder="np. 5"
            type="number"
            value={levelRaw}
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
      </Stack>
    </Container>
  );
}
