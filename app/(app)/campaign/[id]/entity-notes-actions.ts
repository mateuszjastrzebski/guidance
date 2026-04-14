"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EntityType = "character" | "quest" | "world_entry";

export async function createEntityNote(
  campaignId: string,
  ownerType: EntityType,
  ownerId: string,
  content: string,
  contextType: EntityType | null,
  contextId: string | null
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nie zalogowany." };

  const { error } = await supabase.from("entity_notes").insert({
    campaign_id: campaignId,
    content: content.trim(),
    owner_type: ownerType,
    owner_id: ownerId,
    context_type: contextType,
    context_id: contextId,
    created_by: user.id
  });
  if (error) return { error: error.message };
  return {};
}

export async function deleteEntityNote(noteId: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entity_notes").delete().eq("id", noteId);
  if (error) return { error: error.message };
  return {};
}

export async function updateEntityNote(
  noteId: string,
  content: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("entity_notes")
    .update({ content: content.trim() })
    .eq("id", noteId);
  if (error) return { error: error.message };
  return {};
}
