"use client";

import {
  Button,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition, type FormEvent } from "react";

import { createLocation } from "@/app/(app)/campaign/[id]/locations/actions";

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
  campaignCharacters: _campaignCharacters,
  locations,
  emptyMessage,
  errorMessage
}: LocationRosterPageProps) {
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
                    <Button
                      component={Link}
                      href={`/campaign/${campaignId}/locations/${loc.id}` as Route}
                      size="compact-sm"
                      variant="light"
                    >
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
