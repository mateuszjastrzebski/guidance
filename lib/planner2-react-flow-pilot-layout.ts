import type { PlannerPilotNode } from "@/types/planner2-react-flow-pilot";

/** Odstęp między szacunkowymi prostokątami węzłów (px). */
export const PLANNER_PILOT_NODE_GAP = 24;

/** Kierunek dodania nowego węzła od źródła (środek danej krawędzi). */
export type PilotEdgeSide = "bottom" | "left" | "right" | "top";

export const PILOT_EDGE_SIDES: PilotEdgeSide[] = ["top", "right", "bottom", "left"];

/** Uchwyty: wychodzimy ze źródła po `source`, wchodzimy w cel po `target`. */
export function pilotEdgeHandles(side: PilotEdgeSide): { source: string; target: string } {
  switch (side) {
    case "right":
      return { source: "right", target: "left" };
    case "left":
      return { source: "left", target: "right" };
    case "bottom":
      return { source: "bottom", target: "top" };
    case "top":
      return { source: "top", target: "bottom" };
  }
}

/** Uchwyt „wejściowy” po przeciwnej stronie węzła względem kierunku krawędzi. */
export function oppositePilotHandle(handle: string): "bottom" | "left" | "right" | "top" {
  switch (handle) {
    case "left":
      return "right";
    case "right":
      return "left";
    case "top":
      return "bottom";
    case "bottom":
      return "top";
    default:
      return "left";
  }
}

const EST_INFO = { h: 180, w: 260 } as const;

/**
 * Zewnętrzny prostokąt karty eventu (padding 40 + min. szerokość 260) — zgodny z `EventNodeInner`.
 * Używany w kolizjach / rozsunięciu i w podglądzie wstawiania (1:1 z kaflem).
 */
export const PLANNER_EVENT_OUTER_PX = { h: 400, w: 340 } as const;

const EST_EVENT = {
  h: PLANNER_EVENT_OUTER_PX.h,
  w: PLANNER_EVENT_OUTER_PX.w
} as const;

export function estimatedNodeSize(nodeType: string | undefined): { h: number; w: number } {
  return nodeType === "info" ? EST_INFO : EST_EVENT;
}

export type PilotNodeRect = { h: number; w: number; x: number; y: number };

export function pilotNodeRect(n: PlannerPilotNode): PilotNodeRect {
  const { h, w } = estimatedNodeSize(n.type);
  return { h, w, x: n.position.x, y: n.position.y };
}

/** Pozycja lewego górnego rogu nowego węzła obok wybranej krawędzi źródła. */
export function placeNewPilotNodeAdjacent(
  source: PlannerPilotNode,
  newType: "event" | "info",
  side: PilotEdgeSide
): { x: number; y: number } {
  const sr = pilotNodeRect(source);
  const { h: nh, w: nw } = estimatedNodeSize(newType);
  const g = PLANNER_PILOT_NODE_GAP;

  switch (side) {
    case "right":
      return { x: sr.x + sr.w + g, y: source.position.y };
    case "left":
      return { x: sr.x - nw - g, y: source.position.y };
    case "bottom":
      return { x: source.position.x, y: sr.y + sr.h + g };
    case "top":
      return { x: source.position.x, y: sr.y - nh - g };
  }
}

function rectsOverlap(
  a: PilotNodeRect,
  b: PilotNodeRect,
  gap: number
): boolean {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}

/** Minimalne przesunięcie B, żeby nie nachodził na A (A nieruchome). */
function separationDelta(
  a: PilotNodeRect,
  b: PilotNodeRect,
  gap: number
): { dx: number; dy: number } {
  const overlapX =
    Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const overlapY =
    Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (overlapX <= 0 || overlapY <= 0) {
    return { dx: 0, dy: 0 };
  }

  const moveRight = a.x + a.w + gap - b.x;
  const moveLeft = a.x - gap - (b.x + b.w);
  const moveDown = a.y + a.h + gap - b.y;
  const moveUp = a.y - gap - (b.y + b.h);

  if (overlapX <= overlapY) {
    const dx =
      Math.abs(moveRight) <= Math.abs(moveLeft) ? moveRight : moveLeft;
    return { dx, dy: 0 };
  }
  const dy =
    Math.abs(moveDown) <= Math.abs(moveUp) ? moveDown : moveUp;
  return { dx: 0, dy };
}

function shiftNode(
  n: PlannerPilotNode,
  dx: number,
  dy: number
): PlannerPilotNode {
  return {
    ...n,
    position: { x: n.position.x + dx, y: n.position.y + dy }
  };
}

function cloneNodesForLayout(nodes: PlannerPilotNode[]): PlannerPilotNode[] {
  return nodes.map((n) => ({
    ...n,
    data: { ...n.data },
    position: { ...n.position }
  })) as PlannerPilotNode[];
}

/**
 * Wstawiony węzeł `newId` zostaje na miejscu; pozostałe są przesuwane,
 * żeby nie nachodzić na niego, potem krótka relaksacja par.
 */
export function spreadPilotNodesAfterInsert(
  nodes: PlannerPilotNode[],
  newId: string
): PlannerPilotNode[] {
  const list = cloneNodesForLayout(nodes);
  const gap = PLANNER_PILOT_NODE_GAP;

  const resolveVsAnchor = (anchorId: string, iterations: number) => {
    for (let it = 0; it < iterations; it++) {
      const anchor = list.find((n) => n.id === anchorId);
      if (!anchor) {
        return;
      }
      const ar = pilotNodeRect(anchor);
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === anchorId) {
          continue;
        }
        const br = pilotNodeRect(list[i]);
        if (!rectsOverlap(ar, br, 0)) {
          continue;
        }
        const { dx, dy } = separationDelta(ar, br, gap);
        if (dx !== 0 || dy !== 0) {
          list[i] = shiftNode(list[i], dx, dy);
        }
      }
    }
  };

  resolveVsAnchor(newId, 6);

  const relaxPairs = (iterations: number) => {
    for (let it = 0; it < iterations; it++) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const ai = pilotNodeRect(list[i]);
          const bj = pilotNodeRect(list[j]);
          if (!rectsOverlap(ai, bj, gap)) {
            continue;
          }
          const { dx, dy } = separationDelta(ai, bj, gap);
          if (dx !== 0 || dy !== 0) {
            list[j] = shiftNode(list[j], dx, dy);
          }
        }
      }
    }
  };

  relaxPairs(3);

  return list;
}
