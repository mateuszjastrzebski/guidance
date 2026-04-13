"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type PlannerLocationForBoard = {
  id: string;
  name: string;
};

export type ListLocationsForBoardResult =
  | { ok: true; locations: PlannerLocationForBoard[] }
  | { ok: false; error: string };

export async function listLocationsForBoard(
  campaignId: string
): Promise<ListLocationsForBoardResult> {
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
    .from("locations")
    .select("id, name")
    .eq("campaign_id", campaignId)
    .order("name", { ascending: true });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nie udało się pobrać lokacji." };
  }

  const locations: PlannerLocationForBoard[] = data.map((row) => ({
    id: row.id,
    name: row.name
  }));

  return { ok: true, locations };
}

export type CreateLocationForBoardResult =
  | { ok: true; location: PlannerLocationForBoard }
  | { ok: false; error: string };

export async function createLocationForBoard(
  campaignId: string,
  name: string
): Promise<CreateLocationForBoardResult> {
  if (!isUuid(campaignId)) {
    return { ok: false, error: "Nieprawidłowa kampania." };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Podaj nazwę lokacji." };
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
  if (member.role !== "gm") return { ok: false, error: "Tylko MG może dodać lokację." };

  const { data, error: insertErr } = await supabase
    .from("locations")
    .insert({
      campaign_id: campaignId,
      name: trimmed,
      description: null,
      hidden_notes: null
    })
    .select("id, name")
    .single();

  if (insertErr || !data) {
    return { ok: false, error: insertErr?.message ?? "Nie udało się utworzyć lokacji." };
  }

  return {
    ok: true,
    location: { id: data.id, name: data.name }
  };
}
