"use client";

import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  Group,
  Image,
  Modal,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition, type FormEvent } from "react";

import { createNpc } from "@/app/(app)/campaign/[id]/npcs/actions";
import { PlayerInfosSection } from "@/components/campaign/player-infos-section";

export type NpcListItem = {
  id: string;
  name: string;
  description: string | null;
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

type NpcRosterPageProps = {
  campaignId: string;
  canAddNpc: boolean;
  campaignCharacters: { id: string; name: string }[];
  npcs: NpcListItem[];
  emptyMessage: string;
  errorMessage?: string | null;
};

export function NpcRosterPage({
  campaignId,
  canAddNpc,
  campaignCharacters,
  npcs,
  emptyMessage,
  errorMessage
}: NpcRosterPageProps) {
  const portraitColWidth = 112;
  const portraitHeight = 136;
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Details drawer
  const [detailsNpc, setDetailsNpc] = useState<NpcListItem | null>(null);
  const [detailsTab, setDetailsTab] = useState<string>("info");
  const [detailsName, setDetailsName] = useState("");
  const [detailsDescription, setDetailsDescription] = useState("");

  const openDetails = useCallback((npc: NpcListItem) => {
    setDetailsNpc(npc);
    setDetailsName(npc.name);
    setDetailsDescription(npc.description ?? "");
    setDetailsTab("info");
  }, []);

  const closeDetails = useCallback(() => setDetailsNpc(null), []);

  const onAddSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      setFormError(null);
      startTransition(async () => {
        const result = await createNpc(fd);
        if (result.error) {
          setFormError(result.error);
          return;
        }
        form.reset();
        closeAdd();
        router.refresh();
      });
    },
    [closeAdd, router]
  );

  return (
    <Container pb="xl" pt="md" size="md">
      <Stack gap="lg">
        <Group align="flex-start" justify="space-between" wrap="nowrap">
          <Title order={2}>NPC</Title>
          {canAddNpc ? (
            <Button onClick={openAdd} size="sm" variant="light">
              Dodaj NPC
            </Button>
          ) : null}
        </Group>

        {/* Add NPC modal */}
        <Modal
          centered
          onClose={() => {
            setFormError(null);
            closeAdd();
          }}
          opened={addOpened}
          title="Nowy NPC"
        >
          <form onSubmit={onAddSubmit}>
            <input name="campaignId" type="hidden" value={campaignId} />
            <Stack gap="md">
              <TextInput label="Nazwa" name="name" placeholder="np. Karczmarka Magda" required withAsterisk />
              <TextInput description="Opcjonalnie" label="Poziom" name="level" placeholder="np. 5" type="number" />
              <Textarea autosize label="Opis" maxRows={6} minRows={3} name="description" placeholder="Krótki opis dla listy i notatek." />
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

        {/* Details drawer */}
        <Drawer
          onClose={closeDetails}
          opened={detailsNpc !== null}
          padding="lg"
          position="right"
          size="md"
          title={detailsNpc?.name ?? "Szczegóły NPC"}
        >
          {detailsNpc ? (
            <Tabs value={detailsTab} onChange={(v) => setDetailsTab(v ?? "info")}>
              <Tabs.List>
                <Tabs.Tab value="info">Info</Tabs.Tab>
                <Tabs.Tab value="player-infos">Informacje dla graczy</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="info" pt="md">
                <Stack gap="md">
                  <Group gap="md" wrap="nowrap">
                    {detailsNpc.portrait_url ? (
                      <Image
                        alt=""
                        fit="cover"
                        h={80}
                        radius="md"
                        src={detailsNpc.portrait_url}
                        w={64}
                      />
                    ) : (
                      <Avatar color="gray" radius="md" size="lg">
                        {initials(detailsNpc.name)}
                      </Avatar>
                    )}
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text fw={600} size="lg">{detailsNpc.name}</Text>
                      {detailsNpc.level != null ? (
                        <Text c="dimmed" size="sm">Poziom {detailsNpc.level}</Text>
                      ) : null}
                    </Stack>
                  </Group>
                  <Divider />
                  <TextInput
                    label="Nazwa"
                    onChange={(e) => setDetailsName(e.currentTarget.value)}
                    value={detailsName}
                  />
                  <Textarea
                    autosize
                    label="Opis"
                    maxRows={8}
                    minRows={3}
                    onChange={(e) => setDetailsDescription(e.currentTarget.value)}
                    value={detailsDescription}
                  />
                  <Text c="dimmed" size="xs">
                    Edycja opisu — zapis przez odświeżenie strony (wkrótce auto-save).
                  </Text>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="player-infos" pt="md">
                <PlayerInfosSection
                  campaignId={campaignId}
                  campaignCharacters={campaignCharacters}
                  entityRef={{ type: "npc", id: detailsNpc.id }}
                />
              </Tabs.Panel>
            </Tabs>
          ) : null}
        </Drawer>

        {/* NPC list */}
        {errorMessage ? (
          <Text c="red" size="sm">
            {errorMessage}
          </Text>
        ) : npcs.length === 0 ? (
          <Text c="dimmed" size="sm">
            {emptyMessage}
          </Text>
        ) : (
          <Stack gap="md">
            {npcs.map((n) => (
              <Paper
                key={n.id}
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
                    {n.portrait_url ? (
                      <Image
                        alt=""
                        fit="cover"
                        h={portraitHeight}
                        radius="md"
                        src={n.portrait_url}
                        w={portraitColWidth}
                      />
                    ) : (
                      <Avatar
                        color="gray"
                        h={portraitHeight}
                        radius="md"
                        styles={{ root: { width: "100%", height: "100%" } }}
                        w={portraitColWidth}
                      >
                        {initials(n.name)}
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
                      {n.name}
                    </Title>
                    <Text c="dimmed" size="sm">
                      {n.level != null ? `Poziom ${n.level}` : "—"}
                    </Text>
                    {n.description ? (
                      <Text c="dimmed" lineClamp={3} size="sm">
                        {n.description}
                      </Text>
                    ) : null}
                    <Group gap="xs" mt="xs">
                      <Button onClick={() => openDetails(n)} size="compact-sm" variant="light">
                        Szczegóły
                      </Button>
                      <Tooltip label="Wkrótce">
                        <Button disabled size="compact-sm" variant="light">
                          Notatki MG
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
