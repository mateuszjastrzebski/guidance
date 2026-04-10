"use client";

import "@xyflow/react/dist/style.css";
import "@/components/planner2/planner2-react-flow-pilot-nodes.css";

import { Box, Button, Group, SegmentedControl, Tooltip } from "@mantine/core";
import { IconSquareRounded } from "@tabler/icons-react";
import {
  addEdge,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnMoveEnd,
  type Viewport
} from "@xyflow/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject
} from "react";

import { listCharactersForBoard } from "@/app/(app)/campaign/[id]/board/characters-actions";
import { listNpcsForBoard } from "@/app/(app)/campaign/[id]/board/npcs-actions";
import {
  createQuestForBoard,
  listQuestsForBoard
} from "@/app/(app)/campaign/[id]/board/quests-actions";
import { Planner2EventDetailsDrawer } from "@/components/planner2/planner2-event-details-drawer";
import { Planner2ReactFlowEventNode } from "@/components/planner2/planner2-react-flow-event-node";
import { Planner2ReactFlowInfoNode } from "@/components/planner2/planner2-react-flow-info-node";
import { Planner2ReactFlowPilotEventEdge } from "@/components/planner2/planner2-react-flow-pilot-edge";
import { PlannerThreadTimelineView } from "@/components/planner2/planner2-thread-timeline-view";
import {
  Planner2ReactFlowPilotProvider,
  type AddNodeFromNodeSpec,
  type Planner2ReactFlowPilotContextValue,
  type PlannerCharacterOption,
  type PlannerNpcOption,
  type PlannerThreadOption
} from "@/components/planner2/planner2-react-flow-pilot-context";
import {
  characterSwimlaneEdges,
  expandCharacterDupNodes,
  parseDupNodeId
} from "@/lib/planner2-character-dup";
import {
  estimatedNodeSize,
  oppositePilotHandle,
  pilotEdgeHandles,
  pilotNodeRect,
  placeNewPilotNodeAdjacent,
  PLANNER_EVENT_OUTER_PX,
  spreadPilotNodesAfterInsert
} from "@/lib/planner2-react-flow-pilot-layout";
import {
  loadPlanner2ReactFlowPilot,
  savePlanner2ReactFlowPilot
} from "@/lib/planner2-react-flow-pilot-storage";
import { buildThreadTimelineRows } from "@/lib/planner2-thread-view-model";
import { applyPositions, extractPositions } from "@/lib/planner2-swimlane-layout";
import type { PlannerEventNodeData } from "@/types/planner2-react-flow-pilot";
import {
  DEFAULT_PLANNER_EVENT_NODE_DATA,
  PLANNER_PILOT_EVENT_EDGE_TYPE,
  PLANNER_PILOT_NODE_DRAG_SELECTOR,
  defaultPlannerInfoNodeData,
  plannerAccentColorFromThreadId,
  type Planner2ReactFlowPilotPersisted,
  type PlannerInfoKind,
  type PlannerInfoNodeData,
  type PlannerLaneOrders,
  type PlannerLayoutSnapshot,
  type PlannerPilotNode,
  type PlannerViewMode
} from "@/types/planner2-react-flow-pilot";

const nodeTypes = { event: Planner2ReactFlowEventNode, info: Planner2ReactFlowInfoNode };

const edgeTypes = {
  [PLANNER_PILOT_EVENT_EDGE_TYPE]: Planner2ReactFlowPilotEventEdge
};

function withPilotEventEdgeTypesForDisplay(
  nodeList: PlannerPilotNode[],
  edgeList: Edge[]
): Edge[] {
  return edgeList.map((e) => {
    const src = parseDupNodeId(e.source)?.canonicalId ?? e.source;
    const tgt = parseDupNodeId(e.target)?.canonicalId ?? e.target;
    const a = nodeList.find((n) => n.id === src);
    const b = nodeList.find((n) => n.id === tgt);
    if (a?.type === "event" && b?.type === "event") {
      return { ...e, type: e.type ?? PLANNER_PILOT_EVENT_EDGE_TYPE };
    }
    return e;
  });
}

const PLACEMENT_PREVIEW_NODE_ID = "__placement_preview__";
const PLACEMENT_PREVIEW_FALLBACK_CENTER_FLOW = { x: 200, y: 160 };
type PlacementTilePx = { h: number; w: number };

function readExistingEventTileSizePx(): PlacementTilePx | null {
  if (typeof document === "undefined") {
    return null;
  }
  const list = document.querySelectorAll<HTMLElement>(
    ".react-flow__node.react-flow__node-event"
  );
  for (const el of Array.from(list)) {
    if (el.getAttribute("data-id") === PLACEMENT_PREVIEW_NODE_ID) {
      continue;
    }
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0 && h > 0) {
      return { h, w };
    }
  }
  return null;
}

const PLANNER_HISTORY_MAX = 50;

type PlannerHistorySnapshot = {
  defaultViewport: Viewport;
  edges: Edge[];
  laneOrders: PlannerLaneOrders;
  layouts: Record<PlannerViewMode, PlannerLayoutSnapshot>;
  nodes: PlannerPilotNode[];
  viewMode: PlannerViewMode;
};

function deepCloneSnapshot<T>(value: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      /* JSON fallback */
    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) {
    return false;
  }
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return el.isContentEditable;
}

type ScreenToFlowFn = (p: { x: number; y: number }) => { x: number; y: number };

function plannerPlacementPreviewNode(
  pos: { x: number; y: number },
  tile: PlacementTilePx
): PlannerPilotNode {
  const { h, w } = tile;
  return {
    data: {
      ...DEFAULT_PLANNER_EVENT_NODE_DATA,
      isPlacementPreview: true
    },
    draggable: false,
    height: h,
    id: PLACEMENT_PREVIEW_NODE_ID,
    position: { ...pos },
    selectable: false,
    style: { pointerEvents: "none", zIndex: 1000 },
    type: "event",
    width: w
  } as Node<PlannerEventNodeData>;
}

