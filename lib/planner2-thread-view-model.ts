import type { Edge } from "@xyflow/react";

import { getThreadSwimlaneOrders } from "@/lib/planner2-swimlane-thread-layout";
import {
  plannerAccentColorFromThreadId,
  type PlannerEventNodeData,
  type PlannerLaneOrders,
  type PlannerPilotNode
} from "@/types/planner2-react-flow-pilot";

export type PlannerThreadOptionLike = {
  color: string;
  id: string;
  name: string;
};

export type ThreadTimelineEventTile = {
  data: PlannerEventNodeData;
  id: string;
};

export type ThreadTimelineRow = {
  accentColor: string;
  label: string;
  orderedEvents: ThreadTimelineEventTile[];
  threadKey: string;
};

function labelForThreadKey(
  threadKey: string,
  threadOptions: PlannerThreadOptionLike[],
  sampleLabel: string | undefined
): string {
  if (threadKey === "__none__") {
    return "Bez wątku";
  }
  const fromQuest = threadOptions.find((t) => t.id === threadKey);
  if (fromQuest) {
    return fromQuest.name;
  }
  if (sampleLabel?.trim()) {
    return sampleLabel.trim();
  }
  return threadKey;
}

/**
 * Wiersze wątków + uporządkowane eventy do widoku osi (bez React Flow).
 */
export function buildThreadTimelineRows(
  nodes: PlannerPilotNode[],
  edges: Edge[],
  laneOrders: PlannerLaneOrders,
  threadOptions: PlannerThreadOptionLike[]
): ThreadTimelineRow[] {
  const { laneKeys, orders } = getThreadSwimlaneOrders(nodes, edges, laneOrders);
  const byId = new Map(nodes.map((n) => [n.id, n] as const));

  const rows: ThreadTimelineRow[] = [];
  for (const threadKey of laneKeys) {
    const ids = orders[threadKey] ?? [];
    const orderedEvents: ThreadTimelineEventTile[] = [];
    let sampleLabel: string | undefined;
    let accent = plannerAccentColorFromThreadId(threadKey);

    for (const id of ids) {
      const n = byId.get(id);
      if (!n || n.type !== "event") {
        continue;
      }
      const data = n.data as PlannerEventNodeData;
      if (data.threadLabel?.trim()) {
        sampleLabel = data.threadLabel;
      }
      if (data.threadColor) {
        accent = data.threadColor;
      }
      orderedEvents.push({ data, id: n.id });
    }

    const quest = threadOptions.find((t) => t.id === threadKey);
    if (quest?.color) {
      accent = quest.color;
    }

    rows.push({
      accentColor: accent,
      label: labelForThreadKey(threadKey, threadOptions, sampleLabel),
      orderedEvents,
      threadKey
    });
  }

  return rows;
}
