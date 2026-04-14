"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EntityType = "character" | "quest" | "world_entry";

/** Ensures the pair is stored in canonical order (type_a < type_b alphabetically;
 *  if same type, id_a < id_b). Prevents duplicate rows from different insertion orders. */
function canonicalize(
  typeA: EntityType,
  idA: string,
  typeB: EntityType,
  idB: string
) {
  if (typeA < typeB || (typeA === typeB && idA < idB)) {
    return { entity_a_type: typeA, entity_a_id: idA, entity_b_type: typeB, entity_b_id: idB };
  }
  return { entity_a_type: typeB, entity_a_id: idB, entity_b_type: typeA, entity_b_id: idA };
}

export async function addEntityLink(
  campaignId: string,
  typeA: EntityType,
  idA: string,
  typeB: EntityType,
  idB: string
): Promise<{ error?: string }> {
  if (typeA === typeB && idA === idB) {
    return { error: "Nie można połączyć elementu ze sobą." };
  }
  const supabase = await createSupabaseServerClient();
  const canonical = canonicalize(typeA, idA, typeB, idB);
  const { error } = await supabase.from("entity_links").insert({
    campaign_id: campaignId,
    ...canonical
  });
  if (error) return { error: error.message };
  return {};
}

export async function removeEntityLink(linkId: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entity_links").delete().eq("id", linkId);
  if (error) return { error: error.message };
  return {};
}
