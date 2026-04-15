import type { SupabaseClient } from "@supabase/supabase-js";

import { stripGhostEventNodes } from "@/lib/planner2-character-dup";
import {
  loadPlanner2ReactFlowPilot as loadPlanner2ReactFlowPilotLocal,
  type Planner2ReactFlowPilotPersistedLocal
} from "@/lib/planner2-react-flow-pilot-storage";
import type {
  Planner2ReactFlowPilotPersisted,
  PlannerEventNodeData,
  PlannerLayoutSnapshot,
  PlannerLaneOrders,
  PlannerPilotNode,
  PlannerViewMode,
  PlannerWorldEntryRef
} from "@/types/planner2-react-flow-pilot";

export type PlannerEventRecord = {
  campaign_id: string;
  character_ids: string[];
  co: string;
  dlaczego: string;
  id: string;
  location_ids: string[];
  npc_ids: string[];
  planner_node_id: string;
  sort_position: number | null;
  thread_color: string | null;
  thread_id: string | null;
  thread_label: string | null;
  title: string;
  updated_at: string;
  world_entry_refs: PlannerWorldEntryRef[];
};

type PlannerGraphStateRow = {
  campaign_id: string;
  edges_json: unknown;
  lane_orders_json: unknown;
  layouts_json: unknown;
  nodes_json: unknown;
  version: number | null;
};

type PlannerEventRow = {
  campaign_id: string;
  character_ids: string[] | null;
  co: string | null;
  dlaczego: string | null;
  id: string;
  location_ids: string[] | null;
  npc_ids: string[] | null;
  planner_node_id: string;
  sort_position: number | null;
  thread_color: string | null;
  thread_id: string | null;
  thread_label: string | null;
  title: string | null;
  updated_at: string;
  world_entry_refs: unknown;
};

function isMissingWorldEntryRefsColumn(message: string | undefined): boolean {
  return (message ?? "").includes("world_entry_refs");
}

function plannerEventsSelect(includeWorldEntryRefs: boolean): string {
  const base =
    "id, campaign_id, planner_node_id, title, co, dlaczego, thread_id, thread_label, thread_color, character_ids, npc_ids, location_ids, sort_position, updated_at";
  return includeWorldEntryRefs ? `${base}, world_entry_refs` : base;
}

function normalizePlannerWorldEntryRefs(raw: unknown): PlannerWorldEntryRef[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((value): value is Record<string, unknown> => !!value && typeof value === "object")
    .map((value) => ({
      collectionId:
        typeof value.collectionId === "string"
          ? value.collectionId
          : typeof value.collection_id === "string"
            ? value.collection_id
            : "",
      collectionSlug:
        typeof value.collectionSlug === "string"
          ? value.collectionSlug
          : typeof value.collection_slug === "string"
            ? value.collection_slug
            : "",
      entryId:
        typeof value.entryId === "string"
          ? value.entryId
          : typeof value.entry_id === "string"
            ? value.entry_id
            : ""
    }))
    .filter((value) => value.collectionId && value.collectionSlug && value.entryId);
}

export type PlannerGraphLoadResult = {
  eventRecords: PlannerEventRecord[];
  migratedFromLocal: boolean;
  payload: Planner2ReactFlowPilotPersisted;
};

function emptyLayout(): PlannerLayoutSnapshot {
  return {
    positions: {},
    viewport: { x: 0, y: 0, zoom: 1 }
  };
}

export function createEmptyPlannerPersisted(): Planner2ReactFlowPilotPersisted {
  return {
    edges: [],
    laneOrders: { byCharacter: {}, byThread: {} },
    layouts: {
      freeform: emptyLayout(),
      swimlane_character: emptyLayout(),
      swimlane_thread: emptyLayout()
    },
    nodes: [],
    version: 2
  };
}

function sanitizeLaneOrders(raw: unknown): PlannerLaneOrders {
  if (!raw || typeof raw !== "object") {
    return { byCharacter: {}, byThread: {} };
  }
  const source = raw as Record<string, unknown>;
  return {
    byCharacter: Object.fromEntries(
      Object.entries((source.byCharacter as Record<string, unknown>) ?? {}).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
      ])
    ),
    byThread: Object.fromEntries(
      Object.entries((source.byThread as Record<string, unknown>) ?? {}).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
      ])
    )
  };
}

