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

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, name, fabula_kind")
    .eq("id", campaignId)
    .single();

  if (error || !campaign) {
    notFound();
  }

  if (!isFabulaKind(campaign.fabula_kind)) {
    notFound();
  }

  return (
    <>
      <SetCampaignTopBar campaignId={campaign.id} campaignName={campaign.name} />
      {children}
    </>
  );
}
