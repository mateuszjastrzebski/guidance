"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type EntityRef =
  | { type: "event"; id: string }
  | { type: "location"; id: string }
  | { type: "npc"; id: string }
  | { type: "quest"; id: string };

export type PlayerInfoWithReveals = {
  id: string;
  content: string;
  sort_order: number;
  revealedCharacterIds: string[];
};

export type ListPlayerInfosResult =
  | { ok: true; infos: PlayerInfoWithReveals[] }
  | { ok: false; error: string };

export async function listPlayerInfosForEntity(
  campaignId: string,
  ref: EntityRef
): Promise<ListPlayerInfosResult> {
  if (!isUuid(campaignId)) {
    return { ok: false, error: "Nieprawidłowa kampania." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Musisz być zalogowany." };

  let query = supabase
    .from("player_infos")
    .select("id, content, sort_order, player_info_reveals(character_id)")
    .eq("campaign_id", campaignId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (ref.type === "event") {
    query = query.eq("planner_event_id", ref.id);
  } else if (ref.type === "location") {
    if (!isUuid(ref.id)) return { ok: false, error: "Nieprawidłowa lokacja." };
    query = query.eq("location_id", ref.id);
  } else if (ref.type === "npc") {
    if (!isUuid(ref.id)) return { ok: false, error: "Nieprawidłowy NPC." };
    query = query.eq("npc_id", ref.id);
  } else if (ref.type === "quest") {
    if (!isUuid(ref.id)) return { ok: false, error: "Nieprawidłowy quest." };
    query = query.eq("quest_id", ref.id);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nie udało się pobrać informacji." };
  }

  const infos: PlayerInfoWithReveals[] = data.map((row) => ({
    id: row.id,
    content: row.content,
    sort_order: row.sort_order,
    revealedCharacterIds: (row.player_info_reveals as { character_id: string }[]).map(
      (r) => r.character_id
    )
  }));

  return { ok: true, infos };
}

export type CreatePlayerInfoResult =
  | { ok: true; info: PlayerInfoWithReveals }
  | { ok: false; error: string };

export async function createPlayerInfo(
  campaignId: string,
  ref: EntityRef
): Promise<CreatePlayerInfoResult> {
  if (!isUuid(campaignId)) {
    return { ok: false, error: "Nieprawidłowa kampania." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Musisz być zalogowany." };

  const insert: Record<string, unknown> = {
    campaign_id: campaignId,
    content: "",
    created_by: user.id
  };

  if (ref.type === "event") {
    insert.planner_event_id = ref.id;
  } else if (ref.type === "location") {
    if (!isUuid(ref.id)) return { ok: false, error: "Nieprawidłowa lokacja." };
    insert.location_id = ref.id;
  } else if (ref.type === "npc") {
    if (!isUuid(ref.id)) return { ok: false, error: "Nieprawidłowy NPC." };
    insert.npc_id = ref.id;
  } else if (ref.type === "quest") {
    if (!isUuid(ref.id)) return { ok: false, error: "Nieprawidłowy quest." };
    insert.quest_id = ref.id;
  }

  const { data, error } = await supabase
    .from("player_infos")
    .insert(insert)
    .select("id, content, sort_order")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nie udało się utworzyć informacji." };
  }

  return {
    ok: true,
    info: { id: data.id, content: data.content, sort_order: data.sort_order, revealedCharacterIds: [] }
  };
}

export type SimpleResult = { ok: true } | { ok: false; error: string };

export async function updatePlayerInfoContent(
  infoId: string,
  content: string
): Promise<SimpleResult> {
  if (!isUuid(infoId)) return { ok: false, error: "Nieprawidłowe ID informacji." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Musisz być zalogowany." };

  const { error } = await supabase
    .from("player_infos")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", infoId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deletePlayerInfo(infoId: string): Promise<SimpleResult> {
  if (!isUuid(infoId)) return { ok: false, error: "Nieprawidłowe ID informacji." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Musisz być zalogowany." };

  const { error } = await supabase.from("player_infos").delete().eq("id", infoId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function revealInfoToCharacters(
  infoId: string,
  characterIds: string[]
): Promise<SimpleResult> {
  if (!isUuid(infoId)) return { ok: false, error: "Nieprawidłowe ID informacji." };
  if (characterIds.length === 0) return { ok: true };
  if (characterIds.some((id) => !isUuid(id))) return { ok: false, error: "Nieprawidłowe ID postaci." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Musisz być zalogowany." };

  const rows = characterIds.map((character_id) => ({
    info_id: infoId,
    character_id,
    revealed_by: user.id
  }));

  const { error } = await supabase
    .from("player_info_reveals")
    .upsert(rows, { onConflict: "info_id,character_id", ignoreDuplicates: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function revokeInfoFromCharacters(
  infoId: string,
  characterIds: string[]
): Promise<SimpleResult> {
  if (!isUuid(infoId)) return { ok: false, error: "Nieprawidłowe ID informacji." };
  if (characterIds.length === 0) return { ok: true };
  if (characterIds.some((id) => !isUuid(id))) return { ok: false, error: "Nieprawidłowe ID postaci." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Musisz być zalogowany." };

  const { error } = await supabase
    .from("player_info_reveals")
    .delete()
    .eq("info_id", infoId)
    .in("character_id", characterIds);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
