"use client";

import {
  Avatar,
  Box,
  Button,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition, type FormEvent } from "react";

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
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onAddSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const name = String(fd.get("name") ?? "").trim();
      const descriptionRaw = String(fd.get("description") ?? "").trim();
      const description = descriptionRaw.length > 0 ? descriptionRaw : null;
      setFormError(null);
      startTransition(async () => {
        const result = await createQuestForBoard(campaignId, name || undefined, description);
        if (!result.ok) {
          setFormError(result.error);
          return;
        }
        form.reset();
        closeAdd();
        router.refresh();
      });
    },
    [campaignId, closeAdd, router]
  );

  return (
    <Container pb="xl" pt="md" size="md">
      <Stack gap="lg">
        <Group align="flex-start" justify="space-between" wrap="nowrap">
          <Title order={2}>Wątki</Title>
          {canAddThread ? (
            <Button onClick={openAdd} size="sm" variant="light">
              Dodaj wątek
            </Button>
          ) : null}
        </Group>

        <Modal
          centered
          onClose={() => {
            setFormError(null);
            closeAdd();
          }}
          opened={addOpened}
          title="Nowy wątek"
        >
          <form onSubmit={onAddSubmit}>
            <Stack gap="md">
              <TextInput label="Nazwa" name="name" placeholder="np. Spisek w dokach" required withAsterisk />
              <Textarea
                autosize
                label="Opis"
                maxRows={6}
                minRows={3}
                name="description"
                placeholder="Opcjonalnie — notatka przy wątku."
              />
              {formError ? (
                <Text c="red" size="sm">
                  {formError}
                </Text>
              ) : null}
              <Group justify="flex-end" mt="xs">
                <Button
                  onClick={() => {
                    setFormError(null);
                    closeAdd();
                  }}
                  type="button"
                  variant="default"
                >
                  Anuluj
                </Button>
                <Button loading={isPending} type="submit">
                  Utwórz
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

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
                      <Group gap="xs" mt="xs">
                        <Button
                          component={Link}
                          href={`/campaign/${campaignId}/quests/${t.id}` as Route}
                          prefetch
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
              );
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
