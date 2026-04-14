"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type CreatePlayerCharacterResult = { id: string } | { error: string };

export async function createPlayerCharacter(
  campaignId: string,
  name?: string
): Promise<CreatePlayerCharacterResult> {
  if (!isUuid(campaignId)) {
    return { error: "Nieprawidłowa kampania." };
  }

  const title = (name ?? "").trim() || "Nowa postać";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Musisz być zalogowany." };
  }

  const { data: member, error: memberErr } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr || !member) {
    return { error: "Nie jesteś członkiem tej kampanii." };
  }

  if (member.role !== "gm") {
    return { error: "Tylko MG może dodać postać." };
  }

  const { data, error: insertErr } = await supabase
    .from("characters")
    .insert({
      campaign_id: campaignId,
      name: title,
      level: null,
      player_id: null
    })
    .select("id")
    .single();

  if (insertErr || !data) {
    return { error: insertErr?.message ?? "Nie udało się utworzyć postaci." };
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "player_character_created",
    properties: {
      campaign_id: campaignId,
      character_name: title,
      level: null,
    },
  });
  await posthog.flush();

  revalidatePath(`/campaign/${campaignId}`, "layout");
  return { id: data.id };
}

export type UpdatePlayerCharacterResult = { error?: string };

export async function updatePlayerCharacter(
  characterId: string,
  campaignId: string,
  patch: { name?: string; level?: number | null }
): Promise<UpdatePlayerCharacterResult> {
  if (!isUuid(characterId)) return { error: "Nieprawidłowe ID postaci." };
  if (!isUuid(campaignId)) return { error: "Nieprawidłowa kampania." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { error: "Musisz być zalogowany." };

  const { error } = await supabase
    .from("characters")
    .update(patch)
    .eq("id", characterId)
    .eq("campaign_id", campaignId);

  if (error) return { error: error.message };

  revalidatePath(`/campaign/${campaignId}`, "layout");
  return {};
}
