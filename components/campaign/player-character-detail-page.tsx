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
  TextInput
} from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { updatePlayerCharacter } from "@/app/(app)/campaign/[id]/player-characters/actions";
import { CHARACTER_NAMES } from "@/lib/random-names";
import { BackButton } from "@/components/campaign/back-button";
import { EditableEntityTitle } from "@/components/campaign/editable-entity-title";
import { EntityLinksSection } from "@/components/campaign/entity-links-section";
import type { LinkedItem } from "@/lib/entity-links";

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

type PlayerCharacterDetailPageProps = {
  campaignId: string;
  character: { id: string; name: string; level: number | null; portrait_url: string | null };
  worldLinkSections: WorldLinksSection[];
};


export function PlayerCharacterDetailPage({
  campaignId,
  character,
  worldLinkSections
}: PlayerCharacterDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nameRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState(character.name);
  const [levelRaw, setLevelRaw] = useState(character.level != null ? String(character.level) : "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [searchParams]);

  const saveNameOnBlur = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === character.name) return;
    startTransition(async () => {
      await updatePlayerCharacter(character.id, campaignId, { name: trimmed });
      router.refresh();
    });
  };

  const saveLevel = () => {
    setSaveError(null);
    const levelNum = levelRaw.trim() ? Number(levelRaw.trim()) : null;
    if (
      levelRaw.trim() &&
      (!Number.isFinite(levelNum) || !Number.isInteger(levelNum) || levelNum! < 1)
    ) {
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
    <Stack gap={0} pb="xl">
      <Box pb="sm" pt="md" px="lg">
        <Group align="flex-start" gap="xs">
          <BackButton />
          <Group align="flex-start" gap="md" wrap="nowrap" style={{ flex: 1 }}>
            {character.portrait_url ? (
              <Image alt="" fit="cover" h={40} radius="sm" src={character.portrait_url} w={30} style={{ flexShrink: 0, marginTop: 4 }} />
            ) : (
              <Avatar color="grape" radius="sm" size="md" style={{ flexShrink: 0, marginTop: 4 }}>
                {initials(name || character.name)}
              </Avatar>
            )}
            <Stack gap={2} style={{ flex: 1 }}>
              <EditableEntityTitle
                onBlur={saveNameOnBlur}
                onChange={setName}
                randomNames={CHARACTER_NAMES}
                ref={nameRef}
                value={name}
              />
              {character.level != null ? (
                <Text c="dimmed" size="sm">
                  Poziom {character.level}
                </Text>
              ) : null}
            </Stack>
          </Group>
        </Group>
      </Box>

      <Tabs defaultValue="info">
        <Box px="lg">
          <Tabs.List>
            <Tabs.Tab value="info">Info</Tabs.Tab>
          </Tabs.List>
        </Box>

        <Tabs.Panel value="info" pb="xl" pt="md" px="lg">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Stack gap="md">
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
                  <Button loading={isPending} onClick={saveLevel} variant="filled">
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
                entityId={character.id}
                entityType="character"
                linkedItems={section.linkedItems}
                targetType="world_entry"
                title={section.title}
              />
            ))}
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
