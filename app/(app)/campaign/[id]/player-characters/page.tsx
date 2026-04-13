import { redirect } from "next/navigation";

import {
  PlayerCharactersPage,
  type PlayerCharacterListItem
} from "@/components/campaign/player-characters-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PlayerCharactersRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function PlayerCharactersRoute({ params }: PlayerCharactersRouteProps) {
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

  const { data: rows, error } = await supabase
    .from("characters")
    .select("id, name, level, portrait_url")
    .eq("campaign_id", campaignId)
    .order("name", { ascending: true });

  if (error) {
    return (
      <PlayerCharactersPage
        campaignId={campaignId}
        canAddCharacter={isGm}
        characters={[]}
        emptyMessage=""
        errorMessage={`Nie udało się wczytać postaci: ${error.message}`}
      />
    );
  }

  const characters: PlayerCharacterListItem[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    level: r.level,
    portrait_url: r.portrait_url
  }));

  const emptyMessage = isGm
    ? "Brak postaci w tej kampanii. Możesz je dodać lub powiązać z graczami w ustawieniach fabuły."
    : "Nie masz jeszcze przypisanej postaci widocznej tutaj albo MG nie udostępnił jej w systemie — napisz do MG.";

  return (
    <PlayerCharactersPage
      campaignId={campaignId}
      canAddCharacter={isGm}
      characters={characters}
      emptyMessage={emptyMessage}
    />
  );
}
