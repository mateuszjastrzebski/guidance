"use server";

import { revalidatePath } from "next/cache";

import type { GeneratedConfig, SliderValues } from "@/lib/character-configurator/logic";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CharacterConfigRow = {
  id: string;
  world_entry_id: string;
  campaign_id: string;
  slider_heart: number;
  slider_soul: number;
  slider_mask: number;
  slider_wound: number;
  slider_bonds: number | null;
  slider_code: number | null;
  base_type: string;
  archetype_name: string;
  tagline: string;
  core_desire: string;
  core_fear: string;
  wound_text: string;
  gift_text: string;
  shadow_text: string;
  narrative_arc: string;
  conflicts: string[];
  hooks: string[];
  inspirations: string[];
  generated_at: string;
  created_at: string;
};

export async function getCharacterConfig(
  worldEntryId: string
): Promise<CharacterConfigRow | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("character_configs")
    .select("*")
    .eq("world_entry_id", worldEntryId)
    .maybeSingle();

  return (data as CharacterConfigRow | null) ?? null;
}

export async function saveCharacterConfig(
  campaignId: string,
  worldEntryId: string,
  sliders: SliderValues,
  generated: GeneratedConfig
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase.from("character_configs").upsert(
    {
      world_entry_id: worldEntryId,
      campaign_id: campaignId,
      slider_heart: sliders.heart,
      slider_soul: sliders.soul,
      slider_mask: sliders.mask,
      slider_wound: sliders.wound,
      slider_bonds: sliders.bonds ?? null,
      slider_code: sliders.code ?? null,
      base_type: generated.base_type,
      archetype_name: generated.archetype_name,
      tagline: generated.tagline,
      core_desire: generated.core_desire,
      core_fear: generated.core_fear,
      wound_text: generated.wound_text,
      gift_text: generated.gift_text,
      shadow_text: generated.shadow_text,
      narrative_arc: generated.narrative_arc,
      conflicts: generated.conflicts,
      hooks: generated.hooks,
      inspirations: generated.inspirations,
      generated_at: new Date().toISOString()
    },
    { onConflict: "world_entry_id" }
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/campaign/${campaignId}`);
  return { ok: true };
}
