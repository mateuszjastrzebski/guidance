"use client";

import { Box, Textarea } from "@mantine/core";
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import { memo, useCallback, useRef, useState } from "react";

import { PlannerPilotNodeDragEdges } from "@/components/planner2/planner-pilot-node-drag-edges";
import { Planner2ReactFlowNodeAddMenus } from "@/components/planner2/planner2-react-flow-node-add-trigger";
import { usePlanner2ReactFlowPilot } from "@/components/planner2/planner2-react-flow-pilot-context";
import {
  clampHandleSlotPct,
  plannerAccentColorFromThreadId,
  plannerInfoKindBorderColor,
  plannerInfoKindLabel,
  type PlannerEventHandleSlots,
  type PlannerInfoNodeData
} from "@/types/planner2-react-flow-pilot";

function InfoNodeInner({ id, data }: NodeProps) {
  const { patchInfoData } = usePlanner2ReactFlowPilot();
  const d = data as PlannerInfoNodeData;
  const [shellHover, setShellHover] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const slotsRef = useRef(d.handleSlotPct);
  slotsRef.current = d.handleSlotPct;

  const slots = d.handleSlotPct;
  const borderColor = d.threadColor?.trim()
    ? d.threadColor.trim()
    : d.threadId
      ? plannerAccentColorFromThreadId(d.threadId)
      : plannerInfoKindBorderColor(d.kind);

  const handleStyle = {
    background: borderColor.startsWith("var(") ? "var(--mantine-color-violet-6)" : borderColor,
    border: "1px solid var(--mantine-color-body)",
    borderRadius: 4,
    height: 12,
    opacity: shellHover ? 1 : 0,
    pointerEvents: shellHover ? "auto" : "none",
    transition: "opacity 120ms ease",
    width: 12,
    zIndex: 6
  } as const;

  const onHandleShiftPointerDown = useCallback(
    (side: keyof PlannerEventHandleSlots) => (e: React.PointerEvent) => {
      if (!e.shiftKey) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const root = rootRef.current;
      if (!root) {
        return;
      }

      const onMove = (ev: PointerEvent) => {
        const rect = root.getBoundingClientRect();
        const base = { ...slotsRef.current };
        if (side === "left" || side === "right") {
          const pct = ((ev.clientY - rect.top) / Math.max(1, rect.height)) * 100;
          base[side] = clampHandleSlotPct(pct);
        } else {
          const pct = ((ev.clientX - rect.left) / Math.max(1, rect.width)) * 100;
          base[side] = clampHandleSlotPct(pct);
        }
        slotsRef.current = base;
        patchInfoData(id, { handleSlotPct: base });
        updateNodeInternals(id);
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [id, patchInfoData, updateNodeInternals]
  );

  return (
    <Box
      onMouseEnter={() => setShellHover(true)}
      onMouseLeave={() => setShellHover(false)}
      onWheelCapture={(e) => e.stopPropagation()}
      style={{
        cursor: "default",
        display: "inline-block",
        margin: -40,
        minWidth: 0,
        padding: 40
      }}
    >
      <Box
        ref={rootRef}
        style={{
          background: "var(--mantine-color-body)",
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--mantine-radius-md)",
          maxWidth: 280,
          minWidth: 220,
          padding: "calc(var(--mantine-spacing-xs) * 2)",
          position: "relative"
        }}
      >
      <PlannerPilotNodeDragEdges />
      <Planner2ReactFlowNodeAddMenus hoverParent={shellHover} sourceNodeId={id} />
      <Handle
        id="left"
        onPointerDownCapture={onHandleShiftPointerDown("left")}
        position={Position.Left}
        style={{
          ...handleStyle,
          top: `${slots.left}%`,
          transform: "translate(-50%, -50%)"
        }}
        title="Shift + przeciągnij — przesuń wzdłuż krawędzi"
        type="source"
      />
      <Handle
        id="right"
        onPointerDownCapture={onHandleShiftPointerDown("right")}
        position={Position.Right}
        style={{
          ...handleStyle,
          top: `${slots.right}%`,
          transform: "translate(50%, -50%)"
        }}
        title="Shift + przeciągnij — przesuń wzdłuż krawędzi"
        type="source"
      />
      <Handle
        id="top"
        onPointerDownCapture={onHandleShiftPointerDown("top")}
        position={Position.Top}
        style={{
          ...handleStyle,
          left: `${slots.top}%`,
          transform: "translate(-50%, -50%)"
        }}
        title="Shift + przeciągnij — przesuń wzdłuż krawędzi"
        type="source"
      />
      <Handle
        id="bottom"
        onPointerDownCapture={onHandleShiftPointerDown("bottom")}
        position={Position.Bottom}
        style={{
          ...handleStyle,
          left: `${slots.bottom}%`,
          transform: "translate(-50%, 50%)"
        }}
        title="Shift + przeciągnij — przesuń wzdłuż krawędzi"
        type="source"
      />
      <Box className="nodrag">
        <Textarea
          autosize
          maxRows={14}
          minRows={5}
          onChange={(e) => patchInfoData(id, { text: e.currentTarget.value })}
          placeholder={plannerInfoKindLabel(d.kind)}
          resize="none"
          size="lg"
          styles={{
            input: {
              background: "transparent",
              border: "none",
              boxShadow: "none",
              lineHeight: 1.45,
              padding: 0
            },
            root: { width: "100%" }
          }}
          value={d.text}
          variant="unstyled"
        />
      </Box>
      </Box>
    </Box>
  );
}

export const Planner2ReactFlowInfoNode = memo(InfoNodeInner);
