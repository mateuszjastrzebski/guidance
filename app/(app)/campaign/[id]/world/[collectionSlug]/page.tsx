import { notFound } from "next/navigation";

import { WorldCollectionPage } from "@/components/campaign/world-collection-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorldCollection, WorldEntry } from "@/lib/world";

type WorldCollectionRouteProps = {
  params: Promise<{ id: string; collectionSlug: string }>;
};

export default async function WorldCollectionRoute({ params }: WorldCollectionRouteProps) {
  const { id: campaignId, collectionSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const [{ data: member }, { data: collection, error }] = await Promise.all([
    supabase
      .from("campaign_members")
      .select("role")
      .eq("campaign_id", campaignId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("world_collections")
      .select(
        "id, campaign_id, template_key, singular_name, plural_name, slug, icon, description, sort_order, is_system, slug_locked, created_at, updated_at"
      )
      .eq("campaign_id", campaignId)
      .eq("slug", collectionSlug)
      .single()
  ]);

  if (error || !collection) notFound();

  const { data: entryRows } = await supabase
    .from("world_entries")
    .select("id, campaign_id, collection_id, name, summary, portrait_url, level, data, created_at, updated_at")
    .eq("campaign_id", campaignId)
    .eq("collection_id", collection.id)
    .order("name", { ascending: true });

  const entries = (entryRows ?? []).map((row) => ({
    id: row.id,
    campaign_id: row.campaign_id,
    collection_id: row.collection_id,
    name: row.name,
    summary: row.summary,
    portrait_url: row.portrait_url,
    level: row.level,
    data: row.data ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at
  })) as WorldEntry[];

  return (
    <WorldCollectionPage
      campaignId={campaignId}
      canManage={member?.role === "gm"}
      collection={collection as WorldCollection}
      entries={entries}
    />
  );
}
