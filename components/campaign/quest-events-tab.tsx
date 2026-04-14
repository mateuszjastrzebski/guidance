"use client";

import {
  Box,
  Divider,
  Drawer,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
  UnstyledButton
} from "@mantine/core";
import { IconHelp, IconMapPin, IconMask } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

import {
  loadPlanner2ReactFlowPilot,
  savePlanner2ReactFlowPilot
} from "@/lib/planner2-react-flow-pilot-storage";
import { getThreadSwimlaneOrders } from "@/lib/planner2-swimlane-thread-layout";
import type { PlannerEventNodeData } from "@/types/planner2-react-flow-pilot";
import type { Node } from "@xyflow/react";

const DRAWER_WIDTH = 560;

const DLACZEGO_ACCENT = "light-dark(var(--mantine-color-red-6), var(--mantine-color-red-4))";
const LOCATION_ACCENT = "light-dark(var(--mantine-color-teal-6), var(--mantine-color-teal-4))";
const NPC_ACCENT = "light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))";

type EventItem = { id: string; data: PlannerEventNodeData };

type QuestEventsTabProps = {
  campaignId: string;
  questId: string;
  npcOptions: { id: string; name: string }[];
  locationOptions: { id: string; name: string }[];
};

export function QuestEventsTab({ campaignId, questId, npcOptions, locationOptions }: QuestEventsTabProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<PlannerEventNodeData | null>(null);

  const npcById = new Map(npcOptions.map((n) => [n.id, n]));
  const locationById = new Map(locationOptions.map((l) => [l.id, l]));

  const loadEvents = useCallback(() => {
    const persisted = loadPlanner2ReactFlowPilot(campaignId);
    const { orders } = getThreadSwimlaneOrders(persisted.nodes, persisted.edges, persisted.laneOrders);
    const orderedIds = orders[questId] ?? [];
    const nodeById = new Map(persisted.nodes.map((n) => [n.id, n]));
    const ordered = orderedIds
      .map((id) => nodeById.get(id))
      .filter((n): n is Node<PlannerEventNodeData> => !!n && n.type === "event")
      .map((n) => ({ id: n.id, data: n.data as PlannerEventNodeData }));
    setEvents(ordered);
  }, [campaignId, questId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const openDrawer = useCallback((item: EventItem) => {
    setSelectedId(item.id);
    setDrawerData(item.data);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedId(null);
    setDrawerData(null);
  }, []);

  const patchField = useCallback(
    (field: "title" | "dlaczego", value: string) => {
      if (!selectedId) return;
      setDrawerData((prev) => (prev ? { ...prev, [field]: value } : null));
      setEvents((prev) =>
        prev.map((e) => (e.id === selectedId ? { ...e, data: { ...e.data, [field]: value } } : e))
      );
      const persisted = loadPlanner2ReactFlowPilot(campaignId);
      const updatedNodes = persisted.nodes.map((n) =>
        n.id === selectedId ? { ...n, data: { ...n.data, [field]: value } } : n
      );
      savePlanner2ReactFlowPilot(campaignId, { ...persisted, nodes: updatedNodes });
    },
    [campaignId, selectedId]
  );

  if (events.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        Brak eventów w tym wątku. Dodaj je w Planerze.
      </Text>
    );
  }

  return (
    <>
      <Stack gap="sm">
        {events.map((ev, idx) => (
          <UnstyledButton key={ev.id} onClick={() => openDrawer(ev)} style={{ display: "block" }}>
            <Paper
              p="md"
              radius="md"
              withBorder
              style={{
                cursor: "pointer",
                transition: "background 0.1s"
              }}
            >
              <Group gap="md" wrap="nowrap">
                <Text c="dimmed" fw={600} size="sm" style={{ flexShrink: 0, minWidth: 24, textAlign: "right" }}>
                  {idx + 1}.
                </Text>
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} lineClamp={2}>
                    {ev.data.title?.trim() || "Bez tytułu"}
                  </Text>
                  {ev.data.co?.trim() ? (
                    <Text c="dimmed" lineClamp={3} size="sm">
                      {ev.data.co}
                    </Text>
                  ) : null}
                </Stack>
              </Group>
            </Paper>
          </UnstyledButton>
        ))}
      </Stack>

      <Drawer
        keepMounted={false}
        onClose={closeDrawer}
        opened={!!selectedId}
        padding={0}
        position="right"
        size={DRAWER_WIDTH}
        styles={{
          body: { display: "flex", flexDirection: "column", height: "100%", padding: 0 },
          content: {
            display: "flex",
            flexDirection: "column",
            maxWidth: DRAWER_WIDTH,
            minWidth: DRAWER_WIDTH,
            width: DRAWER_WIDTH
          },
          header: {
            borderBottom:
              "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))"
          }
        }}
        title={null}
        withinPortal
      >
        <ScrollArea flex={1} offsetScrollbars type="auto">
          <Box pb="xl" pl="lg" pr="lg" pt="md" style={{ width: "100%" }}>
            {drawerData ? (
              <Stack gap="lg">
                <Textarea
                  autosize
                  maxRows={4}
                  minRows={1}
                  onChange={(e) => patchField("title", e.currentTarget.value)}
                  placeholder="Bez tytułu"
                  resize="none"
                  size="lg"
                  styles={{
                    input: {
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
                  value={drawerData.title}
                  variant="unstyled"
                />

                {drawerData.co?.trim() ? (
                  <Stack gap="xs">
                    <Text c="dimmed" size="sm" fw={500}>
                      Co się wydarzy?
                    </Text>
                    <Text size="md" style={{ whiteSpace: "pre-wrap" }}>
                      {drawerData.co}
                    </Text>
                  </Stack>
                ) : null}

                <Divider />

                {/* Dlaczego */}
                <Stack align="flex-start" gap="sm" w="100%">
                  <Group align="center" gap="sm" wrap="nowrap" w="100%">
                    <IconHelp
                      aria-hidden
                      size={20}
                      stroke={1.5}
                      style={{ color: DLACZEGO_ACCENT, flexShrink: 0 }}
                    />
                    <Title
                      order={4}
                      style={{
                        color:
                          "light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-0))",
                        flex: 1,
                        fontWeight: 600,
                        lineHeight: 1.35,
                        margin: 0
                      }}
                    >
                      Dlaczego to się stało?
                    </Title>
                  </Group>
                  <Textarea
                    autosize
                    maxRows={16}
                    minRows={4}
                    onChange={(e) => patchField("dlaczego", e.currentTarget.value)}
                    placeholder="Motywacje NPC, konsekwencje wcześniejszych scen, ukryte przyczyny…"
                    resize="none"
                    size="md"
                    styles={{ root: { width: "100%" } }}
                    value={drawerData.dlaczego}
                  />
                </Stack>

                {(drawerData.locationIds?.length ?? 0) > 0 ? (
                  <>
                    <Divider />
                    <Stack align="flex-start" gap="sm" w="100%">
                      <Group align="center" gap="sm" wrap="nowrap" w="100%">
                        <IconMapPin
                          aria-hidden
                          size={20}
                          stroke={1.5}
                          style={{ color: LOCATION_ACCENT, flexShrink: 0 }}
                        />
                        <Title
                          order={4}
                          style={{
                            color:
                              "light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-0))",
                            flex: 1,
                            fontWeight: 600,
                            lineHeight: 1.35,
                            margin: 0
                          }}
                        >
                          Miejsca
                        </Title>
                      </Group>
                      <Stack gap={4} w="100%">
                        {(drawerData.locationIds ?? []).map((id) => {
                          const loc = locationById.get(id);
                          return (
                            <Text key={id} size="md">
                              {loc?.name ?? `Lokacja (${id.slice(0, 8)}…)`}
                            </Text>
                          );
                        })}
                      </Stack>
                    </Stack>
                  </>
                ) : null}

                {(drawerData.npcIds?.length ?? 0) > 0 ? (
                  <>
                    <Divider />
                    <Stack align="flex-start" gap="sm" w="100%">
                      <Group align="center" gap="sm" wrap="nowrap" w="100%">
                        <IconMask
                          aria-hidden
                          size={20}
                          stroke={1.5}
                          style={{ color: NPC_ACCENT, flexShrink: 0 }}
                        />
                        <Title
                          order={4}
                          style={{
                            color:
                              "light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-0))",
                            flex: 1,
                            fontWeight: 600,
                            lineHeight: 1.35,
                            margin: 0
                          }}
                        >
                          NPC
                        </Title>
                      </Group>
                      <Stack gap={4} w="100%">
                        {(drawerData.npcIds ?? []).map((id) => {
                          const npc = npcById.get(id);
                          return (
                            <Text key={id} size="md">
                              {npc?.name ?? `NPC (${id.slice(0, 8)}…)`}
                            </Text>
                          );
                        })}
                      </Stack>
                    </Stack>
                  </>
                ) : null}
              </Stack>
            ) : null}
          </Box>
        </ScrollArea>
      </Drawer>
    </>
  );
}
