import type { Edge, Node } from "@xyflow/react";

import { stripGhostEventNodes } from "@/lib/planner2-character-dup";
import { buildInitialLaneOrders } from "@/lib/planner2-swimlane-order";
import { extractPositions } from "@/lib/planner2-swimlane-layout";
import {
  normalizePlannerEventNodeData,
  normalizePlannerInfoNodeData,
  PLANNER_PILOT_NODE_DRAG_SELECTOR,
  type Planner2ReactFlowPilotPersisted,
  type Planner2ReactFlowPilotPersistedV1,
  type PlannerEventNodeData,
  type PlannerInfoNodeData,
  type PlannerLaneOrders,
  type PlannerLayoutSnapshot,
  type PlannerPilotNode,
  type PlannerViewMode
} from "@/types/planner2-react-flow-pilot";

function isEventDataShape(x: unknown): boolean {
  if (!x || typeof x !== "object") {
    return false;
  }
  const o = x as Record<string, unknown>;
  return typeof o.title === "string" && typeof o.co === "string";
}

function isInfoDataShape(x: unknown): boolean {
  if (!x || typeof x !== "object") {
    return false;
  }
  const o = x as Record<string, unknown>;
  return typeof o.text === "string" && typeof o.kind === "string";
}

function sanitizeNodes(raw: unknown): PlannerPilotNode[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: PlannerPilotNode[] = [];
  for (const n of raw) {
    if (!n || typeof n !== "object") {
      continue;
    }
    const o = n as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.position !== "object" || !o.position) {
      continue;
    }
    const pos = o.position as Record<string, unknown>;
    if (typeof pos.x !== "number" || typeof pos.y !== "number") {
      continue;
    }
    const nodeType = typeof o.type === "string" ? o.type : "event";
    if (nodeType === "info") {
      if (!isInfoDataShape(o.data)) {
        continue;
      }
      out.push({
        data: normalizePlannerInfoNodeData(o.data),
        dragHandle: PLANNER_PILOT_NODE_DRAG_SELECTOR,
        id: o.id,
        position: { x: pos.x, y: pos.y },
        type: "info"
      } as Node<PlannerInfoNodeData>);
    } else {
      if (!isEventDataShape(o.data)) {
        continue;
      }
      out.push({
        data: normalizePlannerEventNodeData(o.data),
        dragHandle: PLANNER_PILOT_NODE_DRAG_SELECTOR,
        id: o.id,
        position: { x: pos.x, y: pos.y },
        type: "event"
      } as Node<PlannerEventNodeData>);
    }
  }
  return stripGhostEventNodes(out);
}

const KNOWN_HANDLE_IDS = new Set(["bottom", "left", "right", "top"]);

function sanitizeEdges(raw: unknown): Edge[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: Edge[] = [];
  for (const e of raw) {
    if (!e || typeof e !== "object") {
      continue;
    }
    const o = e as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.source !== "string" || typeof o.target !== "string") {
      continue;
    }
    const edge: Edge = {
      id: o.id,
      source: o.source,
      target: o.target
    };
    if (typeof o.sourceHandle === "string" && KNOWN_HANDLE_IDS.has(o.sourceHandle)) {
      edge.sourceHandle = o.sourceHandle;
    }
    if (typeof o.targetHandle === "string" && KNOWN_HANDLE_IDS.has(o.targetHandle)) {
      edge.targetHandle = o.targetHandle;
    }
    if (typeof o.type === "string" && o.type.length > 0) {
      edge.type = o.type;
    }
    if (typeof o.animated === "boolean") {
      edge.animated = o.animated;
    }
    out.push(edge);
  }
  return out;
}

function emptyLayout(): PlannerLayoutSnapshot {
  return {
    positions: {},
    viewport: { x: 0, y: 0, zoom: 1 }
  };
}

function sanitizeLayout(raw: unknown): PlannerLayoutSnapshot | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const positions: Record<string, { x: number; y: number }> = {};
  if (o.positions && typeof o.positions === "object") {
    for (const [k, v] of Object.entries(o.positions as Record<string, unknown>)) {
      if (v && typeof v === "object") {
        const p = v as Record<string, unknown>;
        if (typeof p.x === "number" && typeof p.y === "number") {
          positions[k] = { x: p.x, y: p.y };
        }
      }
    }
  }
  let viewport = { x: 0, y: 0, zoom: 1 };
  if (o.viewport && typeof o.viewport === "object") {
    const v = o.viewport as Record<string, unknown>;
    if (typeof v.x === "number" && typeof v.y === "number" && typeof v.zoom === "number") {
      viewport = { x: v.x, y: v.y, zoom: v.zoom };
    }
  }
  let threadScroll: { scrollLeft: number; scrollTop: number } | undefined;
  if (o.threadScroll && typeof o.threadScroll === "object") {
    const ts = o.threadScroll as Record<string, unknown>;
    if (typeof ts.scrollLeft === "number" && typeof ts.scrollTop === "number") {
      threadScroll = { scrollLeft: ts.scrollLeft, scrollTop: ts.scrollTop };
    }
  }
  const out: PlannerLayoutSnapshot = { positions, viewport };
  if (threadScroll) {
    out.threadScroll = threadScroll;
  }
  return out;
}

