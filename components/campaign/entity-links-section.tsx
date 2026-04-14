"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Combobox,
  Group,
  Input,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
  useCombobox
} from "@mantine/core";
import { IconFileText, IconPlus, IconX } from "@tabler/icons-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  addEntityLink,
  removeEntityLink,
  type EntityType
} from "@/app/(app)/campaign/[id]/entity-links-actions";
import { createEntityNote, deleteEntityNote } from "@/app/(app)/campaign/[id]/entity-notes-actions";
import type { LinkedItem } from "@/lib/entity-links";
import type { EntityNote } from "@/lib/entity-notes";

type NamedItem = { id: string; name: string };

type EntityLinksSectionProps = {
  title: string;
  campaignId: string;
  /** The entity currently being viewed (becomes the context for any notes added here). */
  entityType: EntityType;
  entityId: string;
  targetType: EntityType;
  linkedItems: LinkedItem[];
  allItems: NamedItem[];
  /**
   * All notes where context_type = entityType AND context_id = entityId.
   * The section filters these further per row (by owner_id = item.id).
   */
  contextNotes?: EntityNote[];
};

export function EntityLinksSection({
  title,
  campaignId,
  entityType,
  entityId,
  targetType,
  linkedItems,
  allItems,
  contextNotes = []
}: EntityLinksSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  // Per-row note state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  });

  const linkedIds = new Set(linkedItems.map((i) => i.id));
  const options = allItems.filter(
    (item) => !linkedIds.has(item.id) && item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddLink = (itemId: string) => {
    setAdding(false);
    setSearch("");
    setLinkError(null);
    combobox.closeDropdown();
    startTransition(async () => {
      const result = await addEntityLink(campaignId, entityType, entityId, targetType, itemId);
      if (result.error) {
        setLinkError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleRemoveLink = (linkId: string) => {
    startTransition(async () => {
      await removeEntityLink(linkId);
      router.refresh();
    });
  };

  const toggleNoteRow = (itemId: string) => {
    if (expandedRowId === itemId) {
      setExpandedRowId(null);
      setNoteInput("");
      setNoteError(null);
    } else {
      setExpandedRowId(itemId);
      setNoteInput("");
      setNoteError(null);
    }
  };

  const handleSaveNote = (ownerId: string) => {
    if (!noteInput.trim()) return;
    setNoteError(null);
    startTransition(async () => {
      const result = await createEntityNote(
        campaignId,
        targetType,
        ownerId,
        noteInput,
        entityType,
        entityId
      );
      if (result.error) {
        setNoteError(result.error);
        return;
      }
      setNoteInput("");
      router.refresh();
    });
  };

  const handleDeleteNote = (noteId: string) => {
    startTransition(async () => {
      await deleteEntityNote(noteId);
      router.refresh();
    });
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap">
          <Title order={5}>{title}</Title>
          <ActionIcon
            aria-label={`Dodaj ${title}`}
            loading={isPending}
            onClick={() => {
              setAdding((v) => !v);
              setSearch("");
            }}
            size="sm"
            variant="light"
          >
            <IconPlus size={14} />
          </ActionIcon>
        </Group>

        {adding ? (
          <Combobox onOptionSubmit={handleAddLink} store={combobox}>
            <Combobox.Target>
              <Input
                autoFocus
                onChange={(e) => {
                  setSearch(e.currentTarget.value);
                  combobox.openDropdown();
                  combobox.updateSelectedOptionIndex();
                }}
                onClick={() => combobox.openDropdown()}
                onFocus={() => combobox.openDropdown()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setAdding(false);
                    setSearch("");
                  }
                }}
                placeholder="Szukaj..."
                size="xs"
                value={search}
              />
            </Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options>
                {options.length === 0 ? (
                  <Combobox.Empty>Brak wyników</Combobox.Empty>
                ) : (
                  options.map((item) => (
                    <Combobox.Option key={item.id} value={item.id}>
                      {item.name}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
        ) : null}

        {linkError ? (
          <Text c="red" size="xs">
            {linkError}
          </Text>
        ) : null}

        {linkedItems.length === 0 ? (
          <Text c="dimmed" size="sm">
            Brak powiązanych elementów.
          </Text>
        ) : (
          <SimpleGrid cols={1} spacing="sm">
            {linkedItems.map((item) => {
              const rowNotes = contextNotes.filter((n) => n.owner_id === item.id);
              const isExpanded = expandedRowId === item.id;

              return (
                <Paper
                  key={item.linkId}
                  p="md"
                  radius="md"
                  withBorder
                  style={item.href ? { cursor: "pointer" } : undefined}
                  onClick={item.href ? () => router.push(item.href as Route) : undefined}
                >
                  <Stack gap="sm">
                    <Group align="flex-start" justify="space-between" wrap="nowrap">
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={600} lineClamp={2}>
                          {item.name}
                        </Text>
                      </Stack>

                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          aria-label={`Notatki o ${item.name}`}
                          color={isExpanded ? "blue" : "gray"}
                          onClick={(e) => { e.stopPropagation(); toggleNoteRow(item.id); }}
                          size="sm"
                          variant={isExpanded ? "light" : "subtle"}
                        >
                          <IconFileText size={14} />
                        </ActionIcon>
                        <ActionIcon
                          aria-label={`Usuń ${item.name}`}
                          color="gray"
                          loading={isPending}
                          onClick={(e) => { e.stopPropagation(); handleRemoveLink(item.linkId); }}
                          size="sm"
                          variant="subtle"
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>

                    {rowNotes.length > 0 ? (
                      <Group gap="xs">
                        <Badge color="blue" variant="light">
                          {rowNotes.length} not.
                        </Badge>
                      </Group>
                    ) : null}

                    {isExpanded ? (
                      <Box
                        bg="var(--mantine-color-default-hover)"
                        p="xs"
                        style={{ borderRadius: "var(--mantine-radius-sm)" }}
                      >
                        <Stack gap="xs">
                          {rowNotes.length > 0 ? (
                            <Stack gap={4}>
                              {rowNotes.map((note) => (
                                <Group key={note.id} align="flex-start" gap="xs" wrap="nowrap">
                                  <Text
                                    flex={1}
                                    size="xs"
                                    style={{ whiteSpace: "pre-wrap" }}
                                  >
                                    {note.content}
                                  </Text>
                                  <ActionIcon
                                    aria-label="Usuń notatkę"
                                    color="gray"
                                    loading={isPending}
                                    onClick={() => handleDeleteNote(note.id)}
                                    size="xs"
                                    variant="subtle"
                                  >
                                    <IconX size={10} />
                                  </ActionIcon>
                                </Group>
                              ))}
                            </Stack>
                          ) : null}

                          <Textarea
                            autosize
                            maxRows={6}
                            minRows={2}
                            onChange={(e) => setNoteInput(e.currentTarget.value)}
                            placeholder="Dodaj notatkę..."
                            size="xs"
                            value={noteInput}
                          />
                          {noteError ? (
                            <Text c="red" size="xs">
                              {noteError}
                            </Text>
                          ) : null}
                          <Group justify="flex-end">
                            <Button
                              disabled={!noteInput.trim()}
                              loading={isPending}
                              onClick={() => handleSaveNote(item.id)}
                              size="xs"
                            >
                              Zapisz
                            </Button>
                          </Group>
                        </Stack>
                      </Box>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        )}
      </Stack>
    </Paper>
  );
}
