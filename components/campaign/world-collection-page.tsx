"use client";

import {
  ActionIcon,
  Button,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  createWorldEntry,
  updateWorldCollectionSettings
} from "@/app/(app)/campaign/[id]/world/actions";
import { getWorldTemplateDefinition, slugifyWorldName, type WorldCollection, type WorldEntry } from "@/lib/world";

type WorldCollectionPageProps = {
  campaignId: string;
  canManage: boolean;
  collection: WorldCollection;
  entries: WorldEntry[];
};

export function WorldCollectionPage({
  campaignId,
  canManage,
  collection,
  entries
}: WorldCollectionPageProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [pluralName, setPluralName] = useState(collection.plural_name);
  const [singularName, setSingularName] = useState(collection.singular_name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [icon, setIcon] = useState(collection.icon ?? "");
  const [slug, setSlug] = useState(collection.slug);
  const [slugLocked, setSlugLocked] = useState(collection.slug_locked);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [isPending, startTransition] = useTransition();
  const template = getWorldTemplateDefinition(collection.template_key);

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => entry.name.toLowerCase().includes(query.trim().toLowerCase())),
    [entries, query]
  );

  useEffect(() => {
    if (!slugLocked) {
      setSlug(slugifyWorldName(pluralName));
    }
  }, [pluralName, slugLocked]);

  const saveSettings = async () => {
    setSettingsError(null);
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        const result = await updateWorldCollectionSettings(campaignId, collection.id, {
          singularName: singularName.trim() || collection.singular_name,
          pluralName: pluralName.trim() || collection.plural_name,
          slug: slug.trim() || slugifyWorldName(pluralName),
          icon,
          description,
          slugLocked
        });
        if (!result.ok) {
          setSettingsError(result.error);
          resolve(false);
          return;
        }
        if (result.slug !== collection.slug) {
          router.push(`/campaign/${campaignId}/world/${result.slug}`);
        }
        router.refresh();
        resolve(true);
      });
    });
  };

  const handleAdd = () => {
    startTransition(async () => {
      const result = await createWorldEntry(campaignId, collection, {
        name: `Nowy ${collection.singular_name.toLowerCase()}`
      });
      if (!result.ok) return;
      router.push(`/campaign/${campaignId}/world/${collection.slug}/${result.entryId}?new=1` as Route);
    });
  };

  return (
    <Container pb="xl" pt="md" size="lg">
      <Stack gap="lg">
        <Group align="flex-start" justify="space-between" wrap="nowrap">
          <Stack gap={4}>
            <Title order={2}>{collection.plural_name}</Title>
            {collection.description ? (
              <Text c="dimmed" size="sm">
                {collection.description}
              </Text>
            ) : null}
          </Stack>
          {canManage ? (
            <Group gap="xs" wrap="nowrap">
              <ActionIcon
                aria-label={`Ustawienia kolekcji ${collection.plural_name}`}
                onClick={() => setSettingsOpened(true)}
                size="lg"
                variant="subtle"
              >
                <IconSettings size={18} />
              </ActionIcon>
              <Button loading={isPending} onClick={handleAdd} variant="light">
                Dodaj {collection.singular_name.toLowerCase()}
              </Button>
            </Group>
          ) : null}
        </Group>

        <Stack gap="md">
          <TextInput
            maw={360}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder={`Szukaj ${collection.plural_name.toLowerCase()}...`}
            value={query}
          />

          {filteredEntries.length === 0 ? (
            <Text c="dimmed" size="sm">
              Brak wpisów w kolekcji {collection.plural_name.toLowerCase()}.
            </Text>
          ) : (
            <Stack gap="sm">
              {filteredEntries.map((entry) => (
                <Paper
                  key={entry.id}
                  component={Link}
                  href={`/campaign/${campaignId}/world/${collection.slug}/${entry.id}` as Route}
                  p="md"
                  radius="md"
                  withBorder
                  style={{ display: "block", textDecoration: "none", color: "inherit", cursor: "pointer" }}
                >
                  <Stack gap="xs">
                    <Title order={5}>{entry.name}</Title>
                    {entry.summary ? (
                      <Text c="dimmed" size="sm">
                        {entry.summary}
                      </Text>
                    ) : null}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>

      <Modal
        centered
        onClose={() => setSettingsOpened(false)}
        opened={settingsOpened}
        title={`Ustawienia: ${collection.plural_name}`}
      >
        <Stack gap="md">
          <TextInput
            label="Nazwa pojedyncza"
            onChange={(e) => setSingularName(e.currentTarget.value)}
            value={singularName}
          />
          <TextInput
            label="Nazwa mnoga"
            onChange={(e) => setPluralName(e.currentTarget.value)}
            value={pluralName}
          />
          <TextInput
            label="Adres"
            onChange={(e) => {
              setSlugLocked(true);
              setSlug(e.currentTarget.value);
            }}
            value={slug}
          />
          <TextInput
            description="np. users, map-pin, building-bank"
            label="Ikona"
            onChange={(e) => setIcon(e.currentTarget.value)}
            value={icon}
          />
          <Textarea
            autosize
            label="Opis"
            maxRows={6}
            minRows={2}
            onChange={(e) => setDescription(e.currentTarget.value)}
            value={description}
          />
          {settingsError ? (
            <Text c="red" size="sm">
              {settingsError}
            </Text>
          ) : null}
          <Group justify="flex-end">
            <Button type="button" variant="default" onClick={() => setSettingsOpened(false)}>
              Zamknij
            </Button>
            <Button
              disabled={!canManage}
              loading={isPending}
              onClick={async () => {
                const ok = await saveSettings();
                if (ok) {
                  setSettingsOpened(false);
                }
              }}
            >
              Zapisz ustawienia
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
