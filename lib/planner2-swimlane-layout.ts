import type { Edge } from "@xyflow/react";

import {
  estimatedNodeSize,
  pilotNodeRect,
  type PilotNodeRect
} from "@/lib/planner2-react-flow-pilot-layout";
import type { PlannerEventNodeData, PlannerPilotNode } from "@/types/planner2-react-flow-pilot";

export const SWIMLANE_ROW_GAP = 32;
export const SWIMLANE_START_X = 40;
export const SWIMLANE_START_Y = 48;
export const SWIMLANE_COL_STEP_X = 320;

/** Mapa infoId -> eventId (partner po krawędzi). */
export function buildInfoParentEventMap(
  nodes: PlannerPilotNode[],
  edges: Edge[]
): Map<string, string> {
  const eventIds = new Set(
    nodes.filter((n) => n.type === "event").map((n) => n.id)
  );
  const infoIds = new Set(
    nodes.filter((n) => n.type === "info").map((n) => n.id)
  );
  const map = new Map<string, string>();
  for (const e of edges) {
    if (eventIds.has(e.source) && infoIds.has(e.target)) {
      map.set(e.target, e.source);
    }
    if (infoIds.has(e.source) && eventIds.has(e.target)) {
      map.set(e.source, e.target);
    }
  }
  return map;
}

function stackInfoOffsets(count: number, index: number): { dx: number; dy: number } {
  return { dx: SWIMLANE_COL_STEP_X * 0.85, dy: index * 140 };
}

type LayoutSwimlaneArgs = {
  edges: Edge[];
  laneKeys: string[];
  /** laneKey -> ordered event ids */
  laneOrders: Record<string, string[]>;
  nodes: PlannerPilotNode[];
  rowLabel: (laneKey: string, rowIndex: number) => string;
};

/**
 * Ustawia pozycje: każdy laneKey = jeden wiersz (y), eventy wg kolejności w x.
 * Węzły info: obok macierzystego eventu.
 */
export function layoutSwimlaneRows(args: LayoutSwimlaneArgs): PlannerPilotNode[] {
  const { edges, laneKeys, laneOrders, nodes, rowLabel } = args;
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const infoParent = buildInfoParentEventMap(nodes, edges);

  const rowBaseY = new Map<string, number>();
  let y = SWIMLANE_START_Y;
  for (let r = 0; r < laneKeys.length; r += 1) {
    const key = laneKeys[r];
    rowBaseY.set(key, y);
    y += estimatedNodeSize("event").h + SWIMLANE_ROW_GAP + 24;
  }

  const nextPositions = new Map<string, { x: number; y: number }>();

  for (let r = 0; r < laneKeys.length; r += 1) {
    const laneKey = laneKeys[r];
    const order = laneOrders[laneKey] ?? [];
    const baseY = rowBaseY.get(laneKey) ?? SWIMLANE_START_Y;
    let x = SWIMLANE_START_X;
    for (let i = 0; i < order.length; i += 1) {
      const id = order[i];
      const n = byId.get(id);
      if (!n || n.type !== "event") {
        continue;
      }
      nextPositions.set(id, { x, y: baseY });
      x += SWIMLANE_COL_STEP_X;
    }
  }

  const infoByEvent = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.type !== "info") {
      continue;
    }
    const parent = infoParent.get(n.id);
    if (!parent) {
      continue;
    }
    const list = infoByEvent.get(parent) ?? [];
    list.push(n.id);
    infoByEvent.set(parent, list);
  }

  for (const [eventId, infoList] of infoByEvent) {
    const ep = nextPositions.get(eventId);
    if (!ep) {
      continue;
    }
    infoList.sort((a, b) => a.localeCompare(b));
    for (let i = 0; i < infoList.length; i += 1) {
      const infId = infoList[i];
      const off = stackInfoOffsets(infoList.length, i);
      nextPositions.set(infId, {
        x: ep.x + off.dx,
        y: ep.y + off.dy
      });
    }
  }

  for (const n of nodes) {
    if (n.type === "info" && !nextPositions.has(n.id)) {
      const parent = infoParent.get(n.id);
      const ep = parent ? nextPositions.get(parent) : undefined;
      if (ep) {
        nextPositions.set(n.id, { x: ep.x + 260, y: ep.y + 40 });
      } else {
        nextPositions.set(n.id, { x: SWIMLANE_START_X, y: SWIMLANE_START_Y });
      }
    }
  }

  void rowLabel;

  return nodes.map((n) => {
    const p = nextPositions.get(n.id);
    if (!p) {
      return n;
    }
    return { ...n, position: { ...p } };
  }) as PlannerPilotNode[];
}

export function snapInfoToEventRect(
  eventRect: PilotNodeRect,
  infoIndex: number,
  total: number
): { x: number; y: number } {
  void total;
  const off = stackInfoOffsets(total, infoIndex);
  return { x: eventRect.x + off.dx, y: eventRect.y + off.dy };
}

/** Grupuj eventy po threadId (pusty = __none__). */
export function groupEventsByThread(
  nodes: PlannerPilotNode[]
): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.type !== "event") {
      continue;
    }
    const tid = (n.data as PlannerEventNodeData).threadId ?? "__none__";
    const list = m.get(tid) ?? [];
    list.push(n.id);
    m.set(tid, list);
  }
  for (const list of m.values()) {
    list.sort((a, b) => a.localeCompare(b));
  }
  return m;
}

/** Grupuj eventy po postaci — event może być w wielu grupach (wizualne duplikaty osobno). */
export function groupEventsByCharacter(
  nodes: PlannerPilotNode[],
  allCharacterIds: string[]
): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const cid of allCharacterIds) {
    m.set(cid, []);
  }
  for (const n of nodes) {
    if (n.type !== "event") {
      continue;
    }
    const ids = (n.data as PlannerEventNodeData).characterIds ?? [];
    for (const cid of ids) {
      if (!m.has(cid)) {
        m.set(cid, []);
      }
      m.get(cid)!.push(n.id);
    }
  }
  for (const list of m.values()) {
    list.sort((a, b) => a.localeCompare(b));
  }
  return m;
}

export function extractPositions(
  nodes: PlannerPilotNode[]
): Record<string, { x: number; y: number }> {
  const o: Record<string, { x: number; y: number }> = {};
  for (const n of nodes) {
    o[n.id] = { x: n.position.x, y: n.position.y };
  }
  return o;
}

export function applyPositions(
  nodes: PlannerPilotNode[],
  positions: Record<string, { x: number; y: number }>
): PlannerPilotNode[] {
  return nodes.map((n) => {
    const p = positions[n.id];
    if (!p) {
      return n;
    }
    return { ...n, position: { x: p.x, y: p.y } };
  }) as PlannerPilotNode[];
}

/** Szacunkowy prostokąt dla sortowania drag (x). */
export function nodeCenterX(n: PlannerPilotNode): number {
  const r = pilotNodeRect(n);
  return r.x + r.w / 2;
}
