import type { Edge, Node } from "@xyflow/react";

/** Tryb widoku planera — osobny zapis pozycji i viewportu. */
export type PlannerViewMode = "freeform" | "swimlane_thread" | "swimlane_character";

/** Nadpisania kolejności eventów w wierszu (klucz = threadId lub characterId). */
export type PlannerLaneOrders = {
  byCharacter: Record<string, string[]>;
  byThread: Record<string, string[]>;
};

/** Snapshot układu dla jednego trybu. */
export type PlannerLayoutSnapshot = {
  positions: Record<string, { x: number; y: number }>;
  viewport: { x: number; y: number; zoom: number };
  /** Widok osi wątków (bez React Flow) — przewijanie głównego kontenera. */
  threadScroll?: { scrollLeft: number; scrollTop: number };
};

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
  characterIds?: string[];
  co: string;
  /** Węzeł-duplikat w widoku postaci — edycja idzie do ghostSourceId. */
  ghostCharacterId?: string;
  ghostSourceId?: string;
  handleSlotPct: PlannerEventHandleSlots;
  /** Tymczasowy podgląd przy wstawianiu klawiszem N — nie zapisuje się w grafie. */
  isPlacementPreview?: boolean;
  threadColor?: string;
  threadId?: string;
  threadLabel?: string;
  title: string;
};

export type PlannerInfoNodeData = {
  handleSlotPct: PlannerEventHandleSlots;
  kind: PlannerInfoKind;
  /** Kolor ramki z wątku powiązanego eventu (po połączeniu lub propagacji). */
  threadColor?: string;
  threadId?: string;
  text: string;
};

export type PlannerPilotNode = Node<PlannerEventNodeData> | Node<PlannerInfoNodeData>;

/** Paleta akcentu wątku (spójna z listą questów w planerze). */
const PLANNER_THREAD_ACCENT_PALETTE = [
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#65a30d",
  "#d97706",
  "#dc2626",
  "#db2777"
] as const;

/** Stabilny kolor z id wątku (gdy brak zapisanego `threadColor` w danych węzła). */
export function plannerAccentColorFromThreadId(threadId: string): string {
  let hash = 0;
  for (let i = 0; i < threadId.length; i += 1) {
    hash = (hash * 31 + threadId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PLANNER_THREAD_ACCENT_PALETTE.length;
  return PLANNER_THREAD_ACCENT_PALETTE[idx] ?? PLANNER_THREAD_ACCENT_PALETTE[0];
}

/** Klasa na cienkich pasach wokół kafelka — stąd można przesuwać węzeł (`dragHandle` w React Flow). */
export const PLANNER_PILOT_NODE_DRAG_CLASS = "planner-pilot-node-drag";

/** Selektor przekazywany do `Node.dragHandle`. */
export const PLANNER_PILOT_NODE_DRAG_SELECTOR = `.${PLANNER_PILOT_NODE_DRAG_CLASS}`;

/** Typ React Flow dla krawędzi event–event z plusem wstawienia eventu pośrodku. */
export const PLANNER_PILOT_EVENT_EDGE_TYPE = "pilotEventBetween";

export type Planner2ReactFlowPilotPersisted = {
  edges: Edge[];
  laneOrders: PlannerLaneOrders;
  layouts: Record<PlannerViewMode, PlannerLayoutSnapshot>;
  nodes: PlannerPilotNode[];
  version: 2;
};

/** Legacy v1 (bez version) — tylko migracja. */
export type Planner2ReactFlowPilotPersistedV1 = {
  edges: Edge[];
  nodes: PlannerPilotNode[];
  viewport: { x: number; y: number; zoom: number };
};

/** Etykiety wszystkich rodzajów węzłów info (także legacy: gdzie, kiedy). */
export const PLANNER_INFO_KIND_LABELS: Record<PlannerInfoKind, string> = {
  dlaczego: "Dlaczego",
  gdzie: "Gdzie",
  jak: "Jak",
  kiedy: "Kiedy",
  konsekwencje: "Konsekwencje"
};

/** Jedyny dodawalny z UI rodzaj węzła info (reszta: legacy w zapisanych grafach). */
export const PLANNER_INFO_KIND_OPTIONS: Array<{ kind: PlannerInfoKind; label: string }> = [
  { kind: "dlaczego", label: PLANNER_INFO_KIND_LABELS.dlaczego }
];

export const DEFAULT_PLANNER_EVENT_HANDLE_SLOTS: PlannerEventHandleSlots = {
  bottom: 50,
  left: 50,
  right: 50,
  top: 50
};

export const DEFAULT_PLANNER_EVENT_NODE_DATA: PlannerEventNodeData = {
  characterIds: undefined,
  co: "",
  ghostCharacterId: undefined,
  ghostSourceId: undefined,
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
    threadColor: undefined,
    threadId: undefined,
    text: ""
  };
}

export function plannerInfoKindLabel(kind: PlannerInfoKind): string {
  return PLANNER_INFO_KIND_LABELS[kind];
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
  const characterIdsRaw = r.characterIds;
  let characterIds: string[] | undefined;
  if (Array.isArray(characterIdsRaw)) {
    characterIds = characterIdsRaw.filter((x): x is string => typeof x === "string");
    if (characterIds.length === 0) {
      characterIds = undefined;
    }
  }

  return {
    characterIds,
    co: typeof r.co === "string" ? r.co : "",
    ghostCharacterId: typeof r.ghostCharacterId === "string" ? r.ghostCharacterId : undefined,
    ghostSourceId: typeof r.ghostSourceId === "string" ? r.ghostSourceId : undefined,
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
    threadColor: typeof r.threadColor === "string" ? r.threadColor : undefined,
    threadId: typeof r.threadId === "string" ? r.threadId : undefined,
    text: typeof r.text === "string" ? r.text : ""
  };
}
