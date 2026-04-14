import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SetCampaignTopBar } from "@/components/app-shell/set-campaign-top-bar";
import { buildCampaignSearchItems } from "@/lib/campaign-search";
import { isFabulaKind } from "@/lib/fabula";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchCampaignWorldCollections } from "@/lib/world";

type CampaignLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export default async function CampaignLayout({ children, params }: CampaignLayoutProps) {
  const { id: campaignId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    campaignResult,
    characterResult,
    questResult,
    worldEntryResult,
    worldCollections
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, fabula_kind")
      .eq("id", campaignId)
      .single(),
    supabase
      .from("characters")
      .select("id, name, level")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true }),
    supabase
      .from("quests")
      .select("id, name, description, status")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true }),
    supabase
      .from("world_entries")
      .select("id, name, summary, world_collections(slug, singular_name)")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true }),
    fetchCampaignWorldCollections(supabase, campaignId)
  ]);

  const { data: campaign, error } = campaignResult;
  const { data: characterRows } = characterResult;
  const { data: questRows } = questResult;
  const { data: worldEntryRows } = worldEntryResult;

  if (error || !campaign) {
    notFound();
  }

  if (!isFabulaKind(campaign.fabula_kind)) {
    notFound();
  }

  const campaignCharacters = (characterRows ?? []).map((c) => ({ id: c.id, name: c.name }));
  const campaignSearchItems = buildCampaignSearchItems({
    campaignId: campaign.id,
    characters: (characterRows ?? []) as Array<{ id: string; name: string; level: number | null }>,
    quests: (questRows ?? []) as Array<{
      id: string;
      name: string;
      description: string | null;
      status: string;
    }>,
    worldEntries: (worldEntryRows ?? []) as Array<{
      id: string;
      name: string;
      summary: string | null;
      world_collections:
        | { slug: string; singular_name: string }
        | Array<{ slug: string; singular_name: string }>
        | null;
    }>
  });

  return (
    <>
      <SetCampaignTopBar
        campaignId={campaign.id}
        campaignName={campaign.name}
        campaignCharacters={campaignCharacters}
        campaignSearchItems={campaignSearchItems}
        campaignWorldCollections={worldCollections.map((collection) => ({
          id: collection.id,
          slug: collection.slug,
          plural_name: collection.plural_name,
          icon: collection.icon,
          sort_order: collection.sort_order
        }))}
      />
      {children}
    </>
  );
}
