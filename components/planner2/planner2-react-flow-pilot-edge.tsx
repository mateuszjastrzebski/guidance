"use client";

import { ActionIcon } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePlanner2ReactFlowPilot } from "@/components/planner2/planner2-react-flow-pilot-context";

const EDGE_PLUS_HIDE_MS = 280;

export function Planner2ReactFlowPilotEventEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    source,
    target,
    data,
    sourceHandleId,
    targetHandleId
  } = props;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY
  });

  const [showPlus, setShowPlus] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { insertEventOnEdge } = usePlanner2ReactFlowPilot();

  const cancelHidePlus = useCallback(() => {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHidePlus = useCallback(() => {
    cancelHidePlus();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setShowPlus(false);
    }, EDGE_PLUS_HIDE_MS);
  }, [cancelHidePlus]);

  useEffect(() => () => cancelHidePlus(), [cancelHidePlus]);

  const revealPlus = useCallback(() => {
    cancelHidePlus();
    setShowPlus(true);
  }, [cancelHidePlus]);

  const onPlus = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      cancelHidePlus();
      const payload: Edge = {
        data,
        id,
        source,
        sourceHandle: sourceHandleId ?? undefined,
        target,
        targetHandle: targetHandleId ?? undefined
      };
      insertEventOnEdge(payload);
      setShowPlus(false);
    },
    [
      cancelHidePlus,
      data,
      id,
      insertEventOnEdge,
      source,
      sourceHandleId,
      target,
      targetHandleId
    ]
  );

  return (
    <>
      <g onMouseEnter={revealPlus} onMouseLeave={scheduleHidePlus}>
        <BaseEdge
          interactionWidth={28}
          labelX={labelX}
          labelY={labelY}
          markerEnd={markerEnd}
          path={edgePath}
          style={style}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan planner-pilot-edge-plus-hit"
          onMouseEnter={revealPlus}
          onMouseLeave={scheduleHidePlus}
          style={{
            height: 72,
            left: labelX,
            pointerEvents: "auto",
            position: "absolute",
            top: labelY,
            transform: "translate(-50%, -50%)",
            width: 72
          }}
        >
          {showPlus ? (
            <ActionIcon
              aria-label="Wstaw event pomiędzy"
              className="planner-pilot-edge-plus"
              color="gray"
              onClick={onPlus}
              onPointerDown={(e) => e.stopPropagation()}
              radius="xl"
              size="sm"
              title="Wstaw event pomiędzy"
              variant="filled"
            >
              <IconPlus size={14} stroke={2} />
            </ActionIcon>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
