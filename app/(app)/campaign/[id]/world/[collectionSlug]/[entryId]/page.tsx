import { notFound } from "next/navigation";

import { getCharacterConfig } from "@/app/(app)/campaign/[id]/world/[collectionSlug]/[entryId]/configurator-actions";
import { WorldEntryDetailPage } from "@/components/campaign/world-entry-detail-page";
import {
  fetchCampaignEntityLinks,
  getLinkedItems,
  type LinkedItemDescriptor
} from "@/lib/entity-links";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSceneSessionOccurrences } from "@/lib/scenes";
import {
  fetchCampaignWorldCollections,
  type WorldCollection,
  type WorldEntry
} from "@/lib/world";

type WorldEntryRouteProps = {
  params: Promise<{ id: string; collectionSlug: string; entryId: string }>;
};

function firstCollectionMeta(
  value:
    | { id: string; slug: string; singular_name: string; plural_name: string }
    | { id: string; slug: string; singular_name: string; plural_name: string }[]
    | null
) {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function WorldEntryRoute({ params }: WorldEntryRouteProps) {
  const { id: campaignId, collectionSlug, entryId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const [
    { data: collection, error: collectionError },
    worldCollections,
    { data: characterRows },
    { data: questRows },
    { data: worldRows },
    rawLinks,
    occurrences
  ] = await Promise.all([
    supabase
      .from("world_collections")
      .select(
        "id, campaign_id, template_key, singular_name, plural_name, slug, icon, description, sort_order, is_system, slug_locked, created_at, updated_at"
      )
      .eq("campaign_id", campaignId)
      .eq("slug", collectionSlug)
      .single(),
    fetchCampaignWorldCollections(supabase, campaignId),
    supabase.from("characters").select("id, name").eq("campaign_id", campaignId).order("name"),
    supabase
      .from("quests")
      .select("id, name, description, status")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true }),
    supabase
      .from("world_entries")
      .select("id, name, summary, collection_id, world_collections(id, slug, singular_name, plural_name)")
      .eq("campaign_id", campaignId)
      .order("name"),
    fetchCampaignEntityLinks(supabase, campaignId),
    getSceneSessionOccurrences(supabase, campaignId, { id: entryId, type: "world_entry" })
  ]);

  if (collectionError || !collection) notFound();

  const { data: entry, error: entryError } = await supabase
    .from("world_entries")
    .select("id, campaign_id, collection_id, name, summary, portrait_url, level, data, created_at, updated_at")
    .eq("campaign_id", campaignId)
    .eq("collection_id", collection.id)
    .eq("id", entryId)
    .single();

  if (entryError || !entry) notFound();

  const characterConfig =
    collection.template_key === "npc" ? await getCharacterConfig(entry.id) : null;

  const itemMap = new Map<string, LinkedItemDescriptor>(
    (worldRows ?? []).map((row) => {
      const collectionMeta = firstCollectionMeta(row.world_collections);
      return [
        row.id,
        {
          id: row.id,
          name: row.name,
          href: collectionMeta?.slug
            ? `/campaign/${campaignId}/world/${collectionMeta.slug}/${row.id}`
            : undefined,
          meta: collectionMeta?.singular_name ?? collectionMeta?.plural_name ?? "Świat",
          summary: row.summary
        }
      ];
    })
  );
  const linkedWorldEntries = getLinkedItems(
    rawLinks,
    "world_entry",
    entryId,
    "world_entry",
    itemMap
  );
  const questItemMap = new Map<string, LinkedItemDescriptor>(
    (questRows ?? []).map((quest) => [
      quest.id,
      {
        id: quest.id,
        name: quest.name,
        href: `/campaign/${campaignId}/quests/${quest.id}`,
        meta: "Wątek",
        summary: quest.description
      }
    ])
  );
  const linkedQuests = getLinkedItems(rawLinks, "world_entry", entryId, "quest", questItemMap);
  const worldLinkSections = worldCollections.map((worldCollection) => ({
    title: worldCollection.plural_name,
    allItems: (worldRows ?? [])
      .filter((row) => row.collection_id === worldCollection.id && row.id !== entryId)
      .map((row) => ({ id: row.id, name: row.name })),
    linkedItems: linkedWorldEntries.filter((item) => {
      const row = worldRows?.find((candidate) => candidate.id === item.id);
      return row?.collection_id === worldCollection.id;
    })
  }));

  return (
    <WorldEntryDetailPage
      campaignCharacters={(characterRows ?? []).map((row) => ({ id: row.id, name: row.name }))}
      campaignId={campaignId}
      collection={collection as WorldCollection}
      entry={
        {
          id: entry.id,
          campaign_id: entry.campaign_id,
          collection_id: entry.collection_id,
          name: entry.name,
          summary: entry.summary,
          portrait_url: entry.portrait_url,
          level: entry.level,
          data: entry.data ?? {},
          created_at: entry.created_at,
          updated_at: entry.updated_at
        } as WorldEntry
      }
      occurrences={occurrences}
      worldLinkSections={worldLinkSections}
      allQuests={(questRows ?? []).map((quest) => ({ id: quest.id, name: quest.name }))}
      linkedQuests={linkedQuests}
      characterConfig={characterConfig}
    />
  );
}
