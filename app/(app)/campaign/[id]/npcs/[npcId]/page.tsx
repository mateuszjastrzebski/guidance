import { notFound } from "next/navigation";

import { NpcDetailPage } from "@/components/campaign/npc-detail-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type NpcDetailRouteProps = {
  params: Promise<{ id: string; npcId: string }>;
};

export default async function NpcDetailRoute({ params }: NpcDetailRouteProps) {
  const { id: campaignId, npcId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [{ data: npc, error }, { data: characterRows }] = await Promise.all([
    supabase
      .from("npcs")
      .select("id, name, description, level, portrait_url")
      .eq("id", npcId)
      .eq("campaign_id", campaignId)
      .single(),
    supabase
      .from("characters")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true })
  ]);

  if (error || !npc) {
    notFound();
  }

  const campaignCharacters = (characterRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  return (
    <NpcDetailPage
      campaignId={campaignId}
      campaignCharacters={campaignCharacters}
      npc={npc}
    />
  );
}
