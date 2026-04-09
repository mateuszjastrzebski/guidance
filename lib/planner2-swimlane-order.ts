import type { Edge } from "@xyflow/react";

import {
  groupEventsByCharacter,
  groupEventsByThread
} from "@/lib/planner2-swimlane-layout";
import type {
  PlannerEventNodeData,
  PlannerLaneOrders,
  PlannerPilotNode
} from "@/types/planner2-react-flow-pilot";

/**
 * Kolejność eventów w wierszu: domyślnie z DAG (krawędzie event→event),
 * z obsługą cykli (pozostałe węzły wg sortu id) i nadpisania ręcznego.
 */

export function eventIdsFromEdges(edges: Edge[], eventIdSet: Set<string>): Edge[] {
  return edges.filter(
    (e) => eventIdSet.has(e.source) && eventIdSet.has(e.target)
  );
}

/** Kahn topo; w cyklu — dołącz pozostałe posortowane po id. */
export function topologicalOrderEventIds(
  eventIds: string[],
  eventEventEdges: Edge[]
): { order: string[]; cycleWarning: boolean } {
  const idSet = new Set(eventIds);
  const nodes = [...eventIds].sort((a, b) => a.localeCompare(b));
  const adj = new Map<string, Set<string>>();
  const indeg = new Map<string, number>();
  for (const id of nodes) {
    adj.set(id, new Set());
    indeg.set(id, 0);
  }
  for (const e of eventEventEdges) {
    if (!idSet.has(e.source) || !idSet.has(e.target)) {
      continue;
    }
    adj.get(e.source)?.add(e.target);
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  }

  const q: string[] = [];
  for (const id of nodes) {
    if ((indeg.get(id) ?? 0) === 0) {
      q.push(id);
    }
  }
  q.sort((a, b) => a.localeCompare(b));

  const out: string[] = [];
  while (q.length > 0) {
    const u = q.shift()!;
    out.push(u);
    for (const v of adj.get(u) ?? []) {
      const next = (indeg.get(v) ?? 0) - 1;
      indeg.set(v, next);
      if (next === 0) {
        q.push(v);
        q.sort((a, b) => a.localeCompare(b));
      }
    }
  }

  if (out.length < nodes.length) {
    const remaining = nodes.filter((id) => !out.includes(id)).sort((a, b) => a.localeCompare(b));
    return { cycleWarning: true, order: [...out, ...remaining] };
  }
  return { cycleWarning: false, order: out };
}

/** Scala wyliczenie z grafem z zapisanym override (tylko ważne id w grupie). */
export function mergeLaneOrder(
  groupKey: string,
  memberIds: string[],
  edges: Edge[],
  saved: Record<string, string[]> | undefined
): { order: string[]; cycleWarning: boolean } {
  const idSet = new Set(memberIds);
  const ee = eventIdsFromEdges(edges, idSet);
  const { order: graphOrder, cycleWarning } = topologicalOrderEventIds(memberIds, ee);

  const savedRow = saved?.[groupKey];
  if (!savedRow || savedRow.length === 0) {
    return { cycleWarning, order: graphOrder };
  }

  const graphSet = new Set(graphOrder);

  const merged: string[] = [];
  for (const id of savedRow) {
    if (idSet.has(id) && graphSet.has(id)) {
      merged.push(id);
    }
  }
  for (const id of graphOrder) {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  }
  for (const id of memberIds) {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  }

  if (merged.length !== memberIds.length) {
    return { cycleWarning, order: graphOrder };
  }

  return { cycleWarning, order: merged };
}

function collectCharacterIds(nodes: PlannerPilotNode[]): string[] {
  const s = new Set<string>();
  for (const n of nodes) {
    if (n.type !== "event") {
      continue;
    }
    for (const c of (n.data as PlannerEventNodeData).characterIds ?? []) {
      s.add(c);
    }
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

/** Startowe kolejności z grafu (bez zapisanego override). */
export function buildInitialLaneOrders(
  nodes: PlannerPilotNode[],
  edges: Edge[]
): PlannerLaneOrders {
  const byThread: Record<string, string[]> = {};
  for (const [k, ids] of groupEventsByThread(nodes)) {
    byThread[k] = mergeLaneOrder(k, ids, edges, undefined).order;
  }
  const cids = collectCharacterIds(nodes);
  const byCharacter: Record<string, string[]> = {};
  for (const [k, ids] of groupEventsByCharacter(nodes, cids)) {
    if (ids.length === 0) {
      continue;
    }
    byCharacter[k] = mergeLaneOrder(k, ids, edges, undefined).order;
  }
  return { byCharacter, byThread };
}

/** Po przeciągnięciu: ustaw nową kolejność dla id w tej samej grupie (drag w poziomie). */
export function reorderWithinLane(
  currentOrder: string[],
  movedId: string,
  beforeId: string | null
): string[] {
  const without = currentOrder.filter((id) => id !== movedId);
  if (beforeId === null) {
    return [...without, movedId];
  }
  const idx = without.indexOf(beforeId);
  if (idx < 0) {
    return [...without, movedId];
  }
  return [...without.slice(0, idx), movedId, ...without.slice(idx)];
}
