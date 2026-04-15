"use client";

import { ActionIcon, Box, Drawer, Group, ScrollArea, Stack, Text, Textarea } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

import { Planner2EventDetailsThreadBar } from "@/components/planner2/planner2-event-details-thread-bar";
import { Planner2EventDrawerSideSections } from "@/components/planner2/planner2-event-drawer-side-sections";
import { usePlanner2ReactFlowPilot, type PlannerCharacterOption } from "@/components/planner2/planner2-react-flow-pilot-context";
import type { PlannerEventNodeData } from "@/types/planner2-react-flow-pilot";

/** Stała szerokość panelu — bez `min(vw)` żeby układ się nie przesuwał przy zmianie viewportu. */
const EVENT_DETAILS_DRAWER_WIDTH_PX = 560;

type Planner2EventDetailsDrawerProps = {
  campaignCharacters: PlannerCharacterOption[];
  /** Id węzła eventu (kanoniczne) — do wątku i zapisu NPC. */
  eventNodeId: string | null;
  eventData: PlannerEventNodeData | null;
  onClose: () => void;
  onEventDlaczegoChange: (dlaczego: string) => void;
  onEventTitleChange: (title: string) => void;
  opened: boolean;
};

export function Planner2EventDetailsDrawer({
  campaignCharacters,
  eventNodeId,
  eventData,
  onClose,
  onEventDlaczegoChange,
  onEventTitleChange,
  opened
}: Planner2EventDetailsDrawerProps) {
  const { getThreadEventIds, openEventDetails } = usePlanner2ReactFlowPilot();

  const threadId = eventData?.threadId ?? null;
  const threadEventIds = threadId ? getThreadEventIds(threadId) : [];
  const currentIndex = eventNodeId ? threadEventIds.indexOf(eventNodeId) : -1;
  const prevId = currentIndex > 0 ? threadEventIds[currentIndex - 1] : null;
  const nextId = currentIndex >= 0 && currentIndex < threadEventIds.length - 1 ? threadEventIds[currentIndex + 1] : null;

  return (
    <Drawer
      keepMounted={false}
      onClose={onClose}
      opened={opened}
      padding={0}
      position="right"
      size={EVENT_DETAILS_DRAWER_WIDTH_PX}
      styles={{
        body: { display: "flex", flexDirection: "column", height: "100%", padding: 0 },
        content: {
          display: "flex",
          flexDirection: "column",
          maxWidth: EVENT_DETAILS_DRAWER_WIDTH_PX,
          minWidth: EVENT_DETAILS_DRAWER_WIDTH_PX,
          width: EVENT_DETAILS_DRAWER_WIDTH_PX
        },
        header: { borderBottom: "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))" }
      }}
      title={null}
      withinPortal
    >
      <ScrollArea flex={1} offsetScrollbars type="auto">
        <Box pb="xl" pl="lg" pr="lg" pt="md" style={{ width: "100%" }}>
          <Stack gap="lg">
            {eventData && eventNodeId ? (
              <>
                <Planner2EventDetailsThreadBar eventData={eventData} eventNodeId={eventNodeId} />
                <Group align="flex-start" gap="xs" wrap="nowrap">
                  <Textarea
                    autosize
                    flex={1}
                    maxRows={4}
                    minRows={1}
                    onChange={(e) => onEventTitleChange(e.currentTarget.value)}
                    placeholder="Bez tytułu"
                    resize="none"
                    size="lg"
                    styles={{
                      input: {
                        "&::placeholder": { color: "var(--mantine-color-dimmed)", opacity: 1 },
                        background: "transparent",
                        border: "none",
                        boxShadow: "none",
                        fontSize: "var(--mantine-h2-font-size, 1.5rem)",
                        fontWeight: 600,
                        lineHeight: 1.25,
                        padding: 0
                      },
                      root: { width: "100%" }
                    }}
                    value={eventData.title}
                    variant="unstyled"
                  />
                  {threadId ? (
                    <Group gap={2} style={{ flexShrink: 0, paddingTop: 4 }}>
                      <ActionIcon
                        aria-label="Poprzednie zdarzenie"
                        color={prevId ? "violet" : "gray"}
                        disabled={!prevId}
                        onClick={() => prevId && openEventDetails(prevId)}
                        size="md"
                        variant="subtle"
                      >
                        <IconChevronLeft size={18} />
                      </ActionIcon>
                      <ActionIcon
                        aria-label="Następne zdarzenie"
                        color={nextId ? "violet" : "gray"}
                        disabled={!nextId}
                        onClick={() => nextId && openEventDetails(nextId)}
                        size="md"
                        variant="subtle"
                      >
                        <IconChevronRight size={18} />
                      </ActionIcon>
                    </Group>
                  ) : null}
                </Group>
                <Planner2EventDrawerSideSections
                  campaignCharacters={campaignCharacters}
                  dlaczego={eventData.dlaczego}
                  eventNodeId={eventNodeId}
                  eventThreadId={eventData.threadId}
                  onDlaczegoChange={onEventDlaczegoChange}
                  worldEntryRefs={eventData.worldEntryRefs ?? []}
                />
              </>
            ) : (
              <Text c="dimmed" size="md">
                Nie znaleziono eventu.
              </Text>
            )}
          </Stack>
        </Box>
      </ScrollArea>
    </Drawer>
  );
}
