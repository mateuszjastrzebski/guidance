"use client";

import {
  Avatar,
  Box,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip
} from "@mantine/core";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createQuestForBoard } from "@/app/(app)/campaign/[id]/board/quests-actions";
import { CampaignEntityPortrait, campaignEntityInitials } from "@/components/campaign/campaign-entity-portrait";
import { plannerAccentColorFromThreadId } from "@/types/planner2-react-flow-pilot";

const QUEST_STATUS_LABEL: Record<string, string> = {
  active: "Aktywny",
  completed: "Zakończony",
  suspended: "Wstrzymany"
};

const MINI_PORTRAIT_W = 40;
const MINI_PORTRAIT_H = 48;
const MAX_MINI_VISIBLE = 8;

export type ThreadKeyCastMember = {
  id: string;
  kind: "npc" | "player";
  name: string;
  portrait_url: string | null;
};

export type ThreadListItem = {
  accentColor: string;
  description: string | null;
  id: string;
  keyCast: ThreadKeyCastMember[];
  name: string;
  status: string;
};

type ThreadsRosterPageProps = {
  campaignId: string;
  canAddThread: boolean;
  emptyMessage: string;
  errorMessage?: string | null;
  threads: ThreadListItem[];
};

export function ThreadsRosterPage({
  campaignId,
  canAddThread,
  emptyMessage,
  errorMessage,
  threads
}: ThreadsRosterPageProps) {
  const portraitColWidth = 112;
  const portraitHeight = 136;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      const result = await createQuestForBoard(campaignId);
      if (!result.ok) return;
      router.push(`/campaign/${campaignId}/quests/${result.id}?new=1` as Route);
    });
  };

  return (
    <Container pb="xl" pt="md" size="lg">
      <Stack gap="lg">
        <Group align="flex-start" justify="space-between" wrap="nowrap">
          <Title order={2}>Wątki</Title>
          {canAddThread ? (
            <Button loading={isPending} onClick={handleAdd} size="sm" variant="light">
              Dodaj wątek
            </Button>
          ) : null}
        </Group>

        {errorMessage ? (
          <Text c="red" size="sm">
            {errorMessage}
          </Text>
        ) : threads.length === 0 ? (
          <Text c="dimmed" size="sm">
            {emptyMessage}
          </Text>
        ) : (
          <Stack gap="md">
            {threads.map((t) => {
              const accent = t.accentColor || plannerAccentColorFromThreadId(t.id);
              const visibleCast = t.keyCast.slice(0, MAX_MINI_VISIBLE);
              const overflow = t.keyCast.length - visibleCast.length;
              const namesLine = t.keyCast.map((c) => c.name).join(", ");
              return (
                <Paper
                  key={t.id}
                  p="md"
                  radius="md"
                  style={{ minHeight: portraitHeight + 24, cursor: "pointer" }}
                  withBorder
                  onClick={() => router.push(`/campaign/${campaignId}/quests/${t.id}` as Route)}
                >
                  <Group align="flex-start" gap="md" wrap="nowrap">
                    <Box
                      style={{
                        flexShrink: 0,
                        width: portraitColWidth,
                        height: portraitHeight,
                        overflow: "hidden",
                        borderRadius: "var(--mantine-radius-md)",
                        backgroundColor: accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text c="white" fw={700} px="xs" size="xl" ta="center" style={{ lineHeight: 1.2 }}>
                        {campaignEntityInitials(t.name)}
                      </Text>
                    </Box>
                    <Stack
                      gap="xs"
                      justify="center"
                      miw={0}
                      style={{ flex: "1 1 0%", minWidth: 0, overflow: "hidden" }}
                    >
                      <Title lineClamp={2} maw="100%" order={3} style={{ overflow: "hidden" }}>
                        {t.name}
                      </Title>
                      <Text c="dimmed" size="sm">
                        Status: {QUEST_STATUS_LABEL[t.status] ?? t.status}
                      </Text>
                      {t.description?.trim() ? (
                        <Text c="dimmed" lineClamp={3} size="sm">
                          {t.description}
                        </Text>
                      ) : null}
                      <Stack gap={6}>
                        <Text fw={500} size="sm">
                          Kluczowe postacie
                        </Text>
                        {t.keyCast.length === 0 ? (
                          <Text c="dimmed" size="sm">
                            —
                          </Text>
                        ) : (
                          <>
                            <Group gap="xs" wrap="wrap">
                              {visibleCast.map((c) => (
                                <CampaignEntityPortrait
                                  key={`${c.kind}-${c.id}`}
                                  height={MINI_PORTRAIT_H}
                                  name={c.name}
                                  portrait_url={c.portrait_url}
                                  variant={c.kind === "player" ? "player" : "npc"}
                                  width={MINI_PORTRAIT_W}
                                />
                              ))}
                              {overflow > 0 ? (
                                <Avatar
                                  color="dark"
                                  h={MINI_PORTRAIT_H}
                                  radius="md"
                                  variant="light"
                                  w={MINI_PORTRAIT_W}
                                >
                                  +{overflow}
                                </Avatar>
                              ) : null}
                            </Group>
                            <Tooltip disabled={namesLine.length < 80} label={namesLine} multiline maw={320} withArrow>
                              <Text c="dimmed" lineClamp={2} size="sm">
                                {namesLine}
                              </Text>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
