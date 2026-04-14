import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type NpcsRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function NpcsRoute({ params }: NpcsRouteProps) {
  const { id: campaignId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("world_collections")
    .select("slug")
    .eq("campaign_id", campaignId)
    .eq("template_key", "npc")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.slug) notFound();

  redirect(`/campaign/${campaignId}/world/${data.slug}`);
}
