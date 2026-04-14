"use client";

import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteEntityNote } from "@/app/(app)/campaign/[id]/entity-notes-actions";
import { ENTITY_TYPE_LABEL, type EntityNote } from "@/lib/entity-notes";

type EntityNotesSectionProps = {
  /** Notes where owner = this entity (pre-filtered). */
  notes: EntityNote[];
  /** Maps entity IDs → display names, used to label contexts. */
  contextNameMap: Map<string, string>;
};

export function EntityNotesSection({ notes, contextNameMap }: EntityNotesSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (noteId: string) => {
    startTransition(async () => {
      await deleteEntityNote(noteId);
      router.refresh();
    });
  };

  if (notes.length === 0) return null;

  // Group notes by context key: "type:id" or "none" for context-free notes
  const groups = new Map<string, { label: string; notes: EntityNote[] }>();

  for (const note of notes) {
    const key =
      note.context_type && note.context_id
        ? `${note.context_type}:${note.context_id}`
        : "none";

    if (!groups.has(key)) {
      let label = "Bez kontekstu";
      if (note.context_type && note.context_id) {
        const typeName = ENTITY_TYPE_LABEL[note.context_type] ?? note.context_type;
        const entityName = contextNameMap.get(note.context_id) ?? note.context_id;
        label = `${typeName}: ${entityName}`;
      }
      groups.set(key, { label, notes: [] });
    }
    groups.get(key)!.notes.push(note);
  }

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        <Title order={5}>Notatki</Title>

        {[...groups.entries()].map(([key, group]) => (
          <Stack key={key} gap="xs">
            <Badge color="gray" size="sm" variant="light">
              {group.label}
            </Badge>
            <Stack gap={6}>
              {group.notes.map((note) => (
                <Group key={note.id} align="flex-start" gap="xs" wrap="nowrap">
                  <Text flex={1} size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {note.content}
                  </Text>
                  <ActionIcon
                    aria-label="Usuń notatkę"
                    color="gray"
                    loading={isPending}
                    onClick={() => handleDelete(note.id)}
                    size="xs"
                    variant="subtle"
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
