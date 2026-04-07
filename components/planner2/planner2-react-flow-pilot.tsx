"use client";

import "@xyflow/react/dist/style.css";

import { Box, Button, Group, Menu, Stack, Text, Tooltip } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type OnMoveEnd,
  type Viewport
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createQuestForBoard,
  listQuestsForBoard
} from "@/app/(app)/campaign/[id]/board/quests-actions";
import { Planner2ReactFlowEventNode } from "@/components/planner2/planner2-react-flow-event-node";
import { Planner2ReactFlowInfoNode } from "@/components/planner2/planner2-react-flow-info-node";
import {
  Planner2ReactFlowPilotProvider,
  type AddNodeFromNodeSpec,
  type Planner2ReactFlowPilotContextValue,
  type PlannerThreadOption
} from "@/components/planner2/planner2-react-flow-pilot-context";
import {
  loadPlanner2ReactFlowPilot,
  savePlanner2ReactFlowPilot
} from "@/lib/planner2-react-flow-pilot-storage";
import {
  pilotEdgeHandles,
  placeNewPilotNodeAdjacent,
  spreadPilotNodesAfterInsert
} from "@/lib/planner2-react-flow-pilot-layout";
import {
  DEFAULT_PLANNER_EVENT_NODE_DATA,
  PLANNER_INFO_KIND_OPTIONS,
  defaultPlannerInfoNodeData,
  type Planner2ReactFlowPilotPersisted,
  type PlannerEventNodeData,
  type PlannerInfoKind,
  type PlannerInfoNodeData,
  type PlannerPilotNode
} from "@/types/planner2-react-flow-pilot";

const nodeTypes = { event: Planner2ReactFlowEventNode, info: Planner2ReactFlowInfoNode };
const THREAD_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#65a30d",
  "#d97706",
  "#dc2626",
  "#db2777"
];

function colorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % THREAD_COLORS.length;
  return THREAD_COLORS[idx] ?? THREAD_COLORS[0];
}

function newEventNode(index: number): Node<PlannerEventNodeData> {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `ev-${Date.now()}-${index}`;
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    data: {
      ...DEFAULT_PLANNER_EVENT_NODE_DATA,
      title: `Event ${index + 1}`
    },
    id,
    position: { x: 40 + col * 280, y: 40 + row * 200 },
    type: "event"
  };
}

function newInfoNode(kind: PlannerInfoKind, index: number): Node<PlannerInfoNodeData> {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `inf-${Date.now()}-${index}`;
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    data: defaultPlannerInfoNodeData(kind),
    id,
    position: { x: 160 + col * 260, y: 100 + row * 200 },
    type: "info"
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
    data: {
      ...DEFAULT_PLANNER_EVENT_NODE_DATA,
      title: `Event ${index + 1}`
    },
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
    id,
    position: { ...position },
    type: "info"
  };
}

function pilotGraphEdgeAllowed(a: PlannerPilotNode, b: PlannerPilotNode): boolean {
  return !(a.type === "info" && b.type === "info");
}

type Planner2ReactFlowPilotProps = {
  campaignId: string;
};

/**
 * Pilot: event = „co”; osobne węzły informacji (jak, dlaczego, …).
 * Połączenia info–info są zablokowane; info łączy się tylko z eventem.
 */
