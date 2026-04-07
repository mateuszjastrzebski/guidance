import type { Edge, Node } from "@xyflow/react";

import {
  normalizePlannerEventNodeData,
  normalizePlannerInfoNodeData,
  type Planner2ReactFlowPilotPersisted,
  type PlannerEventNodeData,
  type PlannerInfoNodeData,
  type PlannerPilotNode
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
        id: o.id,
        position: { x: pos.x, y: pos.y },
        type: "event"
      } as Node<PlannerEventNodeData>);
    }
  }
  return out;
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

export function storageKeyPlanner2ReactFlowPilot(campaignId: string): string {
  return `planner2-reactflow-pilot-${campaignId}`;
}

export function loadPlanner2ReactFlowPilot(
  campaignId: string
): Planner2ReactFlowPilotPersisted {
  const fallback: Planner2ReactFlowPilotPersisted = {
    edges: [],
    nodes: [],
    viewport: { x: 0, y: 0, zoom: 1 }
  };
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
    const nodes = sanitizeNodes(o.nodes);
    const edges = sanitizeEdges(o.edges);
    let viewport = fallback.viewport;
    if (o.viewport && typeof o.viewport === "object") {
      const v = o.viewport as Record<string, unknown>;
      if (typeof v.x === "number" && typeof v.y === "number" && typeof v.zoom === "number") {
        viewport = { x: v.x, y: v.y, zoom: v.zoom };
      }
    }
    return { edges, nodes, viewport };
  } catch {
    return fallback;
  }
}

export function savePlanner2ReactFlowPilot(
  campaignId: string,
  payload: Planner2ReactFlowPilotPersisted
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      storageKeyPlanner2ReactFlowPilot(campaignId),
      JSON.stringify(payload)
    );
  } catch {
    // quota / prywatne okno
  }
}
