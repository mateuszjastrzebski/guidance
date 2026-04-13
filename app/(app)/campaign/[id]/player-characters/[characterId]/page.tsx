import { notFound } from "next/navigation";

import { PlayerCharacterDetailPage } from "@/components/campaign/player-character-detail-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PlayerCharacterDetailRouteProps = {
  params: Promise<{ id: string; characterId: string }>;
};

export default async function PlayerCharacterDetailRoute({
  params
}: PlayerCharacterDetailRouteProps) {
  const { id: campaignId, characterId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: character, error } = await supabase
    .from("characters")
    .select("id, name, level, portrait_url")
    .eq("id", characterId)
    .eq("campaign_id", campaignId)
    .single();

  if (error || !character) {
    notFound();
  }

  return (
    <PlayerCharacterDetailPage
      campaignId={campaignId}
      character={character}
    />
  );
}
