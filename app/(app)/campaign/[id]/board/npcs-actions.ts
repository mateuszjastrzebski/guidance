"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type PlannerNpcForBoard = {
  id: string;
  name: string;
  portrait_url: string | null;
};

export type ListNpcsForBoardResult =
  | { ok: true; npcs: PlannerNpcForBoard[] }
  | { ok: false; error: string };

export async function listNpcsForBoard(campaignId: string): Promise<ListNpcsForBoardResult> {
  if (!isUuid(campaignId)) {
    return { ok: false, error: "Nieprawidłowa kampania." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Musisz być zalogowany." };
  }

  const { data, error } = await supabase
    .from("npcs")
    .select("id, name, portrait_url")
    .eq("campaign_id", campaignId)
    .order("name", { ascending: true });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nie udało się pobrać NPC." };
  }

  const npcs: PlannerNpcForBoard[] = data.map((row) => ({
    id: row.id,
    name: row.name,
    portrait_url: row.portrait_url
  }));

  return { ok: true, npcs };
}

export type CreateNpcForBoardResult =
  | { ok: true; npc: PlannerNpcForBoard }
  | { ok: false; error: string };

export async function createNpcForBoard(
  campaignId: string,
  name: string
): Promise<CreateNpcForBoardResult> {
  if (!isUuid(campaignId)) {
    return { ok: false, error: "Nieprawidłowa kampania." };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Podaj nazwę NPC." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Musisz być zalogowany." };

  const { data: member, error: memberErr } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr || !member) return { ok: false, error: "Nie jesteś członkiem tej kampanii." };
  if (member.role !== "gm") return { ok: false, error: "Tylko MG może dodać NPC." };

  const { data, error: insertErr } = await supabase
    .from("npcs")
    .insert({
      campaign_id: campaignId,
      name: trimmed,
      description: null,
      level: null,
      portrait_url: null,
      hidden_notes: null
    })
    .select("id, name, portrait_url")
    .single();

  if (insertErr || !data) {
    return { ok: false, error: insertErr?.message ?? "Nie udało się utworzyć NPC." };
  }

  return {
    ok: true,
    npc: { id: data.id, name: data.name, portrait_url: data.portrait_url }
  };
}