function PlannerPlacementProjectionBridge({
  active,
  lastPointerClientRef,
  onPreviewPosition,
  screenToFlowRef,
  tileH,
  tileW
}: {
  active: boolean;
  lastPointerClientRef: MutableRefObject<{ x: number; y: number }>;
  onPreviewPosition: (p: { x: number; y: number }) => void;
  screenToFlowRef: MutableRefObject<ScreenToFlowFn | null>;
  tileH: number;
  tileW: number;
}) {
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    screenToFlowRef.current = screenToFlowPosition;
    return () => {
      screenToFlowRef.current = null;
    };
  }, [screenToFlowPosition, screenToFlowRef]);

  useLayoutEffect(() => {
    if (!active) {
      return;
    }
    const applyFromClient = (cx: number, cy: number) => {
      const flow = screenToFlowPosition({ x: cx, y: cy });
      onPreviewPosition({
        x: flow.x - tileW / 2,
        y: flow.y - tileH / 2
      });
    };
    const sync = () => {
      const last = lastPointerClientRef.current;
      applyFromClient(last.x, last.y);
    };
    sync();
    const rafDeferred = requestAnimationFrame(sync);

    const onMove = (e: PointerEvent) => {
      lastPointerClientRef.current = { x: e.clientX, y: e.clientY };
      applyFromClient(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(rafDeferred);
      window.removeEventListener("pointermove", onMove);
    };
  }, [active, lastPointerClientRef, onPreviewPosition, screenToFlowPosition, tileH, tileW]);

  return null;
}

function newEventNode(index: number): Node<PlannerEventNodeData> {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `ev-${Date.now()}-${index}`;
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    data: { ...DEFAULT_PLANNER_EVENT_NODE_DATA },
    dragHandle: PLANNER_PILOT_NODE_DRAG_SELECTOR,
    id,
    position: { x: 40 + col * 280, y: 40 + row * 200 },
    type: "event"
  };
}

function newPilotEventAt(
  nds: PlannerPilotNode[],
  position: { x: number; y: number },
  idOverride?: string
): Node<PlannerEventNodeData> {
  const index = nds.length;
  const id =
    idOverride ??
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `ev-${Date.now()}-${index}`);
  return {
    data: { ...DEFAULT_PLANNER_EVENT_NODE_DATA },
    dragHandle: PLANNER_PILOT_NODE_DRAG_SELECTOR,
    id,
    position: { ...position },
    type: "event"
  };
}

function newPilotInfoAt(
  nds: PlannerPilotNode[],
  kind: PlannerInfoKind,
  position: { x: number; y: number },
  idOverride?: string
): Node<PlannerInfoNodeData> {
  const index = nds.length;
  const id =
    idOverride ??
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `inf-${Date.now()}-${index}`);
  return {
    data: defaultPlannerInfoNodeData(kind),
    dragHandle: PLANNER_PILOT_NODE_DRAG_SELECTOR,
    id,
    position: { ...position },
    type: "info"
  };
}

function pilotGraphEdgeAllowed(a: PlannerPilotNode, b: PlannerPilotNode): boolean {
  return !(a.type === "info" && b.type === "info");
}

/** Sąsiednie węzły info połączone krawędzią z danym eventem (canonical id). */
function neighborInfoIdsForEvent(eventCanonicalId: string, edgeList: Edge[]): Set<string> {
  const out = new Set<string>();
  for (const e of edgeList) {
    const s = parseDupNodeId(e.source)?.canonicalId ?? e.source;
    const t = parseDupNodeId(e.target)?.canonicalId ?? e.target;
    if (s === eventCanonicalId && t !== eventCanonicalId) {
      out.add(t);
    } else if (t === eventCanonicalId && s !== eventCanonicalId) {
      out.add(s);
    }
  }
  return out;
}

function applyThreadToNeighborInfoNodes(
  nodes: PlannerPilotNode[],
  eventCanonicalId: string,
  edgeList: Edge[],
  thread: PlannerThreadOption | null
): PlannerPilotNode[] {
  const neighbors = neighborInfoIdsForEvent(eventCanonicalId, edgeList);
  if (neighbors.size === 0) {
    return nodes;
  }
  const patch =
    thread != null
      ? { threadColor: thread.color, threadId: thread.id }
      : { threadColor: undefined, threadId: undefined };
  return nodes.map((n) => {
    if (n.type !== "info" || !neighbors.has(n.id)) {
      return n;
    }
    const inf = n as Node<PlannerInfoNodeData>;
    return { ...inf, data: { ...inf.data, ...patch } };
  });
}

type Planner2ReactFlowPilotProps = {
  campaignId: string;
};

