"use client";

import { useLayoutEffect } from "react";

import {
  useTopBar,
  type CampaignCharacter,
  type CampaignSearchItem,
  type CampaignWorldCollection
} from "@/components/app-shell/top-bar-context";

type SetCampaignTopBarProps = {
  campaignId: string;
  campaignName: string;
  campaignCharacters: CampaignCharacter[];
  campaignSearchItems: CampaignSearchItem[];
  campaignWorldCollections: CampaignWorldCollection[];
};

export function SetCampaignTopBar({
  campaignId,
  campaignName,
  campaignCharacters,
  campaignSearchItems,
  campaignWorldCollections
}: SetCampaignTopBarProps) {
  const { setConfig } = useTopBar();

  useLayoutEffect(() => {
    setConfig({
      variant: "campaign",
      campaignId,
      campaignName,
      campaignCharacters,
      campaignSearchItems,
      campaignWorldCollections
    });
    return () => setConfig({ variant: "app" });
  }, [
    campaignCharacters,
    campaignId,
    campaignName,
    campaignSearchItems,
    campaignWorldCollections,
    setConfig
  ]);

  return null;
}
