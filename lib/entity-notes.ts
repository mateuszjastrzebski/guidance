import type { SupabaseClient } from "@supabase/supabase-js";

export type EntityNote = {
  id: string;
  content: string;
  owner_type: string;
  owner_id: string;
  context_type: string | null;
  context_id: string | null;
  created_at: string;
};

export const ENTITY_TYPE_LABEL: Record<string, string> = {
  quest: "Wątek",
  world_entry: "Świat",
  location: "Miejsce",
  npc: "NPC",
  character: "Postać"
};

export async function fetchCampaignEntityNotes(
  supabase: SupabaseClient,
  campaignId: string
): Promise<EntityNote[]> {
  const { data } = await supabase
    .from("entity_notes")
    .select("id, content, owner_type, owner_id, context_type, context_id, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });
  return (data as EntityNote[] | null) ?? [];
}
