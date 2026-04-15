"use client";

import type { Edge } from "@xyflow/react";
import { createContext, useContext, type ReactNode } from "react";

import type { PilotEdgeSide } from "@/lib/planner2-react-flow-pilot-layout";
import type {
  PlannerEventNodeData,
  PlannerInfoKind,
  PlannerInfoNodeData,
  PlannerWorldEntryRef
} from "@/types/planner2-react-flow-pilot";

export type AddNodeFromNodeSpec =
  | { side: PilotEdgeSide; type: "event" }
  | { kind: PlannerInfoKind; side: PilotEdgeSide; type: "info" };

export type PlannerThreadOption = {
  color: string;
  id: string;
  name: string;
};

export type PlannerCharacterOption = {
  id: string;
  name: string;
};

export type PlannerWorldCollectionOption = {
  icon: string | null;
  id: string;
  pluralName: string;
  singularName: string;
  slug: string;
};

export type PlannerWorldEntryOption = {
  collectionId: string;
  collectionPluralName: string;
  collectionSingularName: string;
  collectionSlug: string;
  entryId: string;
  name: string;
  portrait_url: string | null;
};

export type Planner2ReactFlowPilotContextValue = {
  addNodeFromNode: (sourceId: string, spec: AddNodeFromNodeSpec) => void;
  assignThreadToEvent: (nodeId: string, thread: PlannerThreadOption | null) => void;
  campaignId: string;
  characterOptions: PlannerCharacterOption[];
  createWorldEntryInline: (
    collectionId: string,
    name: string
  ) => Promise<PlannerWorldEntryOption | null>;
  closeEventDetails: () => void;
  createThreadForEvent: (
    nodeId: string,
    name: string,
    color: string
  ) => Promise<{ error?: string; thread?: PlannerThreadOption }>;
  focusedThreadId: string | null;
  setFocusedThreadId: (id: string | null) => void;
  /** Zwraca etykietę numeryczną eventu w jego wątku, np. "3" lub "3a". */
  getEventLabel: (nodeId: string) => string | undefined;
  /** Zwraca posortowane nodeId eventów należących do wątku (bez ghostów), w kolejności etykiet. */
  getThreadEventIds: (threadId: string) => string[];
  insertEventOnEdge: (edge: Edge) => void;
  openEventDetails: (nodeId: string) => void;
  patchEventData: (nodeId: string, partial: Partial<PlannerEventNodeData>) => void;
  patchInfoData: (nodeId: string, partial: Partial<PlannerInfoNodeData>) => void;
  resolveEventNodeId: (nodeId: string) => string;
  threadOptions: PlannerThreadOption[];
  worldCollections: PlannerWorldCollectionOption[];
  worldEntryOptions: PlannerWorldEntryOption[];
  worldEntryRefHref: (ref: PlannerWorldEntryRef) => string;
};

const Planner2ReactFlowPilotContext = createContext<Planner2ReactFlowPilotContextValue | null>(
  null
);

export function Planner2ReactFlowPilotProvider({
  children,
  value
}: {
  children: ReactNode;
  value: Planner2ReactFlowPilotContextValue;
}) {
  return (
    <Planner2ReactFlowPilotContext.Provider value={value}>
      {children}
    </Planner2ReactFlowPilotContext.Provider>
  );
}

export function usePlanner2ReactFlowPilot() {
  const ctx = useContext(Planner2ReactFlowPilotContext);
  if (!ctx) {
    throw new Error("usePlanner2ReactFlowPilot must be used within Planner2ReactFlowPilotProvider");
  }
  return ctx;
}
