import { redirect } from "next/navigation";

import { NpcRosterPage, type NpcListItem } from "@/components/campaign/npc-roster-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type NpcsRouteProps = {
  params: { id: string };
};

export default async function NpcsRoute({ params }: NpcsRouteProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const campaignId = params.id;

  const { data: memberRow } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isGm = memberRow?.role === "gm";

  const { data: rows, error } = await supabase
    .from("npcs")
    .select("id, name, description, level, portrait_url")
    .eq("campaign_id", campaignId)
    .order("name", { ascending: true });

  if (error) {
    return (
      <NpcRosterPage
        campaignId={campaignId}
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

  const emptyMessage = isGm
    ? "Brak NPC w tej kampanii. Dodaj pierwszego lub uruchom migracje z przykładowymi postaciami."
    : "Nie ma jeszcze NPC widocznych w tej kampanii.";

  return (
    <NpcRosterPage
      campaignId={campaignId}
      canAddNpc={isGm}
      emptyMessage={emptyMessage}
      npcs={npcs}
    />
  );
}
