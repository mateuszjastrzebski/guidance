import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SetCampaignTopBar } from "@/components/app-shell/set-campaign-top-bar";
import { isFabulaKind } from "@/lib/fabula";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const [{ data: campaign, error }, { data: characterRows }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, fabula_kind")
      .eq("id", campaignId)
      .single(),
    supabase
      .from("characters")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true })
  ]);

  if (error || !campaign) {
    notFound();
  }

  if (!isFabulaKind(campaign.fabula_kind)) {
    notFound();
  }

  const campaignCharacters = (characterRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <SetCampaignTopBar
        campaignId={campaign.id}
        campaignName={campaign.name}
        campaignCharacters={campaignCharacters}
      />
      {children}
    </>
  );
}
