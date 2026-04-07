"use client";

import { Box } from "@mantine/core";

import { Planner2ReactFlowPilot } from "@/components/planner2/planner2-react-flow-pilot";

type Planner2PlannerModeTabsProps = {
  campaignId: string;
  viewportHeight: string;
};

export function Planner2PlannerModeTabs({ campaignId, viewportHeight }: Planner2PlannerModeTabsProps) {
  return (
    <Box
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        height: viewportHeight,
        minHeight: 0,
        width: "100%"
      }}
    >
      <Planner2ReactFlowPilot campaignId={campaignId} />
    </Box>
  );
}
