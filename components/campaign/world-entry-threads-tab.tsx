"use client";

import { Box, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { loadPlannerGraph } from "@/app/(app)/campaign/[id]/planner-2/actions";
import { loadPlanner2ReactFlowPilot } from "@/lib/planner2-react-flow-pilot-storage";
import { getThreadSwimlaneOrders } from "@/lib/planner2-swimlane-thread-layout";
import {
  plannerAccentColorFromThreadId,
  type PlannerEventNodeData
} from "@/types/planner2-react-flow-pilot";

type EventItem = {
  type: "event";
  nodeId: string;
  title: string;
  co: string;
  position: number; // 1-based pozycja w całym wątku
};

type GapItem = {
  type: "gap";
  count: number;
};

type ThreadDisplayItem = EventItem | GapItem;

type ThreadEntry = {
  threadId: string;
  name: string;
  color: string;
  href: string;
  items: ThreadDisplayItem[];
  isManuallyLinked: boolean;
};

function pluralEvent(n: number): string {
  if (n === 1) return "event";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "eventy";
  return "eventów";
}

type Props = {
  campaignId: string;
  entryId: string;
  allQuests: { id: string; name: string }[];
  linkedQuestIds: string[];
};

export function WorldEntryThreadsTab({
  campaignId,
  entryId,
  allQuests,
  linkedQuestIds
}: Props) {
  const [threads, setThreads] = useState<ThreadEntry[]>([]);

  useEffect(() => {
    void (async () => {
      const localFallback = loadPlanner2ReactFlowPilot(campaignId);
      const loadResult = await loadPlannerGraph(campaignId, localFallback);
      const persisted = loadResult.ok ? loadResult.payload : localFallback;
      const { orders } = getThreadSwimlaneOrders(
        persisted.nodes,
        persisted.edges,
        persisted.laneOrders
      );

      const byThread = new Map<string, { nodeId: string; title: string; co: string }[]>();

      for (const node of persisted.nodes) {
        if (node.type !== "event") continue;
        const data = node.data as PlannerEventNodeData;

        const appearsInEvent =
          (data.worldEntryRefs ?? []).some((ref) => ref.entryId === entryId) ||
          (data.legacyNpcIds ?? []).includes(entryId) ||
          (data.legacyLocationIds ?? []).includes(entryId);

        if (!appearsInEvent) continue;

        const tid = data.threadId ?? "__none__";
        const arr = byThread.get(tid) ?? [];
        arr.push({
          nodeId: node.id,
          title: data.title?.trim() || "Bez tytułu",
          co: data.co ?? ""
        });
        byThread.set(tid, arr);
      }

      const linkedSet = new Set(linkedQuestIds);
      for (const qid of linkedSet) {
        if (!byThread.has(qid)) {
          byThread.set(qid, []);
        }
      }

      const questNameMap = new Map(allQuests.map((q) => [q.id, q.name]));
      const result: ThreadEntry[] = [];

      for (const [tid, matchEvents] of byThread) {
        if (tid === "__none__") continue;

        const name = questNameMap.get(tid) ?? "Nieznany wątek";
        const color = plannerAccentColorFromThreadId(tid);
        const href = `/campaign/${campaignId}/quests/${tid}`;
        const threadOrder = orders[tid] ?? [];
        const positioned = matchEvents
          .map((ev) => ({ ...ev, pos: threadOrder.indexOf(ev.nodeId) }))
          .filter((ev) => ev.pos !== -1)
          .sort((a, b) => a.pos - b.pos);

        const items: ThreadDisplayItem[] = [];
        for (let i = 0; i < positioned.length; i++) {
          const ev = positioned[i];
          items.push({
            type: "event",
            nodeId: ev.nodeId,
            title: ev.title,
            co: ev.co,
            position: ev.pos + 1
          });
          if (i < positioned.length - 1) {
            const gap = positioned[i + 1].pos - ev.pos - 1;
            if (gap > 0) {
              items.push({ type: "gap", count: gap });
            }
          }
        }

        result.push({
          threadId: tid,
          name,
          color,
          href,
          items,
          isManuallyLinked: linkedSet.has(tid)
        });
      }

      result.sort((a, b) => a.name.localeCompare(b.name, "pl"));
      setThreads(result);
    })();
  }, [campaignId, entryId, allQuests, linkedQuestIds]);

  if (threads.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        Brak wątków. Dodaj ten wpis do eventu w Planerze lub połącz ręcznie z wątkiem poniżej.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {threads.map((thread) => (
        <Paper key={thread.threadId} p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group gap="xs" align="center">
              <Box
                style={{
                  background: thread.color,
                  borderRadius: 3,
                  flexShrink: 0,
                  height: 10,
                  width: 10
                }}
              />
              <Text
                component={Link}
                fw={600}
                href={thread.href as Route}
                size="sm"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {thread.name}
              </Text>
            </Group>

            {thread.items.length === 0 ? (
              <Text c="dimmed" size="sm">
                Połączony ręcznie — brak eventów w Planerze.
              </Text>
            ) : (
              <Stack gap={6}>
                {thread.items.map((item, idx) =>
                  item.type === "event" ? (
                    <Group key={`ev-${item.nodeId}`} gap="sm" wrap="nowrap">
                      <Text
                        c="dimmed"
                        fw={600}
                        size="sm"
                        style={{ flexShrink: 0, minWidth: 28, textAlign: "right" }}
                      >
                        {item.position}.
                      </Text>
                      <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={500} lineClamp={2} size="sm">
                          {item.title}
                        </Text>
                        {item.co.trim() ? (
                          <Text c="dimmed" lineClamp={2} size="xs">
                            {item.co}
                          </Text>
                        ) : null}
                      </Stack>
                    </Group>
                  ) : (
                    <Group key={`gap-${idx}`} align="center" gap="xs">
                      <Divider style={{ flex: 1 }} />
                      <Text c="dimmed" size="xs">
                        +{item.count} {pluralEvent(item.count)}
                      </Text>
                      <Divider style={{ flex: 1 }} />
                    </Group>
                  )
                )}
              </Stack>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