export function Planner2ReactFlowPilot({ campaignId }: Planner2ReactFlowPilotProps) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<PlannerPilotNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [defaultViewport, setDefaultViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [threadOptions, setThreadOptions] = useState<PlannerThreadOption[]>([]);
  const viewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    setBootstrapped(false);
    const d = loadPlanner2ReactFlowPilot(campaignId);
    setNodes(d.nodes);
    setEdges(d.edges);
    setDefaultViewport(d.viewport);
    viewportRef.current = d.viewport;
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
          color: colorFromSeed(quest.id),
          id: quest.id,
          name: quest.name
        }))
      );
    })();
    return () => {
      canceled = true;
    };
  }, [campaignId]);

  const patchEventData = useCallback(
    (nodeId: string, partial: Partial<PlannerEventNodeData>) => {
      setNodes((nds) =>
        nds.map((n): PlannerPilotNode => {
          if (n.id !== nodeId || n.type !== "event") {
            return n;
          }
          const en = n as Node<PlannerEventNodeData>;
          return { ...en, data: { ...en.data, ...partial } };
        })
      );
    },
    [setNodes]
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
      patchEventData(nodeId, {
        threadColor: thread?.color,
        threadId: thread?.id,
        threadLabel: thread?.name
      });
    },
    [patchEventData]
  );

  const createThreadForEvent = useCallback(
    async (
      nodeId: string,
      name: string,
      color: string
    ): Promise<{ error?: string; thread?: PlannerThreadOption }> => {
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
      assignThreadToEvent(nodeId, nextThread);
      return { thread: nextThread };
    },
    [assignThreadToEvent, campaignId]
  );

  const addNodeFromNode = useCallback(
    (sourceId: string, spec: AddNodeFromNodeSpec) => {
      const newId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `n-${Date.now()}`;
      const side = spec.side;
      const snapshot = nodesRef.current;
      const src = snapshot.find((n) => n.id === sourceId);
      if (!src) {
        return;
      }
      const newType = spec.type === "event" ? "event" : "info";
      const pos = placeNewPilotNodeAdjacent(src, newType, side);
      const newNode: PlannerPilotNode =
        spec.type === "event"
          ? newPilotEventAt(snapshot, pos, newId)
          : newPilotInfoAt(snapshot, spec.kind, pos, newId);
      const addEdgeAfter = pilotGraphEdgeAllowed(src, newNode);

      setNodes((curr) => {
        if (curr.some((n) => n.id === newId)) {
          return curr;
        }
        if (!curr.some((n) => n.id === sourceId)) {
          return curr;
        }
        const withNew = [...curr, newNode];
        return spreadPilotNodesAfterInsert(withNew, newId);
      });

      if (addEdgeAfter) {
        const h = pilotEdgeHandles(side);
        setEdges((eds) =>
          addEdge(
            {
              animated: true,
              id: `e-${sourceId}-${newId}-${side}`,
              source: sourceId,
              sourceHandle: h.source,
              target: newId,
              targetHandle: h.target
            },
            eds
          )
        );
      }
    },
    [setEdges, setNodes]
  );

  const pilotContext = useMemo<Planner2ReactFlowPilotContextValue>(
    () => ({
      addNodeFromNode,
      assignThreadToEvent,
      campaignId,
      createThreadForEvent,
      patchEventData,
      patchInfoData,
      threadOptions
    }),
    [
      addNodeFromNode,
      assignThreadToEvent,
      campaignId,
      createThreadForEvent,
      patchEventData,
      patchInfoData,
      threadOptions
    ]
  );

  const persist = useCallback(() => {
    const payload: Planner2ReactFlowPilotPersisted = {
      edges,
      nodes,
      viewport: viewportRef.current
    };
    savePlanner2ReactFlowPilot(campaignId, payload);
  }, [campaignId, edges, nodes]);

  useEffect(() => {
    if (!bootstrapped) {
      return;
    }
    persist();
  }, [bootstrapped, edges, nodes, persist]);

  const isValidConnection = useCallback((edgeOrConn: Connection | Edge) => {
    const list = nodesRef.current;
    const sourceNode = list.find((n) => n.id === edgeOrConn.source);
    const targetNode = list.find((n) => n.id === edgeOrConn.target);
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
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );

  const onMoveEnd: OnMoveEnd = useCallback(
    (_e, viewport) => {
      viewportRef.current = viewport;
      if (!bootstrapped) {
        return;
      }
      savePlanner2ReactFlowPilot(campaignId, {
        edges,
        nodes,
        viewport
      });
    },
    [bootstrapped, campaignId, edges, nodes]
  );

  const addEvent = useCallback(() => {
    setNodes((nds) => [...nds, newEventNode(nds.length)]);
  }, [setNodes]);

  const addInfo = useCallback(
    (kind: PlannerInfoKind) => {
      setNodes((nds) => [...nds, newInfoNode(kind, nds.length)]);
    },
    [setNodes]
  );

  return (
    <Planner2ReactFlowPilotProvider value={pilotContext}>
      <Stack gap="xs" h="100%" style={{ minHeight: 0 }} w="100%">
        <Box style={{ flex: "0 0 auto", maxWidth: "100%", minWidth: 0 }}>
          <Group align="center" gap="sm" justify="space-between" wrap="nowrap">
            <Group gap="xs" style={{ flex: "1 1 auto", minWidth: 0 }} wrap="nowrap">
              <Button onClick={addEvent} size="xs" variant="filled">
                Dodaj event
              </Button>
              <Menu position="bottom-start" shadow="md" withinPortal>
                <Menu.Target>
                  <Button
                    rightSection={<IconChevronDown size={14} />}
                    size="xs"
                    variant="light"
                  >
                    Dodaj informację
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {PLANNER_INFO_KIND_OPTIONS.map(({ kind, label }) => (
                    <Menu.Item key={kind} onClick={() => addInfo(kind)}>
                      {label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            </Group>
            <Tooltip
              label="Event = Co. Węzły informacji łącz tylko z eventem (nie ze sobą). Przeciągaj kartę od tytułu lub ramki; Shift + uchwyt przesuwa go wzdłuż krawędzi."
              multiline
              maw={320}
              position="bottom"
              withArrow
            >
              <Text c="dimmed" size="xs" style={{ cursor: "help", flexShrink: 0 }}>
                Jak to działa?
              </Text>
            </Tooltip>
          </Group>
        </Box>
        <Box style={{ flex: 1, minHeight: 0, position: "relative", width: "100%" }}>
          <ReactFlow
            key={campaignId}
            connectionMode={ConnectionMode.Loose}
            defaultViewport={defaultViewport}
            edges={edges}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            nodes={nodes}
            onConnect={onConnect}
            onEdgesChange={onEdgesChange}
            onMoveEnd={onMoveEnd}
            onNodesChange={onNodesChange}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} variant={BackgroundVariant.Dots} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </Box>
      </Stack>
    </Planner2ReactFlowPilotProvider>
  );
}