export function Planner2ReactFlowPilot({ campaignId }: Planner2ReactFlowPilotProps) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [nodes, setNodes, onNodesChangeBase] = useNodesState<PlannerPilotNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layouts, setLayouts] = useState<
    Record<PlannerViewMode, PlannerLayoutSnapshot>
  >(() => ({
    freeform: { positions: {}, viewport: { x: 0, y: 0, zoom: 1 } },
    swimlane_character: { positions: {}, viewport: { x: 0, y: 0, zoom: 1 } },
    swimlane_thread: { positions: {}, viewport: { x: 0, y: 0, zoom: 1 } }
  }));
  const [laneOrders, setLaneOrders] = useState<PlannerLaneOrders>({
    byCharacter: {},
    byThread: {}
  });
  const [viewMode, setViewMode] = useState<PlannerViewMode>("freeform");
  const [defaultViewport, setDefaultViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [threadOptions, setThreadOptions] = useState<PlannerThreadOption[]>([]);
  const [characterOptions, setCharacterOptions] = useState<PlannerCharacterOption[]>([]);
  const [npcOptions, setNpcOptions] = useState<PlannerNpcOption[]>([]);
  const [placementPreviewActive, setPlacementPreviewActive] = useState(false);
  const [previewFlowPos, setPreviewFlowPos] = useState<{ x: number; y: number } | null>(null);
  const [placementTilePx, setPlacementTilePx] = useState<PlacementTilePx | null>(null);
  const [eventDetailsNodeId, setEventDetailsNodeId] = useState<string | null>(null);

  const viewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const laneOrdersRef = useRef(laneOrders);
  const layoutsRef = useRef(layouts);
  const viewModeRef = useRef(viewMode);
  const rfDisplayRef = useRef<PlannerPilotNode[]>([]);
  const threadTimelineScrollRef = useRef<HTMLDivElement | null>(null);
  const placementPreviewActiveRef = useRef(false);
  const lastPointerClientRef = useRef({ x: 0, y: 0 });
  const screenToFlowRef = useRef<ScreenToFlowFn | null>(null);
  const placementTilePxRef = useRef<PlacementTilePx | null>(null);

  const bootstrappedRef = useRef(false);
  const isApplyingHistoryRef = useRef(false);
  const undoStackRef = useRef<PlannerHistorySnapshot[]>([]);
  const redoStackRef = useRef<PlannerHistorySnapshot[]>([]);
  const undoPlannerRef = useRef<() => void>(() => {});
  const redoPlannerRef = useRef<() => void>(() => {});
  const pushHistoryBeforeActionRef = useRef<() => void>(() => {});

  nodesRef.current = nodes;
  edgesRef.current = edges;
  laneOrdersRef.current = laneOrders;
  layoutsRef.current = layouts;
  viewModeRef.current = viewMode;
  placementPreviewActiveRef.current = placementPreviewActive;
  bootstrappedRef.current = bootstrapped;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      lastPointerClientRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const endPlacementPreview = useCallback(() => {
    setPlacementPreviewActive(false);
    setPreviewFlowPos(null);
    setPlacementTilePx(null);
    placementTilePxRef.current = null;
  }, []);

  const startPlacementPreview = useCallback(() => {
    const tile = readExistingEventTileSizePx() ?? { ...PLANNER_EVENT_OUTER_PX };
    placementTilePxRef.current = tile;
    setPlacementTilePx(tile);
    setPreviewFlowPos({
      x: PLACEMENT_PREVIEW_FALLBACK_CENTER_FLOW.x - tile.w / 2,
      y: PLACEMENT_PREVIEW_FALLBACK_CENTER_FLOW.y - tile.h / 2
    });
    setPlacementPreviewActive(true);
  }, []);

  useEffect(() => {
    if (viewMode !== "freeform") {
      setPlacementPreviewActive(false);
      setPreviewFlowPos(null);
      setPlacementTilePx(null);
      placementTilePxRef.current = null;
    }
  }, [viewMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && placementPreviewActiveRef.current) {
        e.preventDefault();
        endPlacementPreview();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "z" || e.key === "Z")) {
        if (isTypingTarget(document.activeElement)) {
          return;
        }
        e.preventDefault();
        if (e.shiftKey) {
          redoPlannerRef.current();
        } else {
          undoPlannerRef.current();
        }
        return;
      }
      if (e.key !== "n" || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      if (isTypingTarget(document.activeElement)) {
        return;
      }
      if (viewModeRef.current !== "freeform") {
        return;
      }
      if (placementPreviewActiveRef.current) {
        return;
      }
      e.preventDefault();
      startPlacementPreview();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [endPlacementPreview, startPlacementPreview]);

  const resolveEventNodeId = useCallback((nodeId: string) => {
    return parseDupNodeId(nodeId)?.canonicalId ?? nodeId;
  }, []);

  const openEventDetails = useCallback(
    (nodeId: string) => {
      setEventDetailsNodeId(resolveEventNodeId(nodeId));
    },
    [resolveEventNodeId]
  );

  const closeEventDetails = useCallback(() => {
    setEventDetailsNodeId(null);
  }, []);

  const eventDetailsData = useMemo((): PlannerEventNodeData | null => {
    if (!eventDetailsNodeId) {
      return null;
    }
    const n = nodes.find((x) => x.id === eventDetailsNodeId && x.type === "event");
    if (!n) {
      return null;
    }
    return (n as Node<PlannerEventNodeData>).data;
  }, [eventDetailsNodeId, nodes]);

  useEffect(() => {
    if (!eventDetailsNodeId) {
      return;
    }
    const exists = nodes.some((n) => n.id === eventDetailsNodeId && n.type === "event");
    if (!exists) {
      setEventDetailsNodeId(null);
    }
  }, [eventDetailsNodeId, nodes]);

  useEffect(() => {
    setBootstrapped(false);
    undoStackRef.current = [];
    redoStackRef.current = [];
    const d = loadPlanner2ReactFlowPilot(campaignId);
    setEdges(d.edges);
    setLaneOrders(d.laneOrders);
    setLayouts(d.layouts);
    const withPos = applyPositions(d.nodes, d.layouts.freeform.positions);
    setNodes(withPos);
    const vp = d.layouts.freeform.viewport;
    setDefaultViewport(vp);
    viewportRef.current = vp;
    setViewMode("freeform");
    setBootstrapped(true);
  }, [campaignId, setEdges, setNodes]);

  useEffect(() => {
    let canceled = false;
    void (async () => {
      const result = await listQuestsForBoard(campaignId);
      if (canceled || !result.ok) {
        return;
      }
      setThreadOptions(
        result.quests.map((quest) => ({
          color: plannerAccentColorFromThreadId(quest.id),
          id: quest.id,
          name: quest.name
        }))
      );
    })();
    return () => {
      canceled = true;
    };
  }, [campaignId]);

  useEffect(() => {
    let canceled = false;
    void (async () => {
      const result = await listCharactersForBoard(campaignId);
      if (canceled || !result.ok) {
        return;
      }
      setCharacterOptions(
        result.characters.map((c) => ({
          id: c.id,
          name: c.name
        }))
      );
    })();
    return () => {
      canceled = true;
    };
  }, [campaignId]);

  useEffect(() => {
    let canceled = false;
    void (async () => {
      const result = await listNpcsForBoard(campaignId);
      if (canceled || !result.ok) {
        return;
      }
      setNpcOptions(
        result.npcs.map((n) => ({
          id: n.id,
          name: n.name,
          portrait_url: n.portrait_url
        }))
      );
    })();
    return () => {
      canceled = true;
    };
  }, [campaignId]);

  const patchEventData = useCallback(
    (nodeId: string, partial: Partial<PlannerEventNodeData>) => {
      const target = resolveEventNodeId(nodeId);
      setNodes((nds) =>
        nds.map((n): PlannerPilotNode => {
          if (n.id !== target || n.type !== "event") {
            return n;
          }
          const en = n as Node<PlannerEventNodeData>;
          return { ...en, data: { ...en.data, ...partial } };
        })
      );
    },
    [resolveEventNodeId, setNodes]
  );

  const onEventDetailsTitleChange = useCallback(
    (title: string) => {
      if (!eventDetailsNodeId) {
        return;
      }
      patchEventData(eventDetailsNodeId, { title });
    },
    [eventDetailsNodeId, patchEventData]
  );

  const onEventDetailsDlaczegoChange = useCallback(
    (dlaczego: string) => {
      if (!eventDetailsNodeId) {
        return;
      }
      patchEventData(eventDetailsNodeId, { dlaczego });
    },
    [eventDetailsNodeId, patchEventData]
  );

  const patchInfoData = useCallback(
    (nodeId: string, partial: Partial<PlannerInfoNodeData>) => {
      setNodes((nds) =>
        nds.map((n): PlannerPilotNode => {
          if (n.id !== nodeId || n.type !== "info") {
            return n;
          }
          const inf = n as Node<PlannerInfoNodeData>;
          return { ...inf, data: { ...inf.data, ...partial } };
        })
      );
    },
    [setNodes]
  );

  const assignThreadToEvent = useCallback(
    (nodeId: string, thread: PlannerThreadOption | null) => {
      pushHistoryBeforeActionRef.current();
      const target = resolveEventNodeId(nodeId);
      setNodes((nds) => {
        const next = nds.map((n): PlannerPilotNode => {
          if (n.id !== target || n.type !== "event") {
            return n;
          }
          const en = n as Node<PlannerEventNodeData>;
          return {
            ...en,
            data: {
              ...en.data,
              threadColor: thread?.color,
              threadId: thread?.id,
              threadLabel: thread?.name
            }
          };
        });
        return applyThreadToNeighborInfoNodes(
          next,
          target,
          edgesRef.current,
          thread
        );
      });
    },
    [resolveEventNodeId, setNodes]
  );

  const createThreadForEvent = useCallback(
    async (
      nodeId: string,
      name: string,
      color: string
    ): Promise<{ error?: string; thread?: PlannerThreadOption }> => {
      const target = resolveEventNodeId(nodeId);
      const title = name.trim();
      if (!title) {
        return { error: "Nazwa wątku nie może być pusta." };
      }
      const created = await createQuestForBoard(campaignId, title, null);
      if (!created.ok) {
        return { error: created.error };
      }
      const nextThread = { color, id: created.id, name: created.name };
      setThreadOptions((prev) => {
        if (prev.some((thread) => thread.id === nextThread.id)) {
          return prev;
        }
        return [nextThread, ...prev];
      });
      assignThreadToEvent(target, nextThread);
      return { thread: nextThread };
    },
    [assignThreadToEvent, campaignId, resolveEventNodeId]
  );

  const addNodeFromNode = useCallback(
    (sourceId: string, spec: AddNodeFromNodeSpec) => {
      pushHistoryBeforeActionRef.current();
      const resolvedSource = resolveEventNodeId(sourceId);
      const newId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `n-${Date.now()}`;
      const side = spec.side;
      const snapshot = nodesRef.current;
      const src = snapshot.find((n) => n.id === resolvedSource);
      if (!src) {
        return;
      }
      const newType = spec.type === "event" ? "event" : "info";
      const pos = placeNewPilotNodeAdjacent(src, newType, side);
      const newNode: PlannerPilotNode =
        spec.type === "event"
          ? (() => {
              const base = newPilotEventAt(snapshot, pos, newId);
              if (src.type === "event") {
                const sd = src.data as PlannerEventNodeData;
                return {
                  ...base,
                  data: {
                    ...base.data,
                    threadColor: sd.threadColor,
                    threadId: sd.threadId,
                    threadLabel: sd.threadLabel
                  }
                };
              }
              return base;
            })()
          : newPilotInfoAt(snapshot, spec.kind, pos, newId);
      const addEdgeAfter = pilotGraphEdgeAllowed(src, newNode);

      const h = addEdgeAfter ? pilotEdgeHandles(side) : null;
      const newEdgeDef: Edge | null =
        addEdgeAfter && h
          ? {
              animated: true,
              id: `e-${resolvedSource}-${newId}-${side}`,
              source: resolvedSource,
              sourceHandle: h.source,
              target: newId,
              targetHandle: h.target
            }
          : null;
      const edgesForLayout = newEdgeDef
        ? addEdge(newEdgeDef, edgesRef.current)
        : edgesRef.current;
      if (newEdgeDef) {
        setEdges(edgesForLayout);
      }

      setNodes((curr) => {
        if (curr.some((n) => n.id === newId)) {
          return curr;
        }
        if (!curr.some((n) => n.id === resolvedSource)) {
          return curr;
        }
        const withNew = [...curr, newNode];
        return spreadPilotNodesAfterInsert(withNew, newId);
      });
    },
    [resolveEventNodeId, setEdges, setNodes]
  );

  const insertEventOnEdge = useCallback(
    (displayEdge: Edge) => {
      pushHistoryBeforeActionRef.current();
      const canonicalId =
        (displayEdge.data as { pilotCanonicalEdgeId?: string } | undefined)
          ?.pilotCanonicalEdgeId ?? displayEdge.id;
      const stored = edgesRef.current.find((ed) => ed.id === canonicalId);
      if (!stored) {
        return;
      }
      const sourceCanon = parseDupNodeId(stored.source)?.canonicalId ?? stored.source;
      const targetCanon = parseDupNodeId(stored.target)?.canonicalId ?? stored.target;
      const srcNode = nodesRef.current.find((n) => n.id === sourceCanon);
      const tgtNode = nodesRef.current.find((n) => n.id === targetCanon);
      if (!srcNode || !tgtNode || srcNode.type !== "event" || tgtNode.type !== "event") {
        return;
      }
      const sourceHandle = stored.sourceHandle ?? "right";
      const targetHandle = stored.targetHandle ?? "left";
      const newId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `ev-split-${Date.now()}`;

      const sr = pilotNodeRect(srcNode);
      const tr = pilotNodeRect(tgtNode);
      const cx = (sr.x + sr.w / 2 + tr.x + tr.w / 2) / 2;
      const cy = (sr.y + sr.h / 2 + tr.y + tr.h / 2) / 2;
      const pos = {
        x: cx - PLANNER_EVENT_OUTER_PX.w / 2,
        y: cy - PLANNER_EVENT_OUTER_PX.h / 2
      };

      const sd = srcNode.data as PlannerEventNodeData;
      const base = newPilotEventAt(nodesRef.current, pos, newId);
      const newNode: PlannerPilotNode = {
        ...base,
        data: {
          ...base.data,
          threadColor: sd.threadColor,
          threadId: sd.threadId,
          threadLabel: sd.threadLabel
        }
      };

      const e1: Edge = {
        animated: true,
        id: `e-${sourceCanon}-${newId}-${sourceHandle}-split`,
        source: sourceCanon,
        sourceHandle,
        target: newId,
        targetHandle: oppositePilotHandle(sourceHandle),
        type: PLANNER_PILOT_EVENT_EDGE_TYPE
      };
      const e2: Edge = {
        animated: true,
        id: `e-${newId}-${targetCanon}-${targetHandle}-split`,
        source: newId,
        sourceHandle: oppositePilotHandle(targetHandle),
        target: targetCanon,
        targetHandle,
        type: PLANNER_PILOT_EVENT_EDGE_TYPE
      };

      setEdges((eds) => {
        const without = eds.filter((e) => e.id !== canonicalId);
        return addEdge(e2, addEdge(e1, without));
      });

      setNodes((curr) => {
        if (curr.some((n) => n.id === newId)) {
          return curr;
        }
        const withNew = [...curr, newNode];
        return spreadPilotNodesAfterInsert(withNew, newId);
      });
    },
    [setEdges, setNodes]
  );

  const baseCharacterDisplay = useMemo(() => {
    if (viewMode !== "swimlane_character") {
      return [] as PlannerPilotNode[];
    }
    const ids = characterOptions.map((c) => c.id);
    return expandCharacterDupNodes(nodes, ids, laneOrders, edges);
  }, [characterOptions, edges, laneOrders, nodes, viewMode]);

  const [rfCharacterNodes, setRfCharacterNodes] = useState<PlannerPilotNode[]>([]);
  useEffect(() => {
    if (viewMode === "swimlane_character") {
      setRfCharacterNodes(baseCharacterDisplay);
    }
  }, [baseCharacterDisplay, viewMode]);

  rfDisplayRef.current = rfCharacterNodes;

  const displayNodes: PlannerPilotNode[] =
    viewMode === "swimlane_character" ? rfCharacterNodes : nodes;

  const reactFlowNodes = useMemo(() => {
    if (viewMode !== "freeform" || !placementPreviewActive) {
      return displayNodes;
    }
    const tile = placementTilePx ?? { ...PLANNER_EVENT_OUTER_PX };
    const pos =
      previewFlowPos ??
      ({
        x: PLACEMENT_PREVIEW_FALLBACK_CENTER_FLOW.x - tile.w / 2,
        y: PLACEMENT_PREVIEW_FALLBACK_CENTER_FLOW.y - tile.h / 2
      } as const);
    return [...displayNodes, plannerPlacementPreviewNode(pos, tile)];
  }, [displayNodes, placementPreviewActive, placementTilePx, previewFlowPos, viewMode]);

  const displayEdges = useMemo(() => {
    if (viewMode === "swimlane_thread") {
      return [];
    }
    if (viewMode !== "swimlane_character") {
      return withPilotEventEdgeTypesForDisplay(nodes, edges);
    }
    const evs = nodes.filter((n) => n.type === "event") as Node<PlannerEventNodeData>[];
    return characterSwimlaneEdges(edges, evs);
  }, [edges, nodes, viewMode]);

  const onNodesChange = useCallback(
    (changes: NodeChange<PlannerPilotNode>[]) => {
      if (!isApplyingHistoryRef.current) {
        const structural = changes.some(
          (ch) => ch.type === "remove" || ch.type === "add"
        );
        if (structural) {
          pushHistoryBeforeActionRef.current();
        }
      }
      const filtered = changes.filter((ch) => {
        if ("id" in ch && ch.id === PLACEMENT_PREVIEW_NODE_ID) {
          return false;
        }
        return true;
      });
      if (viewModeRef.current === "swimlane_character") {
        setRfCharacterNodes((nds) => applyNodeChanges(filtered, nds) as PlannerPilotNode[]);
        return;
      }
      onNodesChangeBase(filtered);
    },
    [onNodesChangeBase]
  );

  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (!placementPreviewActiveRef.current || viewModeRef.current !== "freeform") {
        return;
      }
      const toFlow = screenToFlowRef.current;
      if (!toFlow) {
        return;
      }
      const flow = toFlow({ x: e.clientX, y: e.clientY });
      const tile = placementTilePxRef.current ?? { ...PLANNER_EVENT_OUTER_PX };
      const topLeft = { x: flow.x - tile.w / 2, y: flow.y - tile.h / 2 };
      const newId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `ev-${Date.now()}`;
      endPlacementPreview();
      pushHistoryBeforeActionRef.current();
      setNodes((curr) => {
        const fresh = newPilotEventAt(curr, topLeft, newId);
        const withNew = [...curr, fresh];
        return spreadPilotNodesAfterInsert(withNew, newId);
      });
    },
    [endPlacementPreview, setNodes]
  );

  const snapshotCurrentLayout = useCallback(() => {
    const mode = viewModeRef.current;
    const vp = viewportRef.current;
    if (mode === "swimlane_character") {
      return {
        positions: {} as Record<string, { x: number; y: number }>,
        viewport: vp
      };
    }
    if (mode === "swimlane_thread") {
      const el = threadTimelineScrollRef.current;
      return {
        positions: {},
        threadScroll: el
          ? { scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
          : layoutsRef.current.swimlane_thread.threadScroll,
        viewport: { x: 0, y: 0, zoom: 1 }
      };
    }
    return {
      positions: extractPositions(nodesRef.current),
      viewport: vp
    };
  }, []);

  const applyViewModeLayout = useCallback(
    (mode: PlannerViewMode) => {
      const lay = layoutsRef.current[mode];
      if (mode === "freeform") {
        setNodes((n) => applyPositions(n, lay.positions));
        return;
      }
      if (mode === "swimlane_thread") {
        return;
      }
    },
    [setNodes]
  );

  const skipFirstViewEffect = useRef(true);
  useEffect(() => {
    if (!bootstrapped) {
      return;
    }
    if (skipFirstViewEffect.current) {
      skipFirstViewEffect.current = false;
      return;
    }
    applyViewModeLayout(viewMode);
    const vp = layoutsRef.current[viewMode].viewport;
    viewportRef.current = vp;
    setDefaultViewport(vp);
  }, [applyViewModeLayout, bootstrapped, viewMode]);

  const switchViewMode = useCallback(
    (next: PlannerViewMode) => {
      pushHistoryBeforeActionRef.current();
      const cur = viewModeRef.current;
      setLayouts((prev) => ({
        ...prev,
        [cur]: snapshotCurrentLayout()
      }));
      setViewMode(next);
    },
    [snapshotCurrentLayout]
  );

  const persistPayload = useCallback((): Planner2ReactFlowPilotPersisted => {
    const mode = viewModeRef.current;
    const layoutsSnapshot = { ...layoutsRef.current };
    if (mode === "swimlane_character") {
      layoutsSnapshot.swimlane_character = {
        positions: {},
        viewport: viewportRef.current
      };
    } else if (mode === "swimlane_thread") {
      const el = threadTimelineScrollRef.current;
      layoutsSnapshot.swimlane_thread = {
        positions: {},
        threadScroll: el
          ? { scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
          : layoutsRef.current.swimlane_thread.threadScroll,
        viewport: { x: 0, y: 0, zoom: 1 }
      };
    } else {
      layoutsSnapshot[mode] = {
        positions: extractPositions(nodesRef.current),
        viewport: viewportRef.current
      };
    }
    return {
      edges: edgesRef.current,
      laneOrders: laneOrdersRef.current,
      layouts: layoutsSnapshot,
      nodes: nodesRef.current,
      version: 2
    };
  }, []);

  const persist = useCallback(() => {
    savePlanner2ReactFlowPilot(campaignId, persistPayload());
  }, [campaignId, persistPayload]);

  const captureHistorySnapshot = useCallback((): PlannerHistorySnapshot => {
    const mode = viewModeRef.current;
    const vp = viewportRef.current;
    const layoutsSnapshot = deepCloneSnapshot(layoutsRef.current);
    if (mode === "swimlane_character") {
      layoutsSnapshot.swimlane_character = {
        positions: {},
        viewport: { x: vp.x, y: vp.y, zoom: vp.zoom }
      };
    } else if (mode === "swimlane_thread") {
      const el = threadTimelineScrollRef.current;
      layoutsSnapshot.swimlane_thread = {
        positions: {},
        threadScroll: el
          ? { scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
          : layoutsRef.current.swimlane_thread.threadScroll,
        viewport: { x: 0, y: 0, zoom: 1 }
      };
    } else {
      layoutsSnapshot[mode] = {
        positions: extractPositions(nodesRef.current),
        viewport: { x: vp.x, y: vp.y, zoom: vp.zoom }
      };
    }
    return {
      defaultViewport: { x: vp.x, y: vp.y, zoom: vp.zoom },
      edges: deepCloneSnapshot(edgesRef.current),
      laneOrders: deepCloneSnapshot(laneOrdersRef.current),
      layouts: layoutsSnapshot,
      nodes: deepCloneSnapshot(nodesRef.current),
      viewMode: mode
    };
  }, []);

  const applyHistorySnapshot = useCallback(
    (snap: PlannerHistorySnapshot) => {
      isApplyingHistoryRef.current = true;
      try {
        const withPos = applyPositions(snap.nodes, snap.layouts.freeform.positions);
        setNodes(withPos);
        setEdges(snap.edges);
        setLaneOrders(snap.laneOrders);
        setLayouts(snap.layouts);
        setViewMode(snap.viewMode);
        const vp = snap.layouts[snap.viewMode].viewport;
        const v: Viewport = { x: vp.x, y: vp.y, zoom: vp.zoom };
        viewportRef.current = v;
        setDefaultViewport(v);
      } finally {
        queueMicrotask(() => {
          isApplyingHistoryRef.current = false;
        });
      }
    },
    [setEdges, setLaneOrders, setLayouts, setNodes]
  );

  const pushHistoryBeforeAction = useCallback(() => {
    if (isApplyingHistoryRef.current || !bootstrappedRef.current) {
      return;
    }
    undoStackRef.current.push(captureHistorySnapshot());
    redoStackRef.current = [];
    if (undoStackRef.current.length > PLANNER_HISTORY_MAX) {
      undoStackRef.current.shift();
    }
  }, [captureHistorySnapshot]);

  const undoPlanner = useCallback(() => {
    if (isApplyingHistoryRef.current || undoStackRef.current.length === 0) {
      return;
    }
    const prev = undoStackRef.current.pop()!;
    const cur = captureHistorySnapshot();
    redoStackRef.current.push(cur);
    applyHistorySnapshot(prev);
  }, [applyHistorySnapshot, captureHistorySnapshot]);

  const redoPlanner = useCallback(() => {
    if (isApplyingHistoryRef.current || redoStackRef.current.length === 0) {
      return;
    }
    const next = redoStackRef.current.pop()!;
    const cur = captureHistorySnapshot();
    undoStackRef.current.push(cur);
    applyHistorySnapshot(next);
  }, [applyHistorySnapshot, captureHistorySnapshot]);

  undoPlannerRef.current = undoPlanner;
  redoPlannerRef.current = redoPlanner;
  pushHistoryBeforeActionRef.current = pushHistoryBeforeAction;

  useEffect(() => {
    if (!bootstrapped) {
      return;
    }
    persist();
  }, [bootstrapped, edges, laneOrders, layouts, nodes, persist, viewMode]);

  const isValidConnection = useCallback((edgeOrConn: Connection | Edge) => {
    const list = nodesRef.current;
    const src = parseDupNodeId(edgeOrConn.source)?.canonicalId ?? edgeOrConn.source;
    const tgt = parseDupNodeId(edgeOrConn.target)?.canonicalId ?? edgeOrConn.target;
    const sourceNode = list.find((n) => n.id === src);
    const targetNode = list.find((n) => n.id === tgt);
    if (!sourceNode || !targetNode) {
      return false;
    }
    if (sourceNode.type === "info" && targetNode.type === "info") {
      return false;
    }
    return true;
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      pushHistoryBeforeActionRef.current();
      const source = parseDupNodeId(params.source)?.canonicalId ?? params.source;
      const target = parseDupNodeId(params.target)?.canonicalId ?? params.target;
      const sNode = nodesRef.current.find((n) => n.id === source);
      const tNode = nodesRef.current.find((n) => n.id === target);
      const bothEvent = sNode?.type === "event" && tNode?.type === "event";
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            id: `e-${source}-${target}-${params.sourceHandle ?? ""}-${params.targetHandle ?? ""}`,
            source,
            target,
            ...(bothEvent ? { type: PLANNER_PILOT_EVENT_EDGE_TYPE } : {})
          },
          eds
        )
      );
      setNodes((nds) => {
        const sNode = nds.find((n) => n.id === source);
        const tNode = nds.find((n) => n.id === target);
        let eventData: PlannerEventNodeData | null = null;
        let infoId: string | null = null;
        if (sNode?.type === "event" && tNode?.type === "info") {
          eventData = sNode.data as PlannerEventNodeData;
          infoId = target;
        } else if (sNode?.type === "info" && tNode?.type === "event") {
          eventData = tNode.data as PlannerEventNodeData;
          infoId = source;
        }
        if (!eventData || !infoId) {
          return nds;
        }
        const threadPatch =
          eventData.threadId != null
            ? {
                threadColor:
                  eventData.threadColor?.trim() ??
                  plannerAccentColorFromThreadId(eventData.threadId),
                threadId: eventData.threadId
              }
            : { threadColor: undefined, threadId: undefined };
        return nds.map((n) => {
          if (n.id !== infoId || n.type !== "info") {
            return n;
          }
          const inf = n as Node<PlannerInfoNodeData>;
          return { ...inf, data: { ...inf.data, ...threadPatch } };
        });
      });
    },
    [setEdges, setNodes]
  );

  const onEdgesChangeWrapped = useCallback(
    (changes: EdgeChange[]) => {
      if (!isApplyingHistoryRef.current) {
        const structural = changes.some(
          (ch) => ch.type === "remove" || ch.type === "replace"
        );
        if (structural) {
          pushHistoryBeforeActionRef.current();
        }
      }
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const onNodeDragStart = useCallback(() => {
    pushHistoryBeforeActionRef.current();
  }, []);

  const onSelectionDragStart = useCallback(() => {
    pushHistoryBeforeActionRef.current();
  }, []);

  const onMoveEnd: OnMoveEnd = useCallback(
    (_e, viewport) => {
      viewportRef.current = viewport;
      if (!bootstrapped) {
        return;
      }
      setLayouts((prev) => ({
        ...prev,
        [viewModeRef.current]: {
          ...prev[viewModeRef.current],
          viewport
        }
      }));
    },
    [bootstrapped]
  );

  const onNodeDragStop = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      if (viewModeRef.current === "swimlane_character" && node.type === "event") {
        const d = node.data as PlannerEventNodeData;
        if (!d.ghostCharacterId || !d.ghostSourceId) {
          return;
        }
        const cid = d.ghostCharacterId;
        const row = rfDisplayRef.current.filter(
          (n) =>
            n.type === "event" &&
            (n.data as PlannerEventNodeData).ghostCharacterId === cid
        );
        const sorted = [...row]
          .sort((a, b) => a.position.x - b.position.x)
          .map((n) => (n.data as PlannerEventNodeData).ghostSourceId!);
        setLaneOrders((lo) => ({
          ...lo,
          byCharacter: { ...lo.byCharacter, [cid]: sorted }
        }));
      }
    },
    []
  );

  const addEvent = useCallback(() => {
    pushHistoryBeforeActionRef.current();
    setNodes((nds) => [...nds, newEventNode(nds.length)]);
  }, [setNodes]);

  const threadTimelineRows = useMemo(
    () => buildThreadTimelineRows(nodes, edges, laneOrders, threadOptions),
    [edges, laneOrders, nodes, threadOptions]
  );

  const persistThreadScroll = useCallback(() => {
    const el = threadTimelineScrollRef.current;
    if (!el) {
      return;
    }
    setLayouts((prev) => ({
      ...prev,
      swimlane_thread: {
        ...prev.swimlane_thread,
        positions: {},
        threadScroll: { scrollLeft: el.scrollLeft, scrollTop: el.scrollTop },
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    }));
  }, []);

  const threadScrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onThreadTimelineScroll = useCallback(() => {
    if (threadScrollDebounceRef.current !== null) {
      clearTimeout(threadScrollDebounceRef.current);
    }
    threadScrollDebounceRef.current = setTimeout(() => {
      threadScrollDebounceRef.current = null;
      persistThreadScroll();
    }, 300);
  }, [persistThreadScroll]);

  const onStepThreadEvent = useCallback(
    (threadKey: string, eventId: string, delta: -1 | 1) => {
      pushHistoryBeforeActionRef.current();
      setLaneOrders((lo) => {
        const cur = [...(lo.byThread[threadKey] ?? [])];
        const i = cur.indexOf(eventId);
        if (i < 0) {
          return lo;
        }
        const j = i + delta;
        if (j < 0 || j >= cur.length) {
          return lo;
        }
        const nextRow = [...cur];
        const t = nextRow[i]!;
        nextRow[i] = nextRow[j]!;
        nextRow[j] = t;
        return {
          ...lo,
          byThread: { ...lo.byThread, [threadKey]: nextRow }
        };
      });
    },
    []
  );

  useLayoutEffect(() => {
    if (viewMode !== "swimlane_thread") {
      return;
    }
    const ts = layoutsRef.current.swimlane_thread.threadScroll;
    const el = threadTimelineScrollRef.current;
    if (ts && el) {
      el.scrollLeft = ts.scrollLeft;
      el.scrollTop = ts.scrollTop;
    }
  }, [viewMode]);

  const pilotContext = useMemo<Planner2ReactFlowPilotContextValue>(
    () => ({
      addNodeFromNode,
      assignThreadToEvent,
      campaignId,
      characterOptions,
      npcOptions,
      closeEventDetails,
      createThreadForEvent,
      insertEventOnEdge,
      openEventDetails,
      patchEventData,
      patchInfoData,
      resolveEventNodeId,
      threadOptions
    }),
    [
      addNodeFromNode,
      assignThreadToEvent,
      campaignId,
      characterOptions,
      npcOptions,
      closeEventDetails,
      createThreadForEvent,
      insertEventOnEdge,
      openEventDetails,
      patchEventData,
      patchInfoData,
      resolveEventNodeId,
      threadOptions
    ]
  );

  return (
    <Planner2ReactFlowPilotProvider value={pilotContext}>
      <Planner2EventDetailsDrawer
        campaignCharacters={characterOptions}
        eventData={eventDetailsData}
        eventNodeId={eventDetailsNodeId}
        onClose={closeEventDetails}
        onEventDlaczegoChange={onEventDetailsDlaczegoChange}
        onEventTitleChange={onEventDetailsTitleChange}
        opened={eventDetailsNodeId !== null}
      />
      <Box
        h="100%"
        style={{ display: "flex", flexDirection: "column", minHeight: 0, position: "relative", width: "100%" }}
        w="100%"
      >
        <Box
          style={{
            background: "transparent",
            left: 0,
            maxWidth: "100%",
            paddingLeft: "var(--mantine-spacing-xl)",
            paddingTop: "var(--mantine-spacing-xl)",
            pointerEvents: "none",
            position: "absolute",
            top: 0,
            zIndex: 20
          }}
        >
          <Group align="center" gap="xs" style={{ pointerEvents: "auto" }} wrap="wrap">
            <SegmentedControl
              data={[
                { label: "Swobodny", value: "freeform" },
                { label: "Wątki", value: "swimlane_thread" },
                { label: "Postacie", value: "swimlane_character" }
              ]}
              onChange={(v) => switchViewMode(v as PlannerViewMode)}
              radius="md"
              size="sm"
              styles={{
                indicator: {
                  backgroundColor:
                    "light-dark(var(--mantine-color-violet-1), var(--mantine-color-violet-8))",
                  boxShadow: "none"
                },
                label: {
                  padding: "3px 10px",
                  "&:not([data-active])": {
                    color: "var(--mantine-color-dimmed)"
                  },
                  "&[data-active]": {
                    color:
                      "light-dark(var(--mantine-color-violet-9), var(--mantine-color-white))"
                  }
                },
                root: {
                  backgroundColor:
                    "light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))",
                  border:
                    "1px solid light-dark(var(--mantine-color-violet-4), var(--mantine-color-violet-5))",
                  boxSizing: "border-box",
                  height: 36,
                  maxHeight: 36,
                  minHeight: 36,
                  padding: 3
                }
              }}
              value={viewMode}
            />
            <Tooltip label="Skrót klawiszowy: N" openDelay={400} position="bottom">
              <Button
                disabled={viewMode !== "freeform"}
                onClick={startPlacementPreview}
                rightSection={
                  <Group align="center" gap={4} justify="center" wrap="nowrap">
                    <IconSquareRounded aria-hidden size={17} stroke={1.6} style={{ opacity: 0.95 }} />
                    <Box component="span" style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>
                      N
                    </Box>
                  </Group>
                }
                size="sm"
                variant="filled"
              >
                Dodaj zdarzenie
              </Button>
            </Tooltip>
          </Group>
        </Box>
        <Box
          className={
            viewMode === "swimlane_thread"
              ? "planner-flow-canvas planner-flow-canvas--thread"
              : "planner-flow-canvas planner-flow-canvas--flow"
          }
          style={{
            cursor:
              viewMode === "freeform" && placementPreviewActive ? "crosshair" : undefined,
            display: "flex",
            flex: 1,
            flexDirection: "column",
            minHeight: 0,
            position: "relative",
            width: "100%"
          }}
        >
          {viewMode === "swimlane_thread" ? (
            <Box
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                minHeight: 0,
                paddingTop: "calc(var(--mantine-spacing-xl) + 2.25rem)"
              }}
            >
              <PlannerThreadTimelineView
                onScroll={onThreadTimelineScroll}
                onStepEvent={onStepThreadEvent}
                rows={threadTimelineRows}
                scrollRootRef={threadTimelineScrollRef}
              />
            </Box>
          ) : (
            <ReactFlow
              key={`${campaignId}-${viewMode}`}
              connectionMode={ConnectionMode.Loose}
              defaultEdgeOptions={{ animated: true }}
              defaultViewport={defaultViewport}
              deleteKeyCode={viewMode === "swimlane_character" ? null : "Backspace"}
              edgeTypes={edgeTypes}
              edges={displayEdges}
              isValidConnection={isValidConnection}
              nodeTypes={nodeTypes}
              nodes={reactFlowNodes}
              onConnect={onConnect}
              onEdgesChange={onEdgesChangeWrapped}
              onMoveEnd={onMoveEnd}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              onNodesChange={onNodesChange}
              onSelectionDragStart={onSelectionDragStart}
              onPaneClick={onPaneClick}
              proOptions={{ hideAttribution: true }}
              style={{ flex: 1, minHeight: 0 }}
            >
              <PlannerPlacementProjectionBridge
                active={viewMode === "freeform" && placementPreviewActive}
                lastPointerClientRef={lastPointerClientRef}
                onPreviewPosition={setPreviewFlowPos}
                screenToFlowRef={screenToFlowRef}
                tileH={placementTilePx?.h ?? PLANNER_EVENT_OUTER_PX.h}
                tileW={placementTilePx?.w ?? PLANNER_EVENT_OUTER_PX.w}
              />
              <Background gap={16} variant={BackgroundVariant.Dots} />
              <Controls />
              {viewMode === "freeform" ? <MiniMap pannable zoomable /> : null}
            </ReactFlow>
          )}
        </Box>
      </Box>
    </Planner2ReactFlowPilotProvider>
  );
}
