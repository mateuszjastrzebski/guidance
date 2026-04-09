"use client";

import { ActionIcon, Box, Tooltip } from "@mantine/core";
import type { FloatingPosition } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import { usePlanner2ReactFlowPilot } from "@/components/planner2/planner2-react-flow-pilot-context";
import {
  type PilotEdgeSide,
  PILOT_EDGE_SIDES
} from "@/lib/planner2-react-flow-pilot-layout";

const SIDE_UI: Record<
  PilotEdgeSide,
  { style: React.CSSProperties; tooltip: string }
> = {
  top: {
    style: { left: "50%", top: -34, transform: "translateX(-50%)" },
    tooltip: "Dodaj event powyżej"
  },
  right: {
    style: { right: -34, top: "50%", transform: "translateY(-50%)" },
    tooltip: "Dodaj event na prawo"
  },
  bottom: {
    style: { bottom: -34, left: "50%", transform: "translateX(-50%)" },
    tooltip: "Dodaj event poniżej"
  },
  left: {
    style: { left: -34, top: "50%", transform: "translateY(-50%)" },
    tooltip: "Dodaj event na lewo"
  }
};

export type Planner2ReactFlowNodeAddMenusProps = {
  hoverParent: boolean;
  sourceNodeId: string;
};

export function Planner2ReactFlowNodeAddMenus({
  hoverParent,
  sourceNodeId
}: Planner2ReactFlowNodeAddMenusProps) {
  const { addNodeFromNode } = usePlanner2ReactFlowPilot();

  return (
    <>
      {PILOT_EDGE_SIDES.map((side) => {
        const cfg = SIDE_UI[side];
        return (
          <Box
            key={side}
            className="nodrag"
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              opacity: hoverParent ? 1 : 0,
              pointerEvents: hoverParent ? "auto" : "none",
              position: "absolute",
              transition: "opacity 120ms ease",
              zIndex: 10,
              ...cfg.style
            }}
          >
            <Tooltip label={cfg.tooltip} position="top" withArrow>
              <ActionIcon
                aria-label={cfg.tooltip}
                color="violet"
                onClick={() => addNodeFromNode(sourceNodeId, { side, type: "event" })}
                size="sm"
                variant="filled"
              >
                <IconPlus size={16} />
              </ActionIcon>
            </Tooltip>
          </Box>
        );
      })}
    </>
  );
}
