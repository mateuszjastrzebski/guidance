"use client";

import {
  Button,
  Container,
  Divider,
  Drawer,
  Group,
  Modal,
  Paper,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition, type FormEvent } from "react";

import { createLocation, updateLocation } from "@/app/(app)/campaign/[id]/locations/actions";
import { PlayerInfosSection } from "@/components/campaign/player-infos-section";

export type LocationListItem = {
  id: string;
  name: string;
  description: string | null;
};

type LocationRosterPageProps = {
  campaignId: string;
  canAdd: boolean;
  campaignCharacters: { id: string; name: string }[];
  locations: LocationListItem[];
  emptyMessage: string;
  errorMessage?: string | null;
};

export function LocationRosterPage({
  campaignId,
  canAdd,
  campaignCharacters,
  locations,
  emptyMessage,
  errorMessage
}: LocationRosterPageProps) {
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Details drawer
  const [detailsLocation, setDetailsLocation] = useState<LocationListItem | null>(null);
  const [detailsTab, setDetailsTab] = useState<string>("info");
  const [detailsName, setDetailsName] = useState("");
  const [detailsDescription, setDetailsDescription] = useState("");
  const [detailsSaving, setDetailsSaving] = useState(false);

  const openDetails = useCallback((loc: LocationListItem) => {
    setDetailsLocation(loc);
    setDetailsName(loc.name);
    setDetailsDescription(loc.description ?? "");
    setDetailsTab("info");
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsLocation(null);
  }, []);

  const saveDetails = useCallback(async () => {
    if (!detailsLocation) return;
    setDetailsSaving(true);
    await updateLocation(detailsLocation.id, campaignId, {
      name: detailsName.trim() || detailsLocation.name,
      description: detailsDescription.trim() || null
    });
    setDetailsSaving(false);
    router.refresh();
  }, [detailsLocation, campaignId, detailsName, detailsDescription, router]);

  const onAddSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      setFormError(null);
      startTransition(async () => {
        const result = await createLocation(fd);
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
          <Title order={2}>Miejsca</Title>
          {canAdd ? (
            <Button onClick={openAdd} size="sm" variant="light">
              Dodaj lokację
            </Button>
          ) : null}
        </Group>

        {/* Add location modal */}
        <Modal
          centered
          onClose={() => {
            setFormError(null);
            closeAdd();
          }}
          opened={addOpened}
          title="Nowa lokacja"
        >
          <form onSubmit={onAddSubmit}>
            <input name="campaignId" type="hidden" value={campaignId} />
            <Stack gap="md">
              <TextInput
                label="Nazwa"
                name="name"
                placeholder="np. Gospoda Złoty Róg"
                required
                withAsterisk
              />
              <Textarea
                autosize
                label="Opis"
                maxRows={6}
                minRows={3}
                name="description"
                placeholder="Krótki opis lokacji."
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

        {/* Details drawer */}
        <Drawer
          onClose={closeDetails}
          opened={detailsLocation !== null}
          padding="lg"
          position="right"
          size="md"
          title={detailsLocation?.name ?? "Szczegóły lokacji"}
        >
          {detailsLocation ? (
            <Tabs value={detailsTab} onChange={(v) => setDetailsTab(v ?? "info")}>
              <Tabs.List>
                <Tabs.Tab value="info">Info</Tabs.Tab>
                <Tabs.Tab value="player-infos">Informacje dla graczy</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="info" pt="md">
                <Stack gap="md">
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
                  <Divider />
                  <Group justify="flex-end">
                    <Button loading={detailsSaving} onClick={saveDetails} variant="filled">
                      Zapisz
                    </Button>
                  </Group>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="player-infos" pt="md">
                <PlayerInfosSection
                  campaignId={campaignId}
                  campaignCharacters={campaignCharacters}
                  entityRef={{ type: "location", id: detailsLocation.id }}
                />
              </Tabs.Panel>
            </Tabs>
          ) : null}
        </Drawer>

        {/* Location list */}
        {errorMessage ? (
          <Text c="red" size="sm">
            {errorMessage}
          </Text>
        ) : locations.length === 0 ? (
          <Text c="dimmed" size="sm">
            {emptyMessage}
          </Text>
        ) : (
          <Stack gap="md">
            {locations.map((loc) => (
              <Paper key={loc.id} p="md" radius="md" withBorder>
                <Stack gap="xs">
                  <Title lineClamp={2} order={3}>
                    {loc.name}
                  </Title>
                  {loc.description ? (
                    <Text c="dimmed" lineClamp={3} size="sm">
                      {loc.description}
                    </Text>
                  ) : null}
                  <Group gap="xs" mt="xs">
                    <Button onClick={() => openDetails(loc)} size="compact-sm" variant="light">
                      Szczegóły
                    </Button>
                    <Tooltip label="Wkrótce">
                      <Button disabled size="compact-sm" variant="light">
                        Notatki MG
                      </Button>
                    </Tooltip>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
