"use client";

import { Badge, Button, Container, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createWorldCollectionFromTemplate } from "@/app/(app)/campaign/[id]/world/actions";
import { getWorldIcon } from "@/lib/world-icons";
import {
  WORLD_TEMPLATE_DEFINITIONS,
  type WorldTemplateDefinition,
  type WorldTemplateKey
} from "@/lib/world";

type WorldTemplatePickerPageProps = {
  campaignId: string;
  canManage: boolean;
  existingCollections: { id: string; slug: string; pluralName: string; templateKey: string }[];
};

const TEMPLATE_ORDER: WorldTemplateKey[] = ["npc", "location", "organization"];

export function WorldTemplatePickerPage({
  campaignId,
  canManage,
  existingCollections
}: WorldTemplatePickerPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<WorldTemplateKey | null>(null);
  const [isPending, startTransition] = useTransition();

  const templates = TEMPLATE_ORDER.map((key) => WORLD_TEMPLATE_DEFINITIONS[key]);

  const handleCreate = (template: WorldTemplateDefinition) => {
    setError(null);
    setPendingKey(template.templateKey);
    startTransition(async () => {
      const result = await createWorldCollectionFromTemplate(campaignId, template.templateKey);
      if (!result.ok) {
        setError(result.error);
        setPendingKey(null);
        return;
      }
      router.push(`/campaign/${campaignId}/world/${result.slug}`);
      router.refresh();
    });
  };

  return (
    <Container pb="xl" pt="md" size="lg">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2}>Dodaj kolekcję świata</Title>
          <Text c="dimmed" size="sm">
            Wybierz predefiniowany typ, a system od razu utworzy nową sekcję w świecie kampanii.
          </Text>
        </Stack>

        {error ? (
          <Text c="red" size="sm">
            {error}
          </Text>
        ) : null}

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {templates.map((template) => {
            const Icon = getWorldIcon(template.icon);
            const existingCollection = existingCollections.find(
              (collection) => collection.templateKey === template.templateKey
            );
            return (
              <Paper key={template.templateKey} p="lg" radius="md" withBorder>
                <Stack gap="md" h="100%" justify="space-between">
                  <Stack gap="xs">
                    <Group gap="sm" justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                      <Icon size={22} stroke={1.8} />
                      <Title order={4}>{template.pluralName}</Title>
                      </Group>
                      {existingCollection ? (
                        <Badge color="teal" variant="light">
                          Dodane
                        </Badge>
                      ) : null}
                    </Group>
                    <Text c="dimmed" size="sm">
                      {template.description}
                    </Text>
                    {existingCollection ? (
                      <Text size="sm">
                        Już istnieje jako:{" "}
                        <Text component={Link} href={`/campaign/${campaignId}/world/${existingCollection.slug}` as Route} span>
                          {existingCollection.pluralName}
                        </Text>
                      </Text>
                    ) : null}
                  </Stack>

                  {existingCollection ? (
                    <Button
                      component={Link}
                      href={`/campaign/${campaignId}/world/${existingCollection.slug}` as Route}
                      variant="default"
                    >
                      Otwórz kolekcję
                    </Button>
                  ) : (
                    <Button
                      disabled={!canManage}
                      loading={isPending && pendingKey === template.templateKey}
                      onClick={() => handleCreate(template)}
                      variant="light"
                    >
                      Dodaj {template.singularName.toLowerCase()}
                    </Button>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>

        {existingCollections.length > 0 ? (
          <Paper p="lg" radius="md" withBorder>
            <Stack gap="sm">
              <Title order={4}>Już dodane kolekcje</Title>
              <Stack gap="xs">
                {existingCollections.map((collection) => (
                  <Group key={collection.id} justify="space-between" wrap="nowrap">
                    <Text>{collection.pluralName}</Text>
                    <Button
                      component={Link}
                      href={`/campaign/${campaignId}/world/${collection.slug}` as Route}
                      size="compact-sm"
                      variant="subtle"
                    >
                      Otwórz
                    </Button>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Container>
  );
}
