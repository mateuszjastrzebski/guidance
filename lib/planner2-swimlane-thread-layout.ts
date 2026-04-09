import type { Edge } from "@xyflow/react";

import {
  groupEventsByThread,
  layoutSwimlaneRows
} from "@/lib/planner2-swimlane-layout";
import { mergeLaneOrder } from "@/lib/planner2-swimlane-order";
import type { PlannerLaneOrders, PlannerPilotNode } from "@/types/planner2-react-flow-pilot";

export function sortThreadKeys(keys: string[]): string[] {
  const rest = keys.filter((k) => k !== "__none__").sort((a, b) => a.localeCompare(b));
  const none = keys.filter((k) => k === "__none__");
  return [...rest, ...none];
}

/** Kolejność eventów per wątek (bez wyliczania pikseli) — wspólne z widokiem osi i ewentualnym layoutem RF. */
export function getThreadSwimlaneOrders(
  nodes: PlannerPilotNode[],
  edges: Edge[],
  laneOrders: PlannerLaneOrders
): { laneKeys: string[]; orders: Record<string, string[]> } {
  const groups = groupEventsByThread(nodes);
  const laneKeys = sortThreadKeys([...groups.keys()]);
  const orders: Record<string, string[]> = {};
  for (const [k, ids] of groups) {
    orders[k] = mergeLaneOrder(k, ids, edges, laneOrders.byThread).order;
  }
  return { laneKeys, orders };
}

export function computeThreadSwimlaneLayout(
  nodes: PlannerPilotNode[],
  edges: Edge[],
  laneOrders: PlannerLaneOrders
): PlannerPilotNode[] {
  const { laneKeys, orders } = getThreadSwimlaneOrders(nodes, edges, laneOrders);
  return layoutSwimlaneRows({
    edges,
    laneKeys,
    laneOrders: orders,
    nodes,
    rowLabel: () => ""
  });
}
