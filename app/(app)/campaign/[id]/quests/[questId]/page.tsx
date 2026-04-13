import { notFound } from "next/navigation";

import { QuestDetailPage } from "@/components/campaign/quest-detail-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type QuestDetailRouteProps = {
  params: Promise<{ id: string; questId: string }>;
};

export default async function QuestDetailRoute({ params }: QuestDetailRouteProps) {
  const { id: campaignId, questId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [{ data: quest, error }, { data: characterRows }] = await Promise.all([
    supabase
      .from("quests")
      .select("id, name, description, status")
      .eq("id", questId)
      .eq("campaign_id", campaignId)
      .single(),
    supabase
      .from("characters")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true })
  ]);

  if (error || !quest) {
    notFound();
  }

  const campaignCharacters = (characterRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  return (
    <QuestDetailPage
      campaignId={campaignId}
      campaignCharacters={campaignCharacters}
      quest={quest}
    />
  );
}
