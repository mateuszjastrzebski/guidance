import { redirect } from "next/navigation";

import { LocationRosterPage, type LocationListItem } from "@/components/campaign/location-roster-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LocationsRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function LocationsRoute({ params }: LocationsRouteProps) {
  const { id: campaignId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberRow } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isGm = memberRow?.role === "gm";

  const [{ data: rows, error }, { data: characterRows }] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name, description")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true }),
    supabase
      .from("characters")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true })
  ]);

  if (error) {
    return (
      <LocationRosterPage
        campaignId={campaignId}
        campaignCharacters={[]}
        canAdd={isGm}
        emptyMessage=""
        errorMessage={`Nie udało się wczytać lokacji: ${error.message}`}
        locations={[]}
      />
    );
  }

  const locations: LocationListItem[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description
  }));

  const campaignCharacters = (characterRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  const emptyMessage = isGm
    ? "Brak lokacji w tej kampanii. Dodaj pierwszą lub uruchom migracje z przykładowymi miejscami."
    : "Nie ma jeszcze lokacji widocznych w tej kampanii.";

  return (
    <LocationRosterPage
      campaignId={campaignId}
      campaignCharacters={campaignCharacters}
      canAdd={isGm}
      emptyMessage={emptyMessage}
      locations={locations}
    />
  );
}
