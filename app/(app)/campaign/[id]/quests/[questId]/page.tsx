import { notFound } from "next/navigation";

import { QuestDetailPage } from "@/components/campaign/quest-detail-page";
import {
  fetchCampaignEntityLinks,
  getLinkedItems,
  type LinkedItemDescriptor
} from "@/lib/entity-links";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchCampaignWorldCollections } from "@/lib/world";

type QuestDetailRouteProps = {
  params: Promise<{ id: string; questId: string }>;
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

export default async function QuestDetailRoute({ params }: QuestDetailRouteProps) {
  const { id: campaignId, questId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [
    { data: quest, error },
    { data: characterRows },
    worldCollections,
    { data: worldRows },
    rawLinks,
    { data: npcRows },
    { data: locationRows }
  ] = await Promise.all([
    supabase
      .from("quests")
      .select("id, name, description, status")
      .eq("id", questId)
      .eq("campaign_id", campaignId)
      .single(),
    supabase.from("characters").select("id, name").eq("campaign_id", campaignId).order("name"),
    fetchCampaignWorldCollections(supabase, campaignId),
    supabase
      .from("world_entries")
      .select("id, name, summary, collection_id, world_collections(id, slug, singular_name, plural_name)")
      .eq("campaign_id", campaignId)
      .order("name"),
    fetchCampaignEntityLinks(supabase, campaignId),
    supabase.from("npcs").select("id, name").eq("campaign_id", campaignId).order("name"),
    supabase.from("locations").select("id, name").eq("campaign_id", campaignId).order("name")
  ]);

  if (error || !quest) {
    notFound();
  }

  const itemMap = new Map<string, LinkedItemDescriptor>(
    (worldRows ?? []).map((entry) => {
      const collectionMeta = firstCollectionMeta(entry.world_collections);
      return [
        entry.id,
        {
          id: entry.id,
          name: entry.name,
          href: collectionMeta?.slug
            ? `/campaign/${campaignId}/world/${collectionMeta.slug}/${entry.id}`
            : undefined,
          meta: collectionMeta?.singular_name ?? collectionMeta?.plural_name ?? "Świat",
          summary: entry.summary
        }
      ];
    })
  );
  const linkedWorldEntries = getLinkedItems(rawLinks, "quest", questId, "world_entry", itemMap);
  const worldLinkSections = worldCollections.map((worldCollection) => ({
    title: worldCollection.plural_name,
    allItems: (worldRows ?? [])
      .filter((row) => row.collection_id === worldCollection.id)
      .map((row) => ({ id: row.id, name: row.name })),
    linkedItems: linkedWorldEntries.filter((item) => {
      const row = worldRows?.find((candidate) => candidate.id === item.id);
      return row?.collection_id === worldCollection.id;
    })
  }));

  return (
    <QuestDetailPage
      campaignId={campaignId}
      campaignCharacters={(characterRows ?? []).map((c) => ({ id: c.id, name: c.name }))}
      npcOptions={(npcRows ?? []).map((n) => ({ id: n.id, name: n.name }))}
      locationOptions={(locationRows ?? []).map((l) => ({ id: l.id, name: l.name }))}
      worldLinkSections={worldLinkSections}
      quest={quest}
    />
  );
}
