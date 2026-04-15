"use client";

import {
  ActionIcon,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton
} from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";

import { getWorldIcon } from "@/lib/world-icons";
import type { PlannerWorldEntryRef } from "@/types/planner2-react-flow-pilot";

export type EditableWorldCollection = {
  icon: string | null;
  id: string;
  pluralName: string;
  singularName: string;
};

export type EditableWorldEntryOption = {
  collectionId: string;
  collectionSlug: string;
  id: string;
  name: string;
};

type WorldEntryCollectionEditorSectionProps = {
  collection: EditableWorldCollection;
  createWorldEntryInline: (
    collectionId: string,
    name: string
  ) => Promise<EditableWorldEntryOption | null>;
  hrefForRef: (ref: PlannerWorldEntryRef) => string;
  onChange: (nextRefs: PlannerWorldEntryRef[]) => void;
  worldEntryOptions: EditableWorldEntryOption[];
  worldEntryRefs: PlannerWorldEntryRef[];
};

export function WorldEntryCollectionEditorSection({
  collection,
  createWorldEntryInline,
  hrefForRef,
  onChange,
  worldEntryOptions,
  worldEntryRefs
}: WorldEntryCollectionEditorSectionProps) {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [creating, setCreating] = useState(false);
  const shellRef = useClickOutside(() => setMenuOpen(false));

  const Icon = getWorldIcon(collection.icon);
  const collectionEntries = useMemo(
    () => worldEntryOptions.filter((entry) => entry.collectionId === collection.id),
    [collection.id, worldEntryOptions]
  );
  const takenIds = useMemo(
    () =>
      new Set(
        worldEntryRefs
          .filter((ref) => ref.collectionId === collection.id)
          .map((ref) => ref.entryId)
      ),
    [collection.id, worldEntryRefs]
  );
  const selectedEntries = useMemo(
    () =>
      worldEntryRefs
        .filter((ref) => ref.collectionId === collection.id)
        .map((ref) => {
          const match = collectionEntries.find((entry) => entry.id === ref.entryId);
          return {
            entryId: ref.entryId,
            label: match?.name ?? `${collection.singularName} (${ref.entryId.slice(0, 8)}…)`
          };
        }),
    [collection.id, collection.singularName, collectionEntries, worldEntryRefs]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return collectionEntries.filter((entry) => {
      if (takenIds.has(entry.id)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return entry.name.toLowerCase().includes(q);
    });
  }, [collectionEntries, query, takenIds]);

  useEffect(() => {
    setHighlighted(0);
  }, [filtered.length, query]);

  const addRef = useCallback(
    (entry: EditableWorldEntryOption) => {
      if (takenIds.has(entry.id)) {
        return;
      }
      onChange([
        ...worldEntryRefs,
        {
          collectionId: entry.collectionId,
          collectionSlug: entry.collectionSlug,
          entryId: entry.id
        }
      ]);
      setMenuOpen(false);
      setQuery("");
    },
    [onChange, takenIds, worldEntryRefs]
  );

  const removeRef = useCallback(
    (entryId: string) => {
      onChange(worldEntryRefs.filter((ref) => !(ref.collectionId === collection.id && ref.entryId === entryId)));
    },
    [collection.id, onChange, worldEntryRefs]
  );

  const handleCreate = useCallback(async () => {
    const name = query.trim();
    if (!name || creating) {
      return;
    }
    setCreating(true);
    const created = await createWorldEntryInline(collection.id, name);
    setCreating(false);
    if (created) {
      addRef(created);
    }
  }, [addRef, collection.id, createWorldEntryInline, creating, query]);

  const showCreateOption = query.trim().length > 0;
  const totalItems = filtered.length + (showCreateOption ? 1 : 0);
  const createOptionIndex = filtered.length;

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (totalItems > 0) {
          setHighlighted((current) => Math.min(current + 1, totalItems - 1));
        }
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (totalItems > 0) {
          setHighlighted((current) => Math.max(current - 1, 0));
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (showCreateOption && highlighted === createOptionIndex) {
          void handleCreate();
          return;
        }
        const pick = filtered[highlighted] ?? filtered[0];
        if (pick) {
          addRef(pick);
        }
        return;
      }
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    },
    [addRef, createOptionIndex, filtered, handleCreate, highlighted, showCreateOption, totalItems]
  );

  const menuVisible = menuOpen && (filtered.length > 0 || showCreateOption);

  return (
    <Stack align="flex-start" gap="sm" w="100%">
      <Group align="center" gap="sm" wrap="nowrap" w="100%">
        <Icon
          aria-hidden
          size={20}
          stroke={1.5}
          style={{
            color: "light-dark(var(--mantine-color-violet-6), var(--mantine-color-violet-4))",
            flexShrink: 0
          }}
        />
        <Title
          order={4}
          style={{
            color: "light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-0))",
            flex: 1,
            fontWeight: 600,
            lineHeight: 1.35,
            margin: 0
          }}
        >
          {collection.pluralName}
        </Title>
      </Group>

      {selectedEntries.length > 0 ? (
        <Stack gap={6} w="100%">
          {selectedEntries.map((entry) => {
            const ref = worldEntryRefs.find(
              (candidate) =>
                candidate.collectionId === collection.id && candidate.entryId === entry.entryId
            );
            if (!ref) {
              return null;
            }
            return (
              <Group gap="sm" key={entry.entryId} wrap="nowrap">
                <UnstyledButton
                  component={Link}
                  href={hrefForRef(ref)}
                  style={{
                    borderRadius: "var(--mantine-radius-sm)",
                    color: "inherit",
                    display: "block",
                    flex: 1,
                    minWidth: 0,
                    padding: "4px 6px",
                    textDecoration: "none"
                  }}
                >
                  <Text lineClamp={1} size="md">
                    {entry.label}
                  </Text>
                </UnstyledButton>
                <ActionIcon
                  aria-label={`Usuń ${entry.label} z eventu`}
                  color="gray"
                  onClick={() => removeRef(entry.entryId)}
                  size="sm"
                  variant="subtle"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            );
          })}
        </Stack>
      ) : null}

      <Box pos="relative" ref={shellRef} w="100%">
        <TextInput
          aria-autocomplete="list"
          aria-expanded={menuVisible}
          onChange={(e) => {
            setMenuOpen(true);
            setQuery(e.currentTarget.value);
          }}
          onFocus={() => setMenuOpen(true)}
          onKeyDown={onInputKeyDown}
          placeholder={`Dodaj lub stwórz ${collection.singularName.toLowerCase()}…`}
          size="md"
          styles={{
            input: {
              border: "none",
              borderBottom:
                "1px solid light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))",
              borderRadius: 0,
              paddingLeft: 0,
              paddingRight: 0
            }
          }}
          value={query}
          variant="unstyled"
        />
        {menuVisible ? (
          <Paper
            p={4}
            radius="sm"
            shadow="md"
            style={{
              left: 0,
              maxHeight: 220,
              overflow: "auto",
              position: "absolute",
              right: 0,
              top: "100%",
              zIndex: 400
            }}
            withBorder
          >
            <Stack gap={0}>
              {filtered.map((entry, index) => (
                <UnstyledButton
                  key={entry.id}
                  onClick={() => addRef(entry)}
                  onMouseEnter={() => setHighlighted(index)}
                  p="xs"
                  style={{
                    backgroundColor:
                      index === highlighted
                        ? "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
                        : undefined,
                    borderRadius: "var(--mantine-radius-sm)"
                  }}
                  type="button"
                >
                  <Text lineClamp={1} size="md">
                    {entry.name}
                  </Text>
                </UnstyledButton>
              ))}
              {showCreateOption ? (
                <UnstyledButton
                  disabled={creating}
                  onClick={() => void handleCreate()}
                  onMouseEnter={() => setHighlighted(createOptionIndex)}
                  p="xs"
                  style={{
                    backgroundColor:
                      highlighted === createOptionIndex
                        ? "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
                        : undefined,
                    borderRadius: "var(--mantine-radius-sm)",
                    borderTop:
                      filtered.length > 0
                        ? "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))"
                        : undefined,
                    marginTop: filtered.length > 0 ? 4 : undefined
                  }}
                  type="button"
                >
                  <Group gap="xs" wrap="nowrap">
                    <IconPlus size={14} style={{ flexShrink: 0 }} />
                    <Text size="md">
                      Stwórz <Text component="span" fw={700}>{query.trim()}</Text>
                    </Text>
                  </Group>
                </UnstyledButton>
              ) : null}
            </Stack>
          </Paper>
        ) : null}
      </Box>
    </Stack>
  );
}
