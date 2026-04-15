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
import { showNotification } from "@mantine/notifications";
import { IconHelp } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";

import { createWorldEntryForBoard } from "@/app/(app)/campaign/[id]/board/world-entries-actions";
import {
  WorldEntryCollectionEditorSection,
  type EditableWorldEntryOption
} from "@/components/campaign/world-entry-collection-editor-section";
import {
  loadPlannerGraph,
  savePlannerGraph
} from "@/app/(app)/campaign/[id]/planner-2/actions";
import {
  loadPlanner2ReactFlowPilot,
  savePlanner2ReactFlowPilot
} from "@/lib/planner2-react-flow-pilot-storage";
import { getThreadSwimlaneOrders } from "@/lib/planner2-swimlane-thread-layout";
import type {
  Planner2ReactFlowPilotPersisted,
  PlannerEventNodeData,
  PlannerWorldEntryRef
} from "@/types/planner2-react-flow-pilot";
import type { Node } from "@xyflow/react";
import { worldEntryHref } from "@/lib/world";

const DRAWER_WIDTH = 560;

const DLACZEGO_ACCENT = "light-dark(var(--mantine-color-red-6), var(--mantine-color-red-4))";
type EventItem = { id: string; data: PlannerEventNodeData };

type QuestEventsTabProps = {
  campaignId: string;
  questId: string;
  worldCollections: Array<{
    icon: string | null;
    id: string;
    pluralName: string;
    singularName: string;
  }>;
  worldEntryOptions: Array<{
    collectionId: string;
    collectionPluralName: string;
    collectionSlug: string;
    id: string;
    name: string;
  }>;
};

function resolveEffectiveWorldEntryRefs(
  data: PlannerEventNodeData | null,
  worldEntryOptions: QuestEventsTabProps["worldEntryOptions"]
): PlannerWorldEntryRef[] {
  if (!data) {
    return [];
  }

  const byId = new Map(worldEntryOptions.map((entry) => [entry.id, entry]));
  const next = [...(data.worldEntryRefs ?? [])];
  for (const entryId of [...(data.legacyNpcIds ?? []), ...(data.legacyLocationIds ?? [])]) {
    const match = byId.get(entryId);
    if (!match) {
      continue;
    }
    if (next.some((ref) => ref.collectionId === match.collectionId && ref.entryId === match.id)) {
      continue;
    }
    next.push({
      collectionId: match.collectionId,
      collectionSlug: match.collectionSlug,
      entryId: match.id
    });
  }
  return next;
}

export function QuestEventsTab({
  campaignId,
  questId,
  worldCollections,
  worldEntryOptions
}: QuestEventsTabProps) {
  const [availableWorldEntries, setAvailableWorldEntries] = useState(worldEntryOptions);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<PlannerEventNodeData | null>(null);

  useEffect(() => {
    setAvailableWorldEntries(worldEntryOptions);
  }, [worldEntryOptions]);

  const effectiveWorldEntryRefs = useMemo(
    () => resolveEffectiveWorldEntryRefs(drawerData, availableWorldEntries),
    [availableWorldEntries, drawerData]
  );

  const loadEvents = useCallback(() => {
    void (async () => {
      const localFallback = loadPlanner2ReactFlowPilot(campaignId);
      const result = await loadPlannerGraph(campaignId, localFallback);
      const persisted = result.ok ? result.payload : localFallback;
      const { orders } = getThreadSwimlaneOrders(persisted.nodes, persisted.edges, persisted.laneOrders);
      const orderedIds = orders[questId] ?? [];
      const nodeById = new Map(persisted.nodes.map((n) => [n.id, n]));
      const ordered = orderedIds
        .map((id) => nodeById.get(id))
        .filter((n): n is Node<PlannerEventNodeData> => !!n && n.type === "event")
        .map((n) => ({ id: n.id, data: n.data as PlannerEventNodeData }));
      setEvents(ordered);
    })();
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
      const nextPayload = { ...persisted, nodes: updatedNodes } as Planner2ReactFlowPilotPersisted;
      savePlanner2ReactFlowPilot(campaignId, nextPayload);
      void savePlannerGraph(campaignId, nextPayload);
    },
    [campaignId, selectedId]
  );

  const patchEventData = useCallback(
    (partial: Partial<PlannerEventNodeData>) => {
      if (!selectedId) {
        return;
      }
      setDrawerData((prev) => (prev ? { ...prev, ...partial } : null));
      setEvents((prev) =>
        prev.map((event) =>
          event.id === selectedId ? { ...event, data: { ...event.data, ...partial } } : event
        )
      );
      const persisted = loadPlanner2ReactFlowPilot(campaignId);
      const updatedNodes = persisted.nodes.map((node) =>
        node.id === selectedId ? { ...node, data: { ...node.data, ...partial } } : node
      );
      const nextPayload = { ...persisted, nodes: updatedNodes } as Planner2ReactFlowPilotPersisted;
      savePlanner2ReactFlowPilot(campaignId, nextPayload);
      void savePlannerGraph(campaignId, nextPayload);
    },
    [campaignId, selectedId]
  );

  const createWorldEntryInline = useCallback(
    async (collectionId: string, name: string): Promise<EditableWorldEntryOption | null> => {
      const result = await createWorldEntryForBoard(campaignId, collectionId, name);
      if (!result.ok) {
        showNotification({ color: "red", message: result.error, title: "Błąd" });
        return null;
      }

      const entry: EditableWorldEntryOption = {
        collectionId: result.worldEntry.collection_id,
        collectionSlug: result.worldEntry.collection_slug,
        id: result.worldEntry.id,
        name: result.worldEntry.name
      };
      const option = {
        collectionId: result.worldEntry.collection_id,
        collectionPluralName: result.worldEntry.collection_plural_name,
        collectionSlug: result.worldEntry.collection_slug,
        id: result.worldEntry.id,
        name: result.worldEntry.name
      };

      setAvailableWorldEntries((prev) => {
        if (prev.some((candidate) => candidate.id === option.id)) {
          return prev;
        }
        return [...prev, option].sort((a, b) => a.name.localeCompare(b.name, "pl"));
      });

      return entry;
    },
    [campaignId]
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

                {worldCollections.map((collection) => (
                  <Box key={collection.id} w="100%">
                    <Divider mb="lg" />
                    <WorldEntryCollectionEditorSection
                      collection={collection}
                      createWorldEntryInline={createWorldEntryInline}
                      hrefForRef={(ref) => worldEntryHref(campaignId, ref.collectionSlug, ref.entryId)}
                      onChange={(nextRefs) =>
                        patchEventData({
                          legacyLocationIds: undefined,
                          legacyNpcIds: undefined,
                          worldEntryRefs: nextRefs.length > 0 ? nextRefs : undefined
                        })
                      }
                      worldEntryOptions={availableWorldEntries}
                      worldEntryRefs={effectiveWorldEntryRefs}
                    />
                  </Box>
                ))}
              </Stack>
            ) : null}
          </Box>
        </ScrollArea>
      </Drawer>
    </>
  );
}
