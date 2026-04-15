"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDefaultSceneSections, mapSceneRow, type SceneSection } from "@/lib/scenes";

function normalizeSections(input: SceneSection[]): SceneSection[] {
  return input
    .map((section, index) => ({
      body: section.body ?? "",
      id: section.id,
      order: Number.isFinite(section.order) ? section.order : index,
      title: (section.title ?? "").trim() || `Sekcja ${index + 1}`
    }))
    .sort((a, b) => a.order - b.order);
}

export async function createScene(
  campaignId: string,
  options?: { sourceEventId?: string; sessionNumber?: number | null }
): Promise<{ ok: boolean; sceneId?: string; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Musisz być zalogowany." };
  }

  const sourceEventId = options?.sourceEventId ?? null;
  let insertPayload: Record<string, unknown> = {
    campaign_id: campaignId,
    description: "",
    name: "Nowa scena",
    outline_sections: createDefaultSceneSections(),
    source_type: "manual",
    sync_with_source: false
  };

  if (sourceEventId) {
    const { data: eventRow, error: eventError } = await supabase
      .from("planner_events")
      .select(
        "id, planner_node_id, title, co, dlaczego, thread_id, thread_label, thread_color, character_ids, npc_ids, location_ids"
      )
      .eq("campaign_id", campaignId)
      .eq("id", sourceEventId)
      .single();

    if (eventError || !eventRow) {
      return { ok: false, error: eventError?.message ?? "Nie znaleziono eventu." };
    }

    insertPayload = {
      campaign_id: campaignId,
      character_ids: eventRow.character_ids ?? [],
      description: eventRow.co ?? "",
      location_ids: eventRow.location_ids ?? [],
      name: eventRow.title?.trim() || "Scena z eventu",
      npc_ids: eventRow.npc_ids ?? [],
      outline_sections: createDefaultSceneSections(),
      source_event_id: eventRow.id,
      source_event_node_id: eventRow.planner_node_id,
      source_event_snapshot: {
        co: eventRow.co ?? "",
        dlaczego: eventRow.dlaczego ?? "",
        title: eventRow.title ?? ""
      },
      source_type: "planner_event",
      sync_with_source: true,
      thread_color: eventRow.thread_color,
      thread_id: eventRow.thread_id,
      thread_label: eventRow.thread_label
    };
  }

  const { data: sceneRow, error: sceneError } = await supabase
    .from("scenes")
    .insert(insertPayload)
    .select(
      "id, campaign_id, name, status, outline_sections, source_type, source_event_id, source_event_node_id, source_event_snapshot, sync_with_source, thread_id, thread_label, thread_color, character_ids, npc_ids, location_ids, created_at, updated_at"
    )
    .single();

  if (sceneError || !sceneRow) {
    return { ok: false, error: sceneError?.message ?? "Nie udało się utworzyć sceny." };
  }

  if (options?.sessionNumber != null) {
    const { data: existing } = await supabase
      .from("scene_session_links")
      .select("position")
      .eq("campaign_id", campaignId)
      .eq("session_number", options.sessionNumber)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from("scene_session_links").insert({
      campaign_id: campaignId,
      position: (existing?.position ?? -1) + 1,
      scene_id: sceneRow.id,
      session_number: options.sessionNumber
    });
  }

  revalidatePath(`/campaign/${campaignId}/scenes`);
  revalidatePath(`/campaign/${campaignId}/session-dashboard`);
  return { ok: true, sceneId: sceneRow.id };
}

export async function updateSceneTitle(
  campaignId: string,
  sceneId: string,
  title: string
): Promise<{ ok: boolean; error?: string; savedAt?: string }> {
  const trimmed = title.trim();
  if (!trimmed) {
    return { ok: false, error: "Tytuł sceny nie może być pusty." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("scenes")
    .update({ name: trimmed })
    .eq("campaign_id", campaignId)
    .eq("id", sceneId)
    .select("updated_at")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/campaign/${campaignId}/scenes`);
  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`);
  revalidatePath(`/campaign/${campaignId}/session-dashboard`);
  return { ok: true, savedAt: data?.updated_at };
}

export async function updateSceneSections(
  campaignId: string,
  sceneId: string,
  sections: SceneSection[]
): Promise<{ ok: boolean; savedAt?: string; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const normalized = normalizeSections(sections);
  const { data, error } = await supabase
    .from("scenes")
    .update({ outline_sections: normalized })
    .eq("campaign_id", campaignId)
    .eq("id", sceneId)
    .select("updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nie udało się zapisać sceny." };
  }

  revalidatePath(`/campaign/${campaignId}/scenes/${sceneId}`);
  revalidatePath(`/campaign/${campaignId}/session-dashboard`);
  return { ok: true, savedAt: data.updated_at };
}

export async function addSceneToSession(
  campaignId: string,
  sceneId: string,
  sessionNumber: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: latestLink } = await supabase
    .from("scene_session_links")
    .select("position")
    .eq("campaign_id", campaignId)
    .eq("session_number", sessionNumber)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("scene_session_links").upsert(
    {
      campaign_id: campaignId,
      position: (latestLink?.position ?? -1) + 1,
      scene_id: sceneId,
      session_number: sessionNumber
    },
    { onConflict: "scene_id,session_number" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/campaign/${campaignId}/session-dashboard`);
  revalidatePath(`/campaign/${campaignId}/scenes`);
  return { ok: true };
}

export async function removeSceneFromSession(
  campaignId: string,
  sceneId: string,
  sessionNumber: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("scene_session_links")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("scene_id", sceneId)
    .eq("session_number", sessionNumber);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/campaign/${campaignId}/session-dashboard`);
  revalidatePath(`/campaign/${campaignId}/scenes`);
  return { ok: true };
}

export async function reorderSessionScenes(
  campaignId: string,
  sessionNumber: number,
  orderedSceneIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  for (const [index, sceneId] of orderedSceneIds.entries()) {
    const { error } = await supabase
      .from("scene_session_links")
      .update({ position: index })
      .eq("campaign_id", campaignId)
      .eq("session_number", sessionNumber)
      .eq("scene_id", sceneId);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidatePath(`/campaign/${campaignId}/session-dashboard`);
  return { ok: true };
}

export async function listScenesForCampaign(campaignId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("scenes")
    .select(
      "id, campaign_id, name, status, outline_sections, source_type, source_event_id, source_event_node_id, source_event_snapshot, sync_with_source, thread_id, thread_label, thread_color, character_ids, npc_ids, location_ids, created_at, updated_at, scene_session_links(session_number)"
    )
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return {
    ok: true as const,
    scenes: (data ?? []).map((row) =>
      mapSceneRow(
        row,
        (row.scene_session_links ?? []).map((link: { session_number: number }) => link.session_number)
      )
    )
  };
}
