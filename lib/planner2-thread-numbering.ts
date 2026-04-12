import type { Edge } from "@xyflow/react";

import type { PlannerEventNodeData, PlannerPilotNode } from "@/types/planner2-react-flow-pilot";

/**
 * Oblicza etykiety numeryczne eventów w ramach jednego wątku.
 *
 * Schemat numerowania (per-wątek):
 * - Liniowy ciąg: 1, 2, 3, 4 …
 * - Rozgałęzienie z węzła N: pierwsze dziecko = N+1, kolejne = N+1+"a", N+1+"b" …
 * - Wiele korzeni: 1, 1a, 1b …
 * - Węzły ghost (kopie z widoku postaci): dziedziczą etykietę źródła
 *
 * Zwraca Map<nodeId, label> tylko dla eventów należących do podanego threadId.
 */
export function computeThreadNumbering(
  nodes: PlannerPilotNode[],
  edges: Edge[],
  threadId: string
): Map<string, string> {
  // 1. Zbierz event-węzły należące do wątku (bez ghostów — dostaną etykietę po DFS)
  const threadNodes = nodes.filter((n) => {
    if (n.type !== "event") return false;
    const d = n.data as PlannerEventNodeData;
    return d.threadId === threadId && !d.ghostSourceId;
  });

  const threadNodeIds = new Set(threadNodes.map((n) => n.id));

  // 2. Zbuduj graf dzieci i in-degree w podgrafie
  const childrenMap = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const n of threadNodes) {
    childrenMap.set(n.id, []);
    inDegree.set(n.id, 0);
  }
  for (const e of edges) {
    if (threadNodeIds.has(e.source) && threadNodeIds.has(e.target)) {
      childrenMap.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    }
  }

  // 3. Posortuj dzieci każdego węzła po Y (góra → dół = pierwsze dziecko = główna ścieżka)
  const nodeById = new Map(threadNodes.map((n) => [n.id, n]));
  for (const children of childrenMap.values()) {
    children.sort((a, b) => {
      const ya = nodeById.get(a)?.position.y ?? 0;
      const yb = nodeById.get(b)?.position.y ?? 0;
      return ya - yb;
    });
  }

  // 4. Znajdź korzenie (in-degree = 0), posortowane po Y
  const roots = threadNodes
    .filter((n) => (inDegree.get(n.id) ?? 0) === 0)
    .sort((a, b) => a.position.y - b.position.y);

  // 5. DFS — przypisz etykiety
  const result = new Map<string, string>();
  const visited = new Set<string>();

  function dfs(nodeId: string, label: string): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    result.set(nodeId, label);

    const children = childrenMap.get(nodeId) ?? [];
    if (children.length === 0) return;

    // Wyciągnij część numeryczną z etykiety ("3a" → 3, "1" → 1)
    const numPart = parseInt(label, 10);
    const nextNum = numPart + 1;

    for (let i = 0; i < children.length; i++) {
      const suffix = i === 0 ? "" : String.fromCharCode(96 + i); // "" | "a" | "b" …
      dfs(children[i]!, `${nextNum}${suffix}`);
    }
  }

  // Uruchom DFS od korzeni (wiele korzeni → etykiety 1, 1a, 1b …)
  for (let i = 0; i < roots.length; i++) {
    const suffix = i === 0 ? "" : String.fromCharCode(96 + i);
    dfs(roots[i]!.id, `1${suffix}`);
  }

  // 6. Ghost-węzły dziedziczą etykietę węzła źródłowego
  for (const n of nodes) {
    if (n.type !== "event") continue;
    const d = n.data as PlannerEventNodeData;
    if (!d.ghostSourceId || d.threadId !== threadId) continue;
    const sourceLabel = result.get(d.ghostSourceId);
    if (sourceLabel !== undefined) {
      result.set(n.id, sourceLabel);
    }
  }

  return result;
}
