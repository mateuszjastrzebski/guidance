import { Box } from "@mantine/core";

import { Planner2PlannerModeTabs } from "@/components/planner2/planner2-planner-mode-tabs";

const WHITEBOARD_VIEWPORT_H =
  "calc(100dvh - var(--app-shell-header-offset, 3.5rem) - var(--app-shell-footer-offset, 0rem))";

type Planner2PageProps = {
  params: { id: string };
};

export default function Planner2Page({ params }: Planner2PageProps) {
  return (
    <Box style={{ height: WHITEBOARD_VIEWPORT_H, minHeight: WHITEBOARD_VIEWPORT_H, width: "100%" }}>
      <Planner2PlannerModeTabs campaignId={params.id} viewportHeight={WHITEBOARD_VIEWPORT_H} />
    </Box>
  );
}
