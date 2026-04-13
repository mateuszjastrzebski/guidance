import { notFound } from "next/navigation";

import { LocationDetailPage } from "@/components/campaign/location-detail-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LocationDetailRouteProps = {
  params: Promise<{ id: string; locationId: string }>;
};

export default async function LocationDetailRoute({ params }: LocationDetailRouteProps) {
  const { id: campaignId, locationId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [{ data: location, error }, { data: characterRows }] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name, description")
      .eq("id", locationId)
      .eq("campaign_id", campaignId)
      .single(),
    supabase
      .from("characters")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true })
  ]);

  if (error || !location) {
    notFound();
  }

  const campaignCharacters = (characterRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  return (
    <LocationDetailPage
      campaignId={campaignId}
      campaignCharacters={campaignCharacters}
      location={location}
    />
  );
}
