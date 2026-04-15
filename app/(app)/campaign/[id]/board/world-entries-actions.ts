"use server";

import { revalidatePath } from "next/cache";

import { createWorldEntry } from "@/app/(app)/campaign/[id]/world/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorldCollection } from "@/lib/world";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type PlannerWorldCollectionForBoard = {
  icon: string | null;
  id: string;
  plural_name: string;
  singular_name: string;
  slug: string;
};

export type PlannerWorldEntryForBoard = {
  collection_id: string;
  collection_plural_name: string;
  collection_singular_name: string;
  collection_slug: string;
  id: string;
  name: string;
  portrait_url: string | null;
};

export type ListWorldEntriesForBoardResult =
  | {
      ok: true;
      collections: PlannerWorldCollectionForBoard[];
      worldEntries: PlannerWorldEntryForBoard[];
    }
  | { ok: false; error: string };

export async function listWorldEntriesForBoard(
  campaignId: string
): Promise<ListWorldEntriesForBoardResult> {
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

  const [{ data: collections, error: collectionsError }, { data: rows, error: rowsError }] =
    await Promise.all([
      supabase
        .from("world_collections")
        .select("id, singular_name, plural_name, slug, icon")
        .eq("campaign_id", campaignId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("world_entries")
        .select(
          "id, name, portrait_url, collection_id, world_collections!inner(id, singular_name, plural_name, slug)"
        )
        .eq("campaign_id", campaignId)
        .order("name", { ascending: true })
    ]);

  if (collectionsError) {
    return { ok: false, error: collectionsError.message ?? "Nie udało się pobrać kolekcji świata." };
  }
  if (rowsError) {
    return { ok: false, error: rowsError.message ?? "Nie udało się pobrać wpisów świata." };
  }

  return {
    ok: true,
    collections:
      (collections ?? []).map((collection) => ({
        icon: collection.icon,
        id: collection.id,
        plural_name: collection.plural_name,
        singular_name: collection.singular_name,
        slug: collection.slug
      })) ?? [],
    worldEntries:
      (rows ?? []).flatMap((row) => {
        const collection = Array.isArray(row.world_collections)
          ? row.world_collections[0]
          : row.world_collections;
        if (!collection) {
          return [];
        }
        return [
          {
            collection_id: collection.id,
            collection_plural_name: collection.plural_name,
            collection_singular_name: collection.singular_name,
            collection_slug: collection.slug,
            id: row.id,
            name: row.name,
            portrait_url: row.portrait_url
          }
        ];
      }) ?? []
  };
}

export type CreateWorldEntryForBoardResult =
  | { ok: true; worldEntry: PlannerWorldEntryForBoard }
  | { ok: false; error: string };

export async function createWorldEntryForBoard(
  campaignId: string,
  collectionId: string,
  name: string
): Promise<CreateWorldEntryForBoardResult> {
  if (!isUuid(campaignId) || !isUuid(collectionId)) {
    return { ok: false, error: "Nieprawidłowe dane wpisu świata." };
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Podaj nazwę wpisu." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: collection, error: collectionError } = await supabase
    .from("world_collections")
    .select(
      "id, campaign_id, template_key, singular_name, plural_name, slug, icon, description, sort_order, is_system, slug_locked, created_at, updated_at"
    )
    .eq("campaign_id", campaignId)
    .eq("id", collectionId)
    .single();

  if (collectionError || !collection) {
    return { ok: false, error: collectionError?.message ?? "Nie znaleziono kolekcji świata." };
  }

  const result = await createWorldEntry(campaignId, collection as WorldCollection, { name: trimmed });
  if (!result.ok) {
    return result;
  }

  const { data: row, error: rowError } = await supabase
    .from("world_entries")
    .select("id, name, portrait_url")
    .eq("campaign_id", campaignId)
    .eq("id", result.entryId)
    .single();

  if (rowError || !row) {
    return { ok: false, error: rowError?.message ?? "Nie udało się pobrać nowego wpisu świata." };
  }

  revalidatePath(`/campaign/${campaignId}/world/${collection.slug}`);

  return {
    ok: true,
    worldEntry: {
      collection_id: collection.id,
      collection_plural_name: collection.plural_name,
      collection_singular_name: collection.singular_name,
      collection_slug: collection.slug,
      id: row.id,
      name: row.name,
      portrait_url: row.portrait_url
    }
  };
}
