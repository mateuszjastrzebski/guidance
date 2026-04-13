"use client";

import { useLayoutEffect } from "react";

import { useTopBar, type CampaignCharacter } from "@/components/app-shell/top-bar-context";

type SetCampaignTopBarProps = {
  campaignId: string;
  campaignName: string;
  campaignCharacters: CampaignCharacter[];
};

export function SetCampaignTopBar({ campaignId, campaignName, campaignCharacters }: SetCampaignTopBarProps) {
  const { setConfig } = useTopBar();

  useLayoutEffect(() => {
    setConfig({ variant: "campaign", campaignId, campaignName, campaignCharacters });
    return () => setConfig({ variant: "app" });
  }, [campaignId, campaignName, campaignCharacters, setConfig]);

  return null;
}
