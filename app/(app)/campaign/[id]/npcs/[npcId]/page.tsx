import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type NpcDetailRouteProps = {
  params: Promise<{ id: string; npcId: string }>;
};

export default async function NpcDetailRoute({ params }: NpcDetailRouteProps) {
  const { id: campaignId, npcId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: entry } = await supabase
    .from("world_entries")
    .select("collection_id")
    .eq("campaign_id", campaignId)
    .eq("id", npcId)
    .maybeSingle();

  if (!entry?.collection_id) notFound();

  const { data: collection } = await supabase
    .from("world_collections")
    .select("slug")
    .eq("campaign_id", campaignId)
    .eq("id", entry.collection_id)
    .maybeSingle();

  const slug = collection?.slug;
  if (!slug) notFound();

  redirect(`/campaign/${campaignId}/world/${slug}/${npcId}`);
}