function sanitizeLayouts(raw: unknown): Record<PlannerViewMode, PlannerLayoutSnapshot> {
  const base = {
    freeform: emptyLayout(),
    swimlane_character: emptyLayout(),
    swimlane_thread: emptyLayout()
  };

  if (!raw || typeof raw !== "object") {
    return base;
  }

  for (const mode of Object.keys(base) as PlannerViewMode[]) {
    const maybe = (raw as Record<string, unknown>)[mode];
    if (!maybe || typeof maybe !== "object") {
      continue;
    }
    const layout = maybe as Record<string, unknown>;
    const positions: Record<string, { x: number; y: number }> = {};
    if (layout.positions && typeof layout.positions === "object") {
      for (const [key, value] of Object.entries(layout.positions as Record<string, unknown>)) {
        if (value && typeof value === "object") {
          const point = value as Record<string, unknown>;
          if (typeof point.x === "number" && typeof point.y === "number") {
            positions[key] = { x: point.x, y: point.y };
          }
        }
      }
    }

    const viewport =
      layout.viewport && typeof layout.viewport === "object"
        ? (() => {
            const point = layout.viewport as Record<string, unknown>;
            if (
              typeof point.x === "number" &&
              typeof point.y === "number" &&
              typeof point.zoom === "number"
            ) {
              return { x: point.x, y: point.y, zoom: point.zoom };
            }
            return base[mode].viewport;
          })()
        : base[mode].viewport;

    const threadScroll =
      layout.threadScroll && typeof layout.threadScroll === "object"
        ? (() => {
            const scroll = layout.threadScroll as Record<string, unknown>;
            if (typeof scroll.scrollLeft === "number" && typeof scroll.scrollTop === "number") {
              return { scrollLeft: scroll.scrollLeft, scrollTop: scroll.scrollTop };
            }
            return undefined;
          })()
        : undefined;

    base[mode] = threadScroll ? { positions, threadScroll, viewport } : { positions, viewport };
  }

  return base;
}

function mapPlannerEventRow(row: PlannerEventRow): PlannerEventRecord {
  return {
    campaign_id: row.campaign_id,
    character_ids: row.character_ids ?? [],
    co: row.co ?? "",
    dlaczego: row.dlaczego ?? "",
    id: row.id,
    location_ids: row.location_ids ?? [],
    npc_ids: row.npc_ids ?? [],
    planner_node_id: row.planner_node_id,
    sort_position: row.sort_position,
    thread_color: row.thread_color ?? null,
    thread_id: row.thread_id ?? null,
    thread_label: row.thread_label ?? null,
    title: row.title ?? "",
    updated_at: row.updated_at,
    world_entry_refs: normalizePlannerWorldEntryRefs(row.world_entry_refs)
  };
}

function collectPlannerEventRows(
  campaignId: string,
  payload: Planner2ReactFlowPilotPersisted
): Array<Omit<PlannerEventRecord, "id" | "updated_at">> {
  const threadOrderLookup = new Map<string, Map<string, number>>();
  for (const [threadId, nodeIds] of Object.entries(payload.laneOrders.byThread)) {
    threadOrderLookup.set(
      threadId,
      new Map(nodeIds.map((nodeId, index) => [nodeId, index]))
    );
  }

  return stripGhostEventNodes(payload.nodes)
    .filter((node): node is PlannerPilotNode & { type: "event"; data: PlannerEventNodeData } => node.type === "event")
    .map((node) => {
      const orderMap = node.data.threadId ? threadOrderLookup.get(node.data.threadId) : undefined;
      return {
        ...(() => {
          const worldEntryRefs = node.data.worldEntryRefs ?? [];
          const legacyNpcIds = worldEntryRefs
            .filter((ref) => ref.collectionSlug === "npcs")
            .map((ref) => ref.entryId);
          const legacyLocationIds = worldEntryRefs
            .filter((ref) => ref.collectionSlug === "miejsca")
            .map((ref) => ref.entryId);
          return {
            location_ids: legacyLocationIds,
            npc_ids: legacyNpcIds,
            world_entry_refs: worldEntryRefs
          };
        })(),
        campaign_id: campaignId,
        character_ids: node.data.characterIds ?? [],
        co: node.data.co,
        dlaczego: node.data.dlaczego,
        planner_node_id: node.id,
        sort_position: orderMap?.get(node.id) ?? null,
        thread_color: node.data.threadColor ?? null,
        thread_id: node.data.threadId ?? null,
        thread_label: node.data.threadLabel ?? null,
        title: node.data.title
      };
    });
}

async function syncScenesFromPlannerEvents(
  supabase: SupabaseClient,
  campaignId: string,
  payload: Planner2ReactFlowPilotPersisted
) {
  const eventRows = collectPlannerEventRows(campaignId, payload);
  if (eventRows.length === 0) {
    return;
  }

  const { data: storedEventRows } = await supabase
    .from("planner_events")
    .select("id, planner_node_id")
    .eq("campaign_id", campaignId);

  const plannerIdMap = new Map((storedEventRows ?? []).map((row) => [row.planner_node_id, row.id]));

  for (const row of eventRows) {
    const storedEventId = plannerIdMap.get(row.planner_node_id);
    if (!storedEventId) {
      continue;
    }

    await supabase
      .from("scenes")
      .update({
        character_ids: row.character_ids,
        location_ids: row.location_ids,
        name: row.title.trim() || "Scena bez tytułu",
        npc_ids: row.npc_ids,
        source_event_node_id: row.planner_node_id,
        source_event_snapshot: {
          co: row.co,
          dlaczego: row.dlaczego,
          thread_color: row.thread_color,
          thread_id: row.thread_id,
          thread_label: row.thread_label,
          title: row.title,
          worldEntryRefs: row.world_entry_refs
        },
        thread_color: row.thread_color,
        thread_id: row.thread_id,
        thread_label: row.thread_label
      })
      .eq("campaign_id", campaignId)
      .eq("source_event_id", storedEventId)
      .eq("sync_with_source", true);
  }
}

