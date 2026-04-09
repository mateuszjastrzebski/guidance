"use client";

import {
  ActionIcon,
  Box,
  Button,
  Group,
  ScrollArea,
  Text,
  Textarea,
  TextInput
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import { useCallback, useMemo, type ReactNode } from "react";

import type { Planner3TimelineEvent, Planner3TimelineState } from "@/types/planner3-timeline";

const ROW_LABELS = ["Zdarzenie", "Dlaczego", "Jak", "Kiedy"] as const;

const COL_MIN_PX = 220;
const LABEL_COL_PX = 140;

function newEvent(index: number): Planner3TimelineEvent {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ev-${Date.now()}-${index}`,
    title: `Zdarzenie ${index + 1}`,
    why: "",
    how: "",
    when: ""
  };
}

const defaultState = (): Planner3TimelineState => ({ events: [] });

type Planner3TimelineBoardProps = {
  campaignId: string;
};

export function Planner3TimelineBoard({ campaignId }: Planner3TimelineBoardProps) {
  const storageKey = `planner3-timeline-${campaignId}`;
  const [state, setState] = useLocalStorage<Planner3TimelineState>({
    defaultValue: defaultState(),
    deserialize: (raw) => {
      if (raw == null || raw === "") {
        return defaultState();
      }
      try {
        const parsed = JSON.parse(String(raw)) as unknown;
        if (!parsed || typeof parsed !== "object" || !("events" in parsed)) {
          return defaultState();
        }
        const events = (parsed as Planner3TimelineState).events;
        if (!Array.isArray(events)) {
          return defaultState();
        }
        return { events: events.filter(isValidEvent) };
      } catch {
        return defaultState();
      }
    },
    key: storageKey,
    serialize: JSON.stringify
  });

  const events = state.events;

  const addEvent = useCallback(() => {
    setState((prev) => ({
      events: [...prev.events, newEvent(prev.events.length)]
    }));
  }, [setState]);

  const removeEvent = useCallback(
    (id: string) => {
      setState((prev) => ({
        events: prev.events.filter((e) => e.id !== id)
      }));
    },
    [setState]
  );

  const patchEvent = useCallback(
    (id: string, patch: Partial<Pick<Planner3TimelineEvent, "title" | "why" | "how" | "when">>) => {
      setState((prev) => ({
        events: prev.events.map((e) => (e.id === id ? { ...e, ...patch } : e))
      }));
    },
    [setState]
  );

  const gridTemplateColumns = useMemo(() => {
    const cols = events.length === 0 ? 1 : events.length;
    return `${LABEL_COL_PX}px repeat(${cols}, minmax(${COL_MIN_PX}px, 1fr))`;
  }, [events.length]);

  return (
    <Box
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minHeight: 0,
        width: "100%"
      }}
    >
      <Group gap="sm" justify="space-between" px="md" py="sm" wrap="wrap" style={{ flexShrink: 0 }}>
        <Text c="dimmed" size="sm">
          Timeline — kolumny to zdarzenia; wiersze: tytuł, dlaczego, jak, kiedy. Dane zapisują się lokalnie w
          przeglądarce.
        </Text>
        <Button onClick={addEvent} size="sm" variant="light">
          Dodaj zdarzenie
        </Button>
      </Group>

      <ScrollArea offsetScrollbars style={{ flex: 1, minHeight: 0 }} type="scroll">
        <Box p="md" style={{ minWidth: "max-content" }}>
          {events.length === 0 ? (
            <Text c="dimmed" size="sm">
              Brak zdarzeń — kliknij „Dodaj zdarzenie”, żeby zacząć linię czasu.
            </Text>
          ) : (
            <Box
              style={{
                display: "grid",
                gap: 1,
                gridTemplateColumns,
                background: "var(--mantine-color-dark-4, var(--mantine-color-gray-3))"
              }}
            >
              <StickyLabelCell label={ROW_LABELS[0]} />
              {events.map((ev) => (
                <HeaderCell
                  key={`h-${ev.id}`}
                  onChangeTitle={(v) => patchEvent(ev.id, { title: v })}
                  onRemove={() => removeEvent(ev.id)}
                  title={ev.title}
                />
              ))}

              <StickyLabelCell label={ROW_LABELS[1]} />
              {events.map((ev) => (
                <FieldCell key={`why-${ev.id}`}>
                  <Textarea
                    autosize
                    maxRows={6}
                    minRows={2}
                    onChange={(e) => patchEvent(ev.id, { why: e.currentTarget.value })}
                    placeholder="Dlaczego…"
                    value={ev.why}
                    variant="filled"
                  />
                </FieldCell>
              ))}

              <StickyLabelCell label={ROW_LABELS[2]} />
              {events.map((ev) => (
                <FieldCell key={`how-${ev.id}`}>
                  <Textarea
                    autosize
                    maxRows={6}
                    minRows={2}
                    onChange={(e) => patchEvent(ev.id, { how: e.currentTarget.value })}
                    placeholder="Jak…"
                    value={ev.how}
                    variant="filled"
                  />
                </FieldCell>
              ))}

              <StickyLabelCell label={ROW_LABELS[3]} />
              {events.map((ev) => (
                <FieldCell key={`when-${ev.id}`}>
                  <TextInput
                    onChange={(e) => patchEvent(ev.id, { when: e.currentTarget.value })}
                    placeholder="Kiedy…"
                    value={ev.when}
                    variant="filled"
                  />
                </FieldCell>
              ))}
            </Box>
          )}
        </Box>
      </ScrollArea>
    </Box>
  );
}

function isValidEvent(x: unknown): x is Planner3TimelineEvent {
  if (!x || typeof x !== "object") {
    return false;
  }
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.why === "string" &&
    typeof o.how === "string" &&
    typeof o.when === "string"
  );
}

function StickyLabelCell({ label }: { label?: string }) {
  return (
    <Box
      p="xs"
      style={{
        alignItems: "center",
        background: "var(--mantine-color-body)",
        display: "flex",
        fontSize: "var(--mantine-font-size-sm)",
        fontWeight: 600,
        left: 0,
        minHeight: 52,
        position: "sticky",
        zIndex: 2
      }}
    >
      {label ?? ""}
    </Box>
  );
}

function HeaderCell({
  onChangeTitle,
  onRemove,
  title
}: {
  onChangeTitle: (v: string) => void;
  onRemove: () => void;
  title: string;
}) {
  return (
    <Box
      p="xs"
      style={{
        background: "var(--mantine-color-body)",
        minWidth: 0
      }}
    >
      <Group gap={6} wrap="nowrap">
        <TextInput
          flex={1}
          miw={0}
          onChange={(e) => onChangeTitle(e.currentTarget.value)}
          placeholder="Tytuł zdarzenia"
          value={title}
          variant="filled"
        />
        <ActionIcon aria-label="Usuń zdarzenie" color="red" onClick={onRemove} size="lg" variant="subtle">
          <IconTrash size={18} />
        </ActionIcon>
      </Group>
    </Box>
  );
}

function FieldCell({ children }: { children: ReactNode }) {
  return (
    <Box
      p="xs"
      style={{
        background: "var(--mantine-color-body)",
        minWidth: 0
      }}
    >
      {children}
    </Box>
  );
}
