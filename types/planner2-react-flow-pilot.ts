import type { Edge, Node } from "@xyflow/react";

/** Węzeł informacji (nie „co”) — łączy się tylko z eventem, nie z innym info. */
export type PlannerInfoKind = "dlaczego" | "gdzie" | "jak" | "kiedy" | "konsekwencje";

/** Pozycja uchwytu wzdłuż krawędzi (0–100%). */
export type PlannerEventHandleSlots = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

/** Event = „co”: tytuł + treść zdarzenia. */
export type PlannerEventNodeData = {
  co: string;
  handleSlotPct: PlannerEventHandleSlots;
  threadColor?: string;
  threadId?: string;
  threadLabel?: string;
  title: string;
};

export type PlannerInfoNodeData = {
  handleSlotPct: PlannerEventHandleSlots;
  kind: PlannerInfoKind;
  text: string;
};

export type PlannerPilotNode = Node<PlannerEventNodeData> | Node<PlannerInfoNodeData>;

export type Planner2ReactFlowPilotPersisted = {
  edges: Edge[];
  nodes: PlannerPilotNode[];
  viewport: { x: number; y: number; zoom: number };
};

export const PLANNER_INFO_KIND_OPTIONS: Array<{ kind: PlannerInfoKind; label: string }> = [
  { kind: "dlaczego", label: "Dlaczego" },
  { kind: "jak", label: "Jak" },
  { kind: "kiedy", label: "Kiedy" },
  { kind: "gdzie", label: "Gdzie" },
  { kind: "konsekwencje", label: "Konsekwencje" }
];

export const DEFAULT_PLANNER_EVENT_HANDLE_SLOTS: PlannerEventHandleSlots = {
  bottom: 50,
  left: 50,
  right: 50,
  top: 50
};

export const DEFAULT_PLANNER_EVENT_NODE_DATA: PlannerEventNodeData = {
  co: "",
  handleSlotPct: { ...DEFAULT_PLANNER_EVENT_HANDLE_SLOTS },
  threadColor: undefined,
  threadId: undefined,
  threadLabel: undefined,
  title: ""
};

export function defaultPlannerInfoNodeData(kind: PlannerInfoKind): PlannerInfoNodeData {
  return {
    handleSlotPct: { ...DEFAULT_PLANNER_EVENT_HANDLE_SLOTS },
    kind,
    text: ""
  };
}

export function plannerInfoKindLabel(kind: PlannerInfoKind): string {
  const row = PLANNER_INFO_KIND_OPTIONS.find((o) => o.kind === kind);
  return row?.label ?? kind;
}

/** Kolor ramki węzła informacji (event zostaje fioletowy). */
export function plannerInfoKindBorderColor(kind: PlannerInfoKind): string {
  switch (kind) {
    case "dlaczego":
      return "var(--mantine-color-red-6)";
    case "jak":
      return "var(--mantine-color-blue-6)";
    case "kiedy":
      return "var(--mantine-color-cyan-6)";
    case "gdzie":
      return "var(--mantine-color-green-6)";
    case "konsekwencje":
      return "var(--mantine-color-grape-6)";
    default:
      return "var(--mantine-color-default-border)";
  }
}

export function clampHandleSlotPct(n: number): number {
  if (!Number.isFinite(n)) {
    return 50;
  }
  return Math.min(92, Math.max(8, n));
}

function mergeHandleSlots(raw: unknown): PlannerEventHandleSlots {
  const d = { ...DEFAULT_PLANNER_EVENT_HANDLE_SLOTS };
  if (!raw || typeof raw !== "object") {
    return d;
  }
  const o = raw as Record<string, unknown>;
  for (const k of ["bottom", "left", "right", "top"] as const) {
    if (typeof o[k] === "number") {
      d[k] = clampHandleSlotPct(o[k]);
    }
  }
  return d;
}

const INFO_KINDS: PlannerInfoKind[] = ["dlaczego", "gdzie", "jak", "kiedy", "konsekwencje"];

export function isPlannerInfoKind(x: unknown): x is PlannerInfoKind {
  return typeof x === "string" && (INFO_KINDS as string[]).includes(x);
}

/** Event: tylko title + co + uchwyty (stare pola jak/dlaczego w JSON są pomijane). */
export function normalizePlannerEventNodeData(raw: unknown): PlannerEventNodeData {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PLANNER_EVENT_NODE_DATA };
  }
  const r = raw as Record<string, unknown>;
  return {
    co: typeof r.co === "string" ? r.co : "",
    handleSlotPct: mergeHandleSlots(r.handleSlotPct),
    threadColor: typeof r.threadColor === "string" ? r.threadColor : undefined,
    threadId: typeof r.threadId === "string" ? r.threadId : undefined,
    threadLabel: typeof r.threadLabel === "string" ? r.threadLabel : undefined,
    title: typeof r.title === "string" ? r.title : ""
  };
}

export function normalizePlannerInfoNodeData(raw: unknown): PlannerInfoNodeData {
  if (!raw || typeof raw !== "object") {
    return defaultPlannerInfoNodeData("jak");
  }
  const r = raw as Record<string, unknown>;
  const kind = isPlannerInfoKind(r.kind) ? r.kind : "jak";
  return {
    handleSlotPct: mergeHandleSlots(r.handleSlotPct),
    kind,
    text: typeof r.text === "string" ? r.text : ""
  };
}
