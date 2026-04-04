"use client";

import { useLayoutEffect } from "react";

import { useTopBar } from "@/components/app-shell/top-bar-context";

type SetCampaignTopBarProps = {
  campaignId: string;
  campaignName: string;
};

export function SetCampaignTopBar({ campaignId, campaignName }: SetCampaignTopBarProps) {
  const { setConfig } = useTopBar();

  useLayoutEffect(() => {
    setConfig({ variant: "campaign", campaignId, campaignName });
    return () => setConfig({ variant: "app" });
  }, [campaignId, campaignName, setConfig]);

  return null;
}
