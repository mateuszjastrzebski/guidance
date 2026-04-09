"use client";

import { ActionIcon, Box, Group, Paper, Stack, Text, Tooltip } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { type RefObject } from "react";

import type { ThreadTimelineRow } from "@/lib/planner2-thread-view-model";

const TILE_MIN_W = 200;
const TILE_MAX_W = 280;

type PlannerThreadTimelineViewProps = {
  onScroll: () => void;
  onStepEvent: (threadKey: string, eventId: string, delta: -1 | 1) => void;
  rows: ThreadTimelineRow[];
  scrollRootRef: RefObject<HTMLDivElement | null>;
};

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max - 1)}…`;
}

export function PlannerThreadTimelineView({
  onScroll,
  onStepEvent,
  rows,
  scrollRootRef
}: PlannerThreadTimelineViewProps) {
  return (
    <Box
      h="100%"
      onScroll={onScroll}
      ref={scrollRootRef as RefObject<HTMLDivElement>}
      style={{ flex: 1, minHeight: 0, overflow: "auto" }}
    >
      <Stack gap="lg" pb="md" pr="xs" pt="xs">
        {rows.length === 0 ? (
          <Text c="dimmed" size="sm">
            Brak eventów — dodaj je w widoku Swobodnym.
          </Text>
        ) : null}
        {rows.map((row) => (
          <Box key={row.threadKey}>
            <Group align="flex-start" gap="md" wrap="nowrap">
              <Box
                style={{
                  flex: "0 0 140px",
                  paddingTop: 6,
                  position: "sticky",
                  left: 0,
                  zIndex: 1
                }}
              >
                <Text
                  fw={600}
                  lineClamp={2}
                  size="sm"
                  style={{
                    borderLeft: `4px solid ${row.accentColor}`,
                    paddingLeft: 8
                  }}
                >
                  {row.label}
                </Text>
              </Box>
              <Box
                style={{
                  borderBottom: "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))",
                  flex: 1,
                  minWidth: 0,
                  paddingBottom: 8,
                  paddingTop: 4
                }}
              >
                <Group align="stretch" gap="sm" wrap="nowrap">
                  {row.orderedEvents.map((ev, idx) => (
                    <Group align="stretch" gap={4} key={ev.id} wrap="nowrap">
                      <Stack gap={4} style={{ flex: "0 0 auto" }}>
                        <Group gap={2} wrap="nowrap">
                          <Tooltip label="W lewo (wcześniej w kolejności)">
                            <ActionIcon
                              aria-label="W lewo"
                              color="gray"
                              disabled={idx === 0}
                              onClick={() => onStepEvent(row.threadKey, ev.id, -1)}
                              size="sm"
                              variant="subtle"
                            >
                              <IconChevronLeft size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="W prawo (później w kolejności)">
                            <ActionIcon
                              aria-label="W prawo"
                              color="gray"
                              disabled={idx === row.orderedEvents.length - 1}
                              onClick={() => onStepEvent(row.threadKey, ev.id, 1)}
                              size="sm"
                              variant="subtle"
                            >
                              <IconChevronRight size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Stack>
                      <Paper
                        p="xs"
                        radius="md"
                        style={{
                          borderColor: row.accentColor,
                          borderWidth: 1,
                          maxWidth: TILE_MAX_W,
                          minWidth: TILE_MIN_W
                        }}
                        withBorder
                      >
                        <Tooltip
                          label={
                            <Stack gap={4}>
                              <Text size="sm" fw={600}>
                                {ev.data.title || "Bez tytułu"}
                              </Text>
                              {ev.data.co?.trim() ? (
                                <Text size="xs" style={{ whiteSpace: "pre-wrap" }}>
                                  {ev.data.co}
                                </Text>
                              ) : null}
                            </Stack>
                          }
                          multiline
                          maw={360}
                          position="top"
                          withArrow
                        >
                          <Stack gap={4}>
                            <Text fw={600} lineClamp={2} size="sm">
                              {ev.data.title?.trim() || "Bez tytułu"}
                            </Text>
                            {ev.data.co?.trim() ? (
                              <Text c="dimmed" lineClamp={3} size="xs">
                                {truncate(ev.data.co, 140)}
                              </Text>
                            ) : null}
                          </Stack>
                        </Tooltip>
                      </Paper>
                      {idx < row.orderedEvents.length - 1 ? (
                        <Text
                          c="dimmed"
                          component="span"
                          px={4}
                          size="xs"
                          style={{ alignSelf: "center", flex: "0 0 auto", userSelect: "none" }}
                        >
                          →
                        </Text>
                      ) : null}
                    </Group>
                  ))}
                </Group>
              </Box>
            </Group>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
