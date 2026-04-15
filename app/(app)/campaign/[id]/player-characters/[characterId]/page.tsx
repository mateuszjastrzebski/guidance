import { notFound } from "next/navigation";

import { PlayerCharacterDetailPage } from "@/components/campaign/player-character-detail-page";
import {
  fetchCampaignEntityLinks,
  getLinkedItems,
  type LinkedItemDescriptor
} from "@/lib/entity-links";
import { getSceneSessionOccurrences } from "@/lib/scenes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchCampaignWorldCollections } from "@/lib/world";

type PlayerCharacterDetailRouteProps = {
  params: Promise<{ id: string; characterId: string }>;
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

export default async function PlayerCharacterDetailRoute({
  params
}: PlayerCharacterDetailRouteProps) {
  const { id: campaignId, characterId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [{ data: character, error }, worldCollections, { data: worldRows }, rawLinks, occurrences] =
    await Promise.all([
      supabase
        .from("characters")
        .select("id, name, level, portrait_url")
        .eq("id", characterId)
        .eq("campaign_id", campaignId)
        .single(),
      fetchCampaignWorldCollections(supabase, campaignId),
      supabase
        .from("world_entries")
        .select("id, name, summary, collection_id, world_collections(id, slug, singular_name, plural_name)")
        .eq("campaign_id", campaignId)
        .order("name"),
      fetchCampaignEntityLinks(supabase, campaignId),
      getSceneSessionOccurrences(supabase, campaignId, { id: characterId, type: "character" })
    ]);

  if (error || !character) {
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
  const linkedWorldEntries = getLinkedItems(
    rawLinks,
    "character",
    characterId,
    "world_entry",
    itemMap
  );
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
    <PlayerCharacterDetailPage
      campaignId={campaignId}
      character={character}
      occurrences={occurrences}
      worldLinkSections={worldLinkSections}
    />
  );
}
