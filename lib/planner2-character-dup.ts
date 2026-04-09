import type { Edge, Node } from "@xyflow/react";

import { layoutSwimlaneRows } from "@/lib/planner2-swimlane-layout";
import { mergeLaneOrder } from "@/lib/planner2-swimlane-order";
import {
  PLANNER_PILOT_EVENT_EDGE_TYPE,
  type PlannerEventNodeData,
  type PlannerLaneOrders,
  type PlannerPilotNode
} from "@/types/planner2-react-flow-pilot";

export const PLANNER_DUP_PREFIX = "planner-dup:";

export function isPlannerDupNodeId(id: string): boolean {
  return id.startsWith(PLANNER_DUP_PREFIX);
}

export function makeDupNodeId(canonicalId: string, characterId: string): string {
  return `${PLANNER_DUP_PREFIX}${canonicalId}:${characterId}`;
}

export function parseDupNodeId(
  id: string
): { canonicalId: string; characterId: string } | null {
  if (!isPlannerDupNodeId(id)) {
    return null;
  }
  const rest = id.slice(PLANNER_DUP_PREFIX.length);
  const colon = rest.indexOf(":");
  if (colon < 0) {
    return null;
  }
  return { canonicalId: rest.slice(0, colon), characterId: rest.slice(colon + 1) };
}

export function stripGhostEventNodes(nodes: PlannerPilotNode[]): PlannerPilotNode[] {
  return nodes.filter((n) => {
    if (n.type !== "event") {
      return true;
    }
    const d = n.data as PlannerEventNodeData;
    return !d.ghostSourceId;
  });
}

/** Krawędzie między duplikatami w tym samym wierszu postaci (kanoniczne id w `edges`). */
export function characterSwimlaneEdges(
  edges: Edge[],
  eventNodes: Node<PlannerEventNodeData>[]
): Edge[] {
  const byId = new Map(eventNodes.map((n) => [n.id, n]));
  const out: Edge[] = [];
  for (const e of edges) {
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    if (!a || !b) {
      continue;
    }
    const ca = a.data.characterIds ?? [];
    const cb = b.data.characterIds ?? [];
    const inter = ca.filter((c) => cb.includes(c));
    for (const charId of inter) {
      out.push({
        animated: true,
        data: { pilotCanonicalEdgeId: e.id },
        id: `cdup-${e.id}-${charId}`,
        source: makeDupNodeId(e.source, charId),
        sourceHandle: e.sourceHandle,
        target: makeDupNodeId(e.target, charId),
        targetHandle: e.targetHandle,
        type: PLANNER_PILOT_EVENT_EDGE_TYPE
      });
    }
  }
  return out;
}

/** Duplikaty eventów per postać; węzły info są pomijane w tym widoku. */
export function expandCharacterDupNodes(
  canonical: PlannerPilotNode[],
  characterIdsOrdered: string[],
  laneOrders: PlannerLaneOrders,
  edges: Edge[]
): PlannerPilotNode[] {
  const eventNodes = canonical.filter((n) => n.type === "event") as Node<PlannerEventNodeData>[];
  const byId = new Map(eventNodes.map((n) => [n.id, n]));

  const laneOrdersForLayout: Record<string, string[]> = {};
  const virtual: PlannerPilotNode[] = [];

  for (const cid of characterIdsOrdered) {
    const members = eventNodes
      .filter((n) => (n.data.characterIds ?? []).includes(cid))
      .map((n) => n.id);
    const { order: orderCanon } = mergeLaneOrder(cid, members, edges, laneOrders.byCharacter);
    const orderDup = orderCanon.map((eid) => makeDupNodeId(eid, cid));
    laneOrdersForLayout[cid] = orderDup;

    for (const eid of orderCanon) {
      const src = byId.get(eid);
      if (!src) {
        continue;
      }
      const dupId = makeDupNodeId(eid, cid);
      virtual.push({
        ...src,
        data: {
          ...src.data,
          ghostCharacterId: cid,
          ghostSourceId: src.id
        },
        id: dupId,
        position: { ...src.position }
      });
    }
  }

  return layoutSwimlaneRows({
    edges: [],
    laneKeys: characterIdsOrdered,
    laneOrders: laneOrdersForLayout,
    nodes: virtual,
    rowLabel: () => ""
  });
}
