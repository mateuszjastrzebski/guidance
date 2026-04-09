"use client";

import { Box } from "@mantine/core";

import { PLANNER_PILOT_NODE_DRAG_CLASS } from "@/types/planner2-react-flow-pilot";

/**
 * Grubość pasa wzdłuż krawędzi — zgodna z `p="xs"` na karcie (Mantine ~10px),
 * żeby pasy leżały w „obwódce” paddingu i nie zasłaniały pól.
 */
const GUTTER_PX = 10;

const stripBase = {
  position: "absolute" as const,
  touchAction: "none" as const,
  zIndex: 2
};

/**
 * Niewidoczne pasy w pasie paddingu karty; tylko one mają klasę uchwytu do `Node.dragHandle`.
 */
export function PlannerPilotNodeDragEdges() {
  return (
    <>
      <Box
        className={PLANNER_PILOT_NODE_DRAG_CLASS}
        style={{ ...stripBase, height: GUTTER_PX, left: 0, right: 0, top: 0 }}
      />
      <Box
        className={PLANNER_PILOT_NODE_DRAG_CLASS}
        style={{ ...stripBase, bottom: 0, height: GUTTER_PX, left: 0, right: 0 }}
      />
      <Box
        className={PLANNER_PILOT_NODE_DRAG_CLASS}
        style={{
          ...stripBase,
          bottom: GUTTER_PX,
          left: 0,
          top: GUTTER_PX,
          width: GUTTER_PX
        }}
      />
      <Box
        className={PLANNER_PILOT_NODE_DRAG_CLASS}
        style={{
          ...stripBase,
          bottom: GUTTER_PX,
          right: 0,
          top: GUTTER_PX,
          width: GUTTER_PX
        }}
      />
    </>
  );
}
