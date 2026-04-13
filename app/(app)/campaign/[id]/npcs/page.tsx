import { redirect } from "next/navigation";

import { NpcRosterPage, type NpcListItem } from "@/components/campaign/npc-roster-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type NpcsRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function NpcsRoute({ params }: NpcsRouteProps) {
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
      .from("npcs")
      .select("id, name, description, level, portrait_url")
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
      <NpcRosterPage
        campaignId={campaignId}
        campaignCharacters={[]}
        canAddNpc={isGm}
        emptyMessage=""
        errorMessage={`Nie udało się wczytać NPC: ${error.message}`}
        npcs={[]}
      />
    );
  }

  const npcs: NpcListItem[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    level: r.level,
    portrait_url: r.portrait_url
  }));

  const campaignCharacters = (characterRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  const emptyMessage = isGm
    ? "Brak NPC w tej kampanii. Dodaj pierwszego lub uruchom migracje z przykładowymi postaciami."
    : "Nie ma jeszcze NPC widocznych w tej kampanii.";

  return (
    <NpcRosterPage
      campaignId={campaignId}
      campaignCharacters={campaignCharacters}
      canAddNpc={isGm}
      emptyMessage={emptyMessage}
      npcs={npcs}
    />
  );
}
