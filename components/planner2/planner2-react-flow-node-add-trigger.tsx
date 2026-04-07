"use client";

import { ActionIcon, Box, Menu, Tooltip } from "@mantine/core";
import type { FloatingPosition } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";

import { usePlanner2ReactFlowPilot } from "@/components/planner2/planner2-react-flow-pilot-context";
import {
  type PilotEdgeSide,
  PILOT_EDGE_SIDES
} from "@/lib/planner2-react-flow-pilot-layout";
import { PLANNER_INFO_KIND_OPTIONS } from "@/types/planner2-react-flow-pilot";

const SIDE_UI: Record<
  PilotEdgeSide,
  { menuPosition: FloatingPosition; style: React.CSSProperties; tooltip: string }
> = {
  top: {
    menuPosition: "bottom-start",
    style: { left: "50%", top: -34, transform: "translateX(-50%)" },
    tooltip: "Dodaj powyżej"
  },
  right: {
    menuPosition: "left-start",
    style: { right: -34, top: "50%", transform: "translateY(-50%)" },
    tooltip: "Dodaj na prawo"
  },
  bottom: {
    menuPosition: "top-start",
    style: { bottom: -34, left: "50%", transform: "translateX(-50%)" },
    tooltip: "Dodaj poniżej"
  },
  left: {
    menuPosition: "right-start",
    style: { left: -34, top: "50%", transform: "translateY(-50%)" },
    tooltip: "Dodaj na lewo"
  }
};

export type Planner2ReactFlowNodeAddMenusProps = {
  hoverParent: boolean;
  sourceNodeId: string;
  /** Z węzła info można dodać tylko event (brak krawędzi info–info). */
  sourceNodeType: "event" | "info";
};

export function Planner2ReactFlowNodeAddMenus({
  hoverParent,
  sourceNodeId,
  sourceNodeType
}: Planner2ReactFlowNodeAddMenusProps) {
  const { addNodeFromNode } = usePlanner2ReactFlowPilot();
  const [openSide, setOpenSide] = useState<PilotEdgeSide | null>(null);
  const visible = hoverParent || openSide !== null;

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
              opacity: visible ? 1 : 0,
              pointerEvents: visible ? "auto" : "none",
              position: "absolute",
              transition: "opacity 120ms ease",
              zIndex: 10,
              ...cfg.style
            }}
          >
            <Menu
              closeOnItemClick
              onChange={(opened) => {
                setOpenSide(opened ? side : null);
              }}
              opened={openSide === side}
              position={cfg.menuPosition}
              shadow="md"
              withinPortal
            >
              <Menu.Target>
                <Tooltip label={cfg.tooltip} position="top" withArrow>
                  <ActionIcon aria-label={cfg.tooltip} color="violet" size="sm" variant="filled">
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  onClick={() => addNodeFromNode(sourceNodeId, { side, type: "event" })}
                >
                  Dodaj event
                </Menu.Item>
                {sourceNodeType === "event" &&
                  PLANNER_INFO_KIND_OPTIONS.map(({ kind, label }) => (
                    <Menu.Item
                      key={kind}
                      onClick={() =>
                        addNodeFromNode(sourceNodeId, { kind, side, type: "info" })
                      }
                    >
                      {label}
                    </Menu.Item>
                  ))}
              </Menu.Dropdown>
            </Menu>
          </Box>
        );
      })}
    </>
  );
}
