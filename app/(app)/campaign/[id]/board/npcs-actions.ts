"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugifyWorldName, WORLD_TEMPLATE_DEFINITIONS } from "@/lib/world";

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

  const { data: collections } = await supabase
    .from("world_collections")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("template_key", "npc");

  if (!collections || collections.length === 0) {
    return { ok: true, npcs: [] };
  }

  const collectionIds = collections.map((c) => c.id);

  const { data, error } = await supabase
    .from("world_entries")
    .select("id, name, portrait_url")
    .eq("campaign_id", campaignId)
    .in("collection_id", collectionIds)
    .order("name", { ascending: true });

  if (error) {
    return { ok: false, error: error.message ?? "Nie udało się pobrać NPC." };
  }

  const npcs: PlannerNpcForBoard[] = (data ?? []).map((row) => ({
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

  // Znajdź kolekcję NPC lub utwórz ją
  const { data: existingCollection } = await supabase
    .from("world_collections")
    .select("id, slug")
    .eq("campaign_id", campaignId)
    .eq("template_key", "npc")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let collectionId: string;
  let collectionSlug: string;

  if (existingCollection) {
    collectionId = existingCollection.id;
    collectionSlug = existingCollection.slug;
  } else {
    const template = WORLD_TEMPLATE_DEFINITIONS.npc;
    const baseSlug = slugifyWorldName(template.defaultSlug);

    const { data: newCollection, error: createErr } = await supabase
      .from("world_collections")
      .insert({
        campaign_id: campaignId,
        template_key: "npc",
        singular_name: template.singularName,
        plural_name: template.pluralName,
        slug: baseSlug,
        icon: template.icon,
        description: template.description,
        sort_order: 100,
        is_system: false,
        slug_locked: false
      })
      .select("id, slug")
      .single();

    if (createErr || !newCollection) {
      return { ok: false, error: "Nie udało się utworzyć kolekcji NPC." };
    }
    collectionId = newCollection.id;
    collectionSlug = newCollection.slug;
    revalidatePath(`/campaign/${campaignId}`, "layout");
  }

  const { data, error: insertErr } = await supabase
    .from("world_entries")
    .insert({
      campaign_id: campaignId,
      collection_id: collectionId,
      name: trimmed,
      summary: null,
      portrait_url: null,
      level: null,
      data: {}
    })
    .select("id, name, portrait_url")
    .single();

  if (insertErr || !data) {
    return { ok: false, error: insertErr?.message ?? "Nie udało się utworzyć NPC." };
  }

  revalidatePath(`/campaign/${campaignId}/world/${collectionSlug}`);

  return {
    ok: true,
    npc: { id: data.id, name: data.name, portrait_url: data.portrait_url }
  };
}