function sanitizeLaneOrders(raw: unknown): PlannerLaneOrders {
  const empty: PlannerLaneOrders = { byCharacter: {}, byThread: {} };
  if (!raw || typeof raw !== "object") {
    return empty;
  }
  const o = raw as Record<string, unknown>;
  const byThread: Record<string, string[]> = {};
  const byCharacter: Record<string, string[]> = {};
  if (o.byThread && typeof o.byThread === "object") {
    for (const [k, v] of Object.entries(o.byThread as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        byThread[k] = v.filter((x): x is string => typeof x === "string");
      }
    }
  }
  if (o.byCharacter && typeof o.byCharacter === "object") {
    for (const [k, v] of Object.entries(o.byCharacter as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        byCharacter[k] = v.filter((x): x is string => typeof x === "string");
      }
    }
  }
  return { byCharacter, byThread };
}

function migrateV1ToV2(v1: Planner2ReactFlowPilotPersistedV1): Planner2ReactFlowPilotPersisted {
  const nodes = stripGhostEventNodes(sanitizeNodes(v1.nodes));
  const edges = sanitizeEdges(v1.edges);
  const positions = extractPositions(nodes);
  const vp = v1.viewport;
  const layouts: Record<PlannerViewMode, PlannerLayoutSnapshot> = {
    freeform: { positions: { ...positions }, viewport: { ...vp } },
    swimlane_character: { positions: {}, viewport: { ...vp } },
    swimlane_thread: { positions: {}, viewport: { ...vp } }
  };
  const laneOrders = buildInitialLaneOrders(nodes, edges);
  return {
    edges,
    laneOrders,
    layouts,
    nodes,
    version: 2
  };
}

export function storageKeyPlanner2ReactFlowPilot(campaignId: string): string {
  return `planner2-reactflow-pilot-${campaignId}`;
}

export function loadPlanner2ReactFlowPilot(campaignId: string): Planner2ReactFlowPilotPersisted {
  const fallback = migrateV1ToV2({ edges: [], nodes: [], viewport: { x: 0, y: 0, zoom: 1 } });
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(storageKeyPlanner2ReactFlowPilot(campaignId));
    if (!raw) {
      return fallback;
    }
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object") {
      return fallback;
    }
    const o = p as Record<string, unknown>;
    const edges = sanitizeEdges(o.edges);

    if (o.version !== 2) {
      const v1: Planner2ReactFlowPilotPersistedV1 = {
        edges,
        nodes: sanitizeNodes(o.nodes),
        viewport:
          o.viewport && typeof o.viewport === "object"
            ? (() => {
                const v = o.viewport as Record<string, unknown>;
                if (typeof v.x === "number" && typeof v.y === "number" && typeof v.zoom === "number") {
                  return { x: v.x, y: v.y, zoom: v.zoom };
                }
                return { x: 0, y: 0, zoom: 1 };
              })()
            : { x: 0, y: 0, zoom: 1 }
      };
      return migrateV1ToV2(v1);
    }

    const nodes = sanitizeNodes(o.nodes);
    const laneOrders = sanitizeLaneOrders(o.laneOrders);
    const rawLayouts = o.layouts && typeof o.layouts === "object" ? (o.layouts as Record<string, unknown>) : null;
    const layouts: Record<PlannerViewMode, PlannerLayoutSnapshot> = {
      freeform: (rawLayouts && sanitizeLayout(rawLayouts.freeform)) ?? emptyLayout(),
      swimlane_character:
        (rawLayouts && sanitizeLayout(rawLayouts.swimlane_character)) ?? emptyLayout(),
      swimlane_thread: (rawLayouts && sanitizeLayout(rawLayouts.swimlane_thread)) ?? emptyLayout()
    };

    return {
      edges,
      laneOrders,
      layouts,
      nodes,
      version: 2
    };
  } catch {
    return fallback;
  }
}

export function savePlanner2ReactFlowPilot(campaignId: string, payload: Planner2ReactFlowPilotPersisted): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const toSave: Planner2ReactFlowPilotPersisted = {
      ...payload,
      nodes: stripGhostEventNodes(payload.nodes)
    };
    window.localStorage.setItem(storageKeyPlanner2ReactFlowPilot(campaignId), JSON.stringify(toSave));
  } catch {
    // quota / prywatne okno
  }
}
