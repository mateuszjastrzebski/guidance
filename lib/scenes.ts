import type { SupabaseClient } from "@supabase/supabase-js";

export type SceneSourceType = "manual" | "planner_event";

export type SceneSection = {
  body: string;
  id: string;
  order: number;
  title: string;
};

export type SceneRecord = {
  campaign_id: string;
  character_ids: string[];
  created_at: string;
  id: string;
  location_ids: string[];
  name: string;
  npc_ids: string[];
  outline_sections: SceneSection[];
  session_numbers: number[];
  source_event_id: string | null;
  source_event_node_id: string | null;
  source_event_snapshot: Record<string, unknown>;
  source_type: SceneSourceType | null;
  status: string;
  sync_with_source: boolean;
  thread_color: string | null;
  thread_id: string | null;
  thread_label: string | null;
  updated_at: string;
};

export type SceneReferenceBundle = {
  characters: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
  npcs: Array<{ id: string; name: string }>;
  playerCharacters: Array<{ id: string; name: string }>;
  searchResults: Array<{
    id: string;
    kind: "character" | "quest" | "world_entry";
    meta?: string;
    name: string;
  }>;
};

export type SessionOccurrence = {
  campaignId: string;
  label: string;
  sceneId: string;
  sceneTitle: string;
  sessionNumber: number;
};

type SceneRowLike = {
  campaign_id: string;
  character_ids?: string[] | null;
  created_at: string;
  id: string;
  location_ids?: string[] | null;
  name: string;
  npc_ids?: string[] | null;
  outline_sections?: unknown;
  source_event_id?: string | null;
  source_event_node_id?: string | null;
  source_event_snapshot?: unknown;
  source_type?: string | null;
  status: string;
  sync_with_source?: boolean | null;
  thread_color?: string | null;
  thread_id?: string | null;
  thread_label?: string | null;
  updated_at?: string | null;
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultSceneSections(): SceneSection[] {
  return [
    { id: createId("scene"), title: "Wstęp", body: "", order: 0 },
    { id: createId("scene"), title: "Rozwinięcie", body: "", order: 1 },
    { id: createId("scene"), title: "Zakończenie", body: "", order: 2 }
  ];
}

export function normalizeSceneSections(raw: unknown): SceneSection[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((value): value is Record<string, unknown> => !!value && typeof value === "object")
    .map((section, index) => ({
      body: typeof section.body === "string" ? section.body : "",
      id: typeof section.id === "string" ? section.id : `section-${index}`,
      order: typeof section.order === "number" ? section.order : index,
      title: typeof section.title === "string" ? section.title : "Sekcja"
    }))
    .sort((a, b) => a.order - b.order);
}

export function mapSceneRow(row: SceneRowLike, sessionNumbers: number[] = []): SceneRecord {
  return {
    campaign_id: row.campaign_id,
    character_ids: row.character_ids ?? [],
    created_at: row.created_at,
    id: row.id,
    location_ids: row.location_ids ?? [],
    name: row.name,
    npc_ids: row.npc_ids ?? [],
    outline_sections: normalizeSceneSections(row.outline_sections),
    session_numbers: sessionNumbers,
    source_event_id: row.source_event_id ?? null,
    source_event_node_id: row.source_event_node_id ?? null,
    source_event_snapshot:
      row.source_event_snapshot && typeof row.source_event_snapshot === "object"
        ? (row.source_event_snapshot as Record<string, unknown>)
        : {},
    source_type:
      row.source_type === "manual" || row.source_type === "planner_event" ? row.source_type : null,
    status: row.status,
    sync_with_source: row.sync_with_source ?? false,
    thread_color: row.thread_color ?? null,
    thread_id: row.thread_id ?? null,
    thread_label: row.thread_label ?? null,
    updated_at: row.updated_at ?? row.created_at
  };
}

export async function getSceneSessionOccurrences(
  supabase: SupabaseClient,
  campaignId: string,
  entity:
    | { id: string; type: "scene" }
    | { id: string; type: "character" }
    | { id: string; type: "world_entry" }
    | { id: string; type: "quest" }
): Promise<SessionOccurrence[]> {
  const { data: linkRows, error } = await supabase
    .from("scene_session_links")
    .select("session_number, scene_id, scenes!inner(id, name, character_ids, npc_ids, location_ids, thread_id)")
    .eq("campaign_id", campaignId)
    .order("session_number", { ascending: false });

  if (error || !linkRows) {
    return [];
  }

  const filtered = linkRows.filter((row) => {
    const scene = Array.isArray(row.scenes) ? row.scenes[0] : row.scenes;
    if (!scene) {
      return false;
    }
    if (entity.type === "scene") {
      return scene.id === entity.id;
    }
    if (entity.type === "character") {
      return (scene.character_ids ?? []).includes(entity.id);
    }
    if (entity.type === "world_entry") {
      return (scene.npc_ids ?? []).includes(entity.id) || (scene.location_ids ?? []).includes(entity.id);
    }
    return scene.thread_id === entity.id;
  });

  return filtered.map((row) => {
    const scene = Array.isArray(row.scenes) ? row.scenes[0] : row.scenes;
    return {
      campaignId,
      label: `Sesja ${row.session_number}`,
      sceneId: scene.id,
      sceneTitle: scene.name,
      sessionNumber: row.session_number
    };
  });
}
