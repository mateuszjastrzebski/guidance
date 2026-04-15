import { notFound } from "next/navigation";

import { SceneDetailPage } from "@/components/campaign/scene-detail-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSceneSessionOccurrences,
  mapSceneRow,
  type SceneReferenceBundle
} from "@/lib/scenes";

type SceneDetailRouteProps = {
  params: Promise<{ id: string; sceneId: string }>;
};

function firstWorldCollectionMeta(
  value: { singular_name?: string; template_key?: string } | { singular_name?: string; template_key?: string }[] | null
) {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function byIds<T extends { id: string }>(rows: T[], ids: string[]) {
  const idSet = new Set(ids);
  return rows.filter((row) => idSet.has(row.id));
}

export default async function SceneDetailRoute({ params }: SceneDetailRouteProps) {
  const { id: campaignId, sceneId } = await params;
  const supabase = await createSupabaseServerClient();

  const [
    { data: sceneRow, error: sceneError },
    { data: characterRows },
    { data: questRows },
    { data: worldRows },
    occurrences
  ] = await Promise.all([
    supabase
      .from("scenes")
      .select(
        "id, campaign_id, name, status, outline_sections, source_type, source_event_id, source_event_node_id, source_event_snapshot, sync_with_source, thread_id, thread_label, thread_color, character_ids, npc_ids, location_ids, created_at, updated_at"
      )
      .eq("campaign_id", campaignId)
      .eq("id", sceneId)
      .single(),
    supabase.from("characters").select("id, name").eq("campaign_id", campaignId).order("name"),
    supabase
      .from("quests")
      .select("id, name, key_character_ids, key_npc_ids")
      .eq("campaign_id", campaignId)
      .order("name"),
    supabase
      .from("world_entries")
      .select("id, name, collection_id, world_collections!inner(template_key, singular_name)")
      .eq("campaign_id", campaignId)
      .order("name"),
    getSceneSessionOccurrences(supabase, campaignId, { id: sceneId, type: "scene" })
  ]);

  if (sceneError || !sceneRow) {
    notFound();
  }

  const scene = mapSceneRow(sceneRow);
  const threadQuest = (questRows ?? []).find((quest) => quest.id === scene.thread_id);
  const playerCharacters = byIds(characterRows ?? [], scene.character_ids).map((row) => ({
    id: row.id,
    name: row.name
  }));
  const threadCharacters = byIds(characterRows ?? [], threadQuest?.key_character_ids ?? []).map((row) => ({
    id: row.id,
    name: row.name
  }));
  const worldEntries = worldRows ?? [];
  const npcEntries = byIds(worldEntries, [...new Set([...(scene.npc_ids ?? []), ...((threadQuest?.key_npc_ids as string[] | null) ?? [])])]);
  const locationEntries = byIds(worldEntries, scene.location_ids);

  const references: SceneReferenceBundle = {
    characters: threadCharacters,
    locations: locationEntries.map((row) => ({ id: row.id, name: row.name })),
    npcs: npcEntries.map((row) => ({ id: row.id, name: row.name })),
    playerCharacters,
    searchResults: [
      ...(characterRows ?? []).map((row) => ({ id: row.id, kind: "character" as const, name: row.name, meta: "Postać" })),
      ...(questRows ?? []).map((row) => ({ id: row.id, kind: "quest" as const, name: row.name, meta: "Wątek" })),
      ...worldEntries.map((row) => ({
        id: row.id,
        kind: "world_entry" as const,
        name: row.name,
        meta: firstWorldCollectionMeta(
          row.world_collections as
            | { singular_name?: string; template_key?: string }
            | { singular_name?: string; template_key?: string }[]
            | null
        )?.singular_name
      }))
    ]
  };

  return (
    <SceneDetailPage
      campaignId={campaignId}
      occurrences={occurrences}
      references={references}
      scene={scene}
    />
  );
}
