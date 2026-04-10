"use client";

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Popover,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip
} from "@mantine/core";
import { IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react";
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import Link from "next/link";
import { memo, useCallback, useRef, useState } from "react";

import { getQuestForBoard } from "@/app/(app)/campaign/[id]/board/quests-actions";
import { PlannerPilotNodeDragEdges } from "@/components/planner2/planner-pilot-node-drag-edges";
import { Planner2ReactFlowNodeAddMenus } from "@/components/planner2/planner2-react-flow-node-add-trigger";
import { usePlanner2ReactFlowPilot } from "@/components/planner2/planner2-react-flow-pilot-context";
import {
  THREAD_PICKER_POPOVER_PROPS,
  ThreadPickerPanel
} from "@/components/planner2/planner2-thread-picker-panel";
import {
  clampHandleSlotPct,
  PLANNER_EVENT_EDITOR_PLACEHOLDER,
  plannerAccentColorFromThreadId,
  type PlannerEventHandleSlots,
  type PlannerEventNodeData
} from "@/types/planner2-react-flow-pilot";

function eventTileBorderColor(d: PlannerEventNodeData): string {
  const c = d.threadColor?.trim();
  if (c) {
    return c;
  }
  if (d.threadId) {
    return plannerAccentColorFromThreadId(d.threadId);
  }
  return "var(--mantine-color-gray-5)";
}

/** Jedno pole w kafelku: pierwsza linia → `title`, reszta → `co` (jak notatka w Miro). */
function eventNodeEditorValue(d: PlannerEventNodeData): string {
  if (d.title.trim() === "" && d.co !== "") {
    return d.co;
  }
  return d.co !== "" ? `${d.title}\n${d.co}` : d.title;
}

function parseEventNodeEditorValue(value: string): Pick<PlannerEventNodeData, "co" | "title"> {
  const i = value.indexOf("\n");
  if (i === -1) {
    return { title: value, co: "" };
  }
  return { title: value.slice(0, i), co: value.slice(i + 1) };
}

function EventNodeInner({ id, data }: NodeProps) {
  const {
    assignThreadToEvent,
    campaignId,
    createThreadForEvent,
    openEventDetails,
    patchEventData,
    threadOptions
  } = usePlanner2ReactFlowPilot();
  const d = data as PlannerEventNodeData;

  const [shellHover, setShellHover] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createThreadOpen, setCreateThreadOpen] = useState(false);
  const [newThreadName, setNewThreadName] = useState("");
  const [newThreadColor, setNewThreadColor] = useState("#7c3aed");
  const [threadError, setThreadError] = useState<string | null>(null);
  const [threadHover, setThreadHover] = useState(false);
  const [savingThread, setSavingThread] = useState(false);
  const [threadDetailsOpen, setThreadDetailsOpen] = useState(false);
  const [threadDetailsLoading, setThreadDetailsLoading] = useState(false);
  const [threadDetails, setThreadDetails] = useState<{
    description: string | null;
    name: string;
  } | null>(null);
  const [threadDetailsError, setThreadDetailsError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const slotsRef = useRef(d.handleSlotPct);
  slotsRef.current = d.handleSlotPct;

  const accent = eventTileBorderColor(d);
  const handleStyle = {
    background: accent.startsWith("var(") ? "var(--mantine-color-violet-6)" : accent,
    border: "1px solid var(--mantine-color-body)",
    borderRadius: 4,
    height: 12,
    opacity: shellHover ? 1 : 0,
    pointerEvents: shellHover ? "auto" : "none",
    transition: "opacity 120ms ease",
    width: 12,
    zIndex: 6
  } as const;
  const slots = d.handleSlotPct;
  const showThreadPickerTrigger = threadHover || pickerOpen;

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
        patchEventData(id, { handleSlotPct: base });
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
    [id, patchEventData, updateNodeInternals]
  );

  const openThreadDetails = useCallback(async () => {
    if (!d.threadId) {
      return;
    }
    setThreadDetailsOpen(true);
    setThreadDetailsLoading(true);
    setThreadDetailsError(null);
    setThreadDetails(null);
    const res = await getQuestForBoard(campaignId, d.threadId);
    setThreadDetailsLoading(false);
    if (!res.ok) {
      setThreadDetailsError(res.error);
      return;
    }
    setThreadDetails({ description: res.description, name: res.name });
  }, [campaignId, d.threadId]);

  const openCreateThreadModal = useCallback(() => {
    const palette = ["#7c3aed", "#2563eb", "#0891b2", "#059669", "#65a30d", "#d97706", "#dc2626"];
    const randomIdx = Math.floor(Math.random() * palette.length);
    setThreadError(null);
    setNewThreadName("");
    setNewThreadColor(palette[randomIdx] ?? palette[0]);
    setCreateThreadOpen(true);
  }, []);

  if (d.isPlacementPreview) {
    const skBg = "var(--mantine-color-gray-3)";
    const skBgSoft = "var(--mantine-color-gray-2)";
    const skBorder = "var(--mantine-color-gray-4)";
    return (
      <Box
        style={{
          cursor: "default",
          display: "inline-block",
          margin: -40,
          minWidth: 0,
          padding: 40,
          pointerEvents: "none"
        }}
      >
        <Box
          style={{
            backgroundColor: "var(--mantine-color-gray-0)",
            border: `1px dashed ${skBorder}`,
            borderRadius: "var(--mantine-radius-md)",
            maxWidth: 320,
            minWidth: 260,
            padding: "calc(var(--mantine-spacing-xs) * 2)",
            position: "relative"
          }}
        >
          <PlannerPilotNodeDragEdges />
          <Box className="nodrag">
            <Group align="center" gap={4} justify="flex-start" mb={6} pb="xs" wrap="nowrap">
              <Box
                style={{
                  backgroundColor: skBg,
                  border: `1px solid ${skBorder}`,
                  borderRadius: "var(--mantine-radius-sm)",
                  flex: "1 1 auto",
                  height: 22,
                  maxWidth: 168,
                  minWidth: 96
                }}
              />
              <Box
                style={{
                  backgroundColor: skBgSoft,
                  border: `1px solid ${skBorder}`,
                  borderRadius: "var(--mantine-radius-sm)",
                  flexShrink: 0,
                  height: 22,
                  width: 22
                }}
              />
              <Box
                style={{
                  backgroundColor: skBgSoft,
                  border: `1px solid ${skBorder}`,
                  borderRadius: "var(--mantine-radius-sm)",
                  flexShrink: 0,
                  height: 22,
                  width: 22
                }}
              />
            </Group>
            <Textarea
              autosize
              maxRows={14}
              minRows={5}
              placeholder={PLANNER_EVENT_EDITOR_PLACEHOLDER}
              readOnly
              resize="none"
              size="lg"
              styles={{
                input: {
                  "&::placeholder": { color: "var(--mantine-color-gray-5)" },
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  color: "var(--mantine-color-gray-7)",
                  lineHeight: 1.45,
                  padding: 0
                },
                root: { pointerEvents: "none", width: "100%" }
              }}
              tabIndex={-1}
              value={eventNodeEditorValue(d)}
              variant="unstyled"
            />
            <Group justify="flex-end" mt={6}>
              <Box
                style={{
                  alignItems: "center",
                  backgroundColor: skBgSoft,
                  border: `1px solid ${skBorder}`,
                  borderRadius: "var(--mantine-radius-sm)",
                  display: "flex",
                  height: 30,
                  justifyContent: "center",
                  pointerEvents: "none",
                  width: 30
                }}
              >
                <IconInfoCircle color="var(--mantine-color-gray-5)" size={16} stroke={1.5} />
              </Box>
            </Group>
          </Box>
        </Box>
      </Box>
    );
  }

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
          border: `1px solid ${eventTileBorderColor(d)}`,
          borderRadius: "var(--mantine-radius-md)",
          maxWidth: 320,
          minWidth: 260,
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
          <Group justify="space-between" mb={6} pb="xs">
            {d.threadLabel ? (
              <Group
                gap={4}
                onMouseEnter={() => setThreadHover(true)}
                onMouseLeave={() => setThreadHover(false)}
                wrap="nowrap"
              >
                <Badge
                  component="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void openThreadDetails();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  size="xs"
                  style={{
                    backgroundColor: `${d.threadColor ?? "#7c3aed"}22`,
                    borderColor: d.threadColor ?? "#7c3aed",
                    color: d.threadColor ?? "#7c3aed",
                    cursor: "pointer"
                  }}
                  type="button"
                  variant="light"
                >
                  {d.threadLabel}
                </Badge>
                <Popover
                  {...THREAD_PICKER_POPOVER_PROPS}
                  onChange={setPickerOpen}
                  opened={pickerOpen}
                >
                  <Popover.Target>
                    <ActionIcon
                      aria-label="Edytuj wątek"
                      color="gray"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerOpen((v) => !v);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      size="xs"
                      style={{
                        opacity: showThreadPickerTrigger ? 1 : 0,
                        pointerEvents: showThreadPickerTrigger ? "auto" : "none"
                      }}
                      variant="subtle"
                    >
                      <IconPencil size={12} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown
                    className="nodrag"
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    p="xs"
                  >
                    <ThreadPickerPanel
                      assignThreadToEvent={assignThreadToEvent}
                      eventNodeId={id}
                      onClose={() => setPickerOpen(false)}
                      onOpenCreate={openCreateThreadModal}
                      threadId={d.threadId}
                      threadOptions={threadOptions}
                    />
                  </Popover.Dropdown>
                </Popover>
                {threadHover ? (
                  <ActionIcon
                    aria-label="Usuń wątek"
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      assignThreadToEvent(id, null);
                      setPickerOpen(false);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    size="xs"
                    variant="subtle"
                  >
                    <IconTrash size={12} />
                  </ActionIcon>
                ) : null}
              </Group>
            ) : (
              <Popover
                {...THREAD_PICKER_POPOVER_PROPS}
                onChange={setPickerOpen}
                opened={pickerOpen}
              >
                <Popover.Target>
                  <Anchor
                    c="violet"
                    component="button"
                    fz="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPickerOpen((v) => !v);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    type="button"
                    style={{ lineHeight: 1.1 }}
                  >
                    Dodaj wątek
                  </Anchor>
                </Popover.Target>
                <Popover.Dropdown
                  className="nodrag"
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  p="xs"
                >
                  <ThreadPickerPanel
                    assignThreadToEvent={assignThreadToEvent}
                    eventNodeId={id}
                    onClose={() => setPickerOpen(false)}
                    onOpenCreate={openCreateThreadModal}
                    threadId={d.threadId}
                    threadOptions={threadOptions}
                  />
                </Popover.Dropdown>
              </Popover>
            )}
          </Group>
          <Modal
            centered
            onClose={() => {
              setThreadDetailsOpen(false);
              setThreadDetails(null);
              setThreadDetailsError(null);
            }}
            opened={threadDetailsOpen}
            title={d.threadLabel?.trim() ? d.threadLabel : "Wątek"}
          >
            <Stack gap="md">
              {threadDetailsLoading ? (
                <Group justify="center" py="md">
                  <Loader size="sm" />
                </Group>
              ) : threadDetailsError ? (
                <Text c="red" size="md">
                  {threadDetailsError}
                </Text>
              ) : threadDetails ? (
                <>
                  <div>
                    <Text
                      mb={6}
                      size="md"
                      style={{
                        color: "light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-3))"
                      }}
                      tt="uppercase"
                      fw={600}
                    >
                      Nazwa
                    </Text>
                    <Text fw={600} size="md" style={{ lineHeight: 1.45 }}>
                      {threadDetails.name}
                    </Text>
                  </div>
                  <div>
                    <Text
                      mb={6}
                      size="md"
                      style={{
                        color: "light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-3))"
                      }}
                      tt="uppercase"
                      fw={600}
                    >
                      Opis
                    </Text>
                    <Text
                      size="md"
                      style={{
                        color: "light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-0))",
                        lineHeight: 1.55,
                        whiteSpace: "pre-wrap"
                      }}
                    >
                      {threadDetails.description?.trim() ? threadDetails.description : "—"}
                    </Text>
                  </div>
                  {d.threadId ? (
                    <Text component={Link} href={`/campaign/${campaignId}/quests/${d.threadId}`} size="md" td="underline">
                      Otwórz stronę wątku
                    </Text>
                  ) : null}
                </>
              ) : null}
            </Stack>
          </Modal>
          <Modal
            centered
            onClose={() => {
              if (savingThread) {
                return;
              }
              setCreateThreadOpen(false);
            }}
            opened={createThreadOpen}
            title="Utwórz nowy wątek"
          >
            <Stack gap="sm">
              <TextInput
                autoFocus
                label="Nazwa wątku"
                onChange={(e) => setNewThreadName(e.currentTarget.value)}
                placeholder="np. Wojna o Tron Mgieł"
                value={newThreadName}
              />
              <TextInput
                label="Kolor wątku"
                onChange={(e) => setNewThreadColor(e.currentTarget.value)}
                type="color"
                value={newThreadColor}
              />
              {threadError ? (
                <Text c="red" size="xs">
                  {threadError}
                </Text>
              ) : null}
              <Group justify="flex-end">
                <Button
                  onClick={() => setCreateThreadOpen(false)}
                  variant="default"
                  disabled={savingThread}
                >
                  Anuluj
                </Button>
                <Button
                  loading={savingThread}
                  onClick={async () => {
                    setSavingThread(true);
                    setThreadError(null);
                    const result = await createThreadForEvent(id, newThreadName, newThreadColor);
                    setSavingThread(false);
                    if (result.error) {
                      setThreadError(result.error);
                      return;
                    }
                    setCreateThreadOpen(false);
                    setPickerOpen(false);
                  }}
                >
                  Zapisz
                </Button>
              </Group>
            </Stack>
          </Modal>
          <Textarea
            autosize
            maxRows={14}
            minRows={5}
            onChange={(e) => patchEventData(id, parseEventNodeEditorValue(e.currentTarget.value))}
            placeholder={PLANNER_EVENT_EDITOR_PLACEHOLDER}
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
            value={eventNodeEditorValue(d)}
            variant="unstyled"
          />
          <Group justify="flex-end" mt={6}>
            <Tooltip label="Szczegóły eventu" position="left" withArrow>
              <ActionIcon
                aria-label="Szczegóły eventu"
                color="violet"
                onClick={() => openEventDetails(id)}
                onPointerDown={(e) => e.stopPropagation()}
                size="sm"
                variant="subtle"
              >
                <IconInfoCircle size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>
      </Box>
    </Box>
  );
}

export const Planner2ReactFlowEventNode = memo(EventNodeInner);
