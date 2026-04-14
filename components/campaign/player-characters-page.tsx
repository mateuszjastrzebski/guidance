"use client";

import {
  Avatar,
  Box,
  Button,
  Container,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip
} from "@mantine/core";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createPlayerCharacter } from "@/app/(app)/campaign/[id]/player-characters/actions";

export type PlayerCharacterListItem = {
  id: string;
  name: string;
  level: number | null;
  portrait_url: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type PlayerCharactersPageProps = {
  campaignId: string;
  canAddCharacter: boolean;
  characters: PlayerCharacterListItem[];
  emptyMessage: string;
  errorMessage?: string | null;
};

export function PlayerCharactersPage({
  campaignId,
  canAddCharacter,
  characters,
  emptyMessage,
  errorMessage
}: PlayerCharactersPageProps) {
  const portraitColWidth = 112;
  const portraitHeight = 136;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      const result = await createPlayerCharacter(campaignId);
      if ("error" in result) return;
      router.push(`/campaign/${campaignId}/player-characters/${result.id}?new=1` as Route);
    });
  };

  return (
    <Container pb="xl" pt="md" size="lg">
      <Stack gap="lg">
        <Group align="flex-start" justify="space-between" wrap="nowrap">
          <Title order={2}>Postacie graczy</Title>
          {canAddCharacter ? (
            <Button loading={isPending} onClick={handleAdd} size="sm" variant="light">
              Dodaj postać
            </Button>
          ) : null}
        </Group>

        {errorMessage ? (
          <Text c="red" size="sm">
            {errorMessage}
          </Text>
        ) : characters.length === 0 ? (
          <Text c="dimmed" size="sm">
            {emptyMessage}
          </Text>
        ) : (
          <Stack gap="md">
            {characters.map((c) => (
              <Paper
                key={c.id}
                p="md"
                radius="md"
                style={{ minHeight: portraitHeight + 24 }}
                withBorder
              >
                <Group align="flex-start" gap="md" wrap="nowrap">
                  <Box
                    style={{
                      flexShrink: 0,
                      width: portraitColWidth,
                      height: portraitHeight,
                      overflow: "hidden",
                      borderRadius: "var(--mantine-radius-md)"
                    }}
                  >
                    {c.portrait_url ? (
                      <Image
                        alt=""
                        fit="cover"
                        h={portraitHeight}
                        radius="md"
                        src={c.portrait_url}
                        w={portraitColWidth}
                      />
                    ) : (
                      <Avatar
                        color="grape"
                        h={portraitHeight}
                        radius="md"
                        styles={{ root: { width: "100%", height: "100%" } }}
                        w={portraitColWidth}
                      >
                        {initials(c.name)}
                      </Avatar>
                    )}
                  </Box>
                  <Stack
                    gap="xs"
                    justify="center"
                    miw={0}
                    style={{ flex: "1 1 0%", minWidth: 0, overflow: "hidden" }}
                  >
                    <Title lineClamp={2} maw="100%" order={3} style={{ overflow: "hidden" }}>
                      {c.name}
                    </Title>
                    <Text c="dimmed" size="sm">
                      {c.level != null ? `Poziom ${c.level}` : "—"}
                    </Text>
                    <Group gap="xs" mt="xs">
                      <Button
                        component={Link}
                        href={`/campaign/${campaignId}/player-characters/${c.id}` as Route}
                        size="compact-sm"
                        variant="light"
                      >
                        Szczegóły
                      </Button>
                      <Tooltip label="Wkrótce">
                        <Button disabled size="compact-sm" variant="light">
                          Notatki
                        </Button>
                      </Tooltip>
                    </Group>
                  </Stack>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
