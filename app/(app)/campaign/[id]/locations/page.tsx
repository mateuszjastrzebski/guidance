import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type LocationsRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function LocationsRoute({ params }: LocationsRouteProps) {
  const { id: campaignId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("world_collections")
    .select("slug")
    .eq("campaign_id", campaignId)
    .eq("template_key", "location")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.slug) notFound();

  redirect(`/campaign/${campaignId}/world/${data.slug}`);
}