async function insertPlannerEventRows(
  supabase: SupabaseClient,
  eventRows: Array<Omit<PlannerEventRecord, "id" | "updated_at">>
) {
  const { error } = await supabase.from("planner_events").insert(eventRows);
  if (!error) {
    return;
  }

  if (!isMissingWorldEntryRefsColumn(error.message)) {
    throw new Error(error.message);
  }

  const legacyRows = eventRows.map(({ world_entry_refs, ...row }) => row);
  const { error: legacyError } = await supabase.from("planner_events").insert(legacyRows);
  if (legacyError) {
    throw new Error(legacyError.message);
  }
}

async function selectPlannerEventRows(
  supabase: SupabaseClient,
  campaignId: string
): Promise<PlannerEventRow[]> {
  const withRefs = await supabase
    .from("planner_events")
    .select(plannerEventsSelect(true))
    .eq("campaign_id", campaignId)
    .order("sort_position", { ascending: true, nullsFirst: false });

  if (!withRefs.error) {
    return (withRefs.data as unknown as PlannerEventRow[] | null) ?? [];
  }

  if (!isMissingWorldEntryRefsColumn(withRefs.error.message)) {
    throw new Error(withRefs.error.message);
  }

  const withoutRefs = await supabase
    .from("planner_events")
    .select(plannerEventsSelect(false))
    .eq("campaign_id", campaignId)
    .order("sort_position", { ascending: true, nullsFirst: false });

  if (withoutRefs.error) {
    throw new Error(withoutRefs.error.message);
  }

  return (((withoutRefs.data as unknown as Omit<PlannerEventRow, "world_entry_refs">[] | null) ?? []).map((row) => ({
    ...row,
    world_entry_refs: []
  })));
}

export async function savePlannerGraphToSupabase(
  supabase: SupabaseClient,
  campaignId: string,
  payload: Planner2ReactFlowPilotPersisted
): Promise<{ eventRecords: PlannerEventRecord[]; ok: true }> {
  const cleanPayload: Planner2ReactFlowPilotPersisted = {
    ...payload,
    nodes: stripGhostEventNodes(payload.nodes)
  };

  const { error: graphError } = await supabase.from("planner_graph_state").upsert(
    {
      campaign_id: campaignId,
      edges_json: cleanPayload.edges,
      lane_orders_json: cleanPayload.laneOrders,
      layouts_json: cleanPayload.layouts,
      nodes_json: cleanPayload.nodes,
      version: cleanPayload.version
    },
    { onConflict: "campaign_id" }
  );

  if (graphError) {
    throw new Error(graphError.message);
  }

  const eventRows = collectPlannerEventRows(campaignId, cleanPayload);
  await supabase.from("planner_events").delete().eq("campaign_id", campaignId);

  if (eventRows.length > 0) {
    await insertPlannerEventRows(supabase, eventRows);
  }

  const storedEventRows = await selectPlannerEventRows(supabase, campaignId);

  await syncScenesFromPlannerEvents(supabase, campaignId, cleanPayload);

  return {
    eventRecords: (storedEventRows ?? []).map(mapPlannerEventRow),
    ok: true
  };
}

export async function loadPlannerGraphFromSupabase(
  supabase: SupabaseClient,
  campaignId: string,
  localFallback?: Planner2ReactFlowPilotPersistedLocal | null
): Promise<PlannerGraphLoadResult> {
  const { data: graphRow, error: graphError } = await supabase
    .from("planner_graph_state")
    .select("campaign_id, nodes_json, edges_json, lane_orders_json, layouts_json, version")
    .eq("campaign_id", campaignId)
    .maybeSingle<PlannerGraphStateRow>();

  if (graphError) {
    throw new Error(graphError.message);
  }

  if (!graphRow && localFallback) {
    const payload: Planner2ReactFlowPilotPersisted = {
      ...localFallback,
      nodes: stripGhostEventNodes(localFallback.nodes),
      version: 2
    };
    const saved = await savePlannerGraphToSupabase(supabase, campaignId, payload);
    return { eventRecords: saved.eventRecords, migratedFromLocal: true, payload };
  }

  const payload = graphRow
    ? {
        edges: Array.isArray(graphRow.edges_json) ? graphRow.edges_json : [],
        laneOrders: sanitizeLaneOrders(graphRow.lane_orders_json),
        layouts: sanitizeLayouts(graphRow.layouts_json),
        nodes: Array.isArray(graphRow.nodes_json)
          ? (stripGhostEventNodes(graphRow.nodes_json as PlannerPilotNode[]) as PlannerPilotNode[])
          : [],
        version: 2 as const
      }
    : createEmptyPlannerPersisted();

  const eventRows = await selectPlannerEventRows(supabase, campaignId);

  return {
    eventRecords: (eventRows ?? []).map(mapPlannerEventRow),
    migratedFromLocal: false,
    payload
  };
}

export function readLegacyPlannerPayload(campaignId: string) {
  return loadPlanner2ReactFlowPilotLocal(campaignId);
}
