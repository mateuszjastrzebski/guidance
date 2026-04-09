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
  MultiSelect,
  Popover,
  Select,
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
import {
  usePlanner2ReactFlowPilot,
  type PlannerThreadOption
} from "@/components/planner2/planner2-react-flow-pilot-context";
import {
  clampHandleSlotPct,
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

const THREAD_PICKER_POPOVER_PROPS = {
  closeOnClickOutside: true,
  position: "bottom-start" as const,
  shadow: "md" as const,
  trapFocus: false,
  width: 280,
  withArrow: true,
  withinPortal: true,
  zIndex: 5000
};

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

type ThreadPickerPanelProps = {
  assignThreadToEvent: (nodeId: string, thread: PlannerThreadOption | null) => void;
  eventNodeId: string;
  onClose: () => void;
  onOpenCreate: () => void;
  threadId: string | undefined;
  threadOptions: PlannerThreadOption[];
};

function ThreadPickerPanel({
  assignThreadToEvent,
  eventNodeId,
  onClose,
  onOpenCreate,
  threadId,
  threadOptions
}: ThreadPickerPanelProps) {
  return (
    <Stack gap={6}>
      <Select
        clearable
        comboboxProps={{ withinPortal: false, zIndex: 6000 }}
        data={threadOptions.map((thread) => ({ label: thread.name, value: thread.id }))}
        onChange={(value) => {
          if (value === null) {
            assignThreadToEvent(eventNodeId, null);
            onClose();
            return;
          }
          const selected = threadOptions.find((thread) => thread.id === value) ?? null;
          assignThreadToEvent(eventNodeId, selected);
          onClose();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Wybierz wątek"
        size="xs"
        value={threadId ?? null}
      />
      <Group justify="space-between" wrap="nowrap">
        <Button
          color="gray"
          onClick={() => {
            assignThreadToEvent(eventNodeId, null);
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          size="compact-xs"
          variant="subtle"
        >
          Wyczyść
        </Button>
        <Button
          onClick={() => {
            onClose();
            onOpenCreate();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          size="compact-xs"
          variant="light"
        >
          Utwórz nowy
        </Button>
      </Group>
    </Stack>
  );
}

function EventNodeInner({ id, data }: NodeProps) {
  const {
    assignThreadToEvent,
    campaignId,
    characterOptions,
    createThreadForEvent,
    patchEventData,
    setEventCharacterIds,
    threadOptions
  } = usePlanner2ReactFlowPilot();
  const d = data as PlannerEventNodeData;

  const [shellHover, setShellHover] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
            background: "var(--mantine-color-body)",
            border: "1px dashed var(--mantine-color-violet-4)",
            borderRadius: "var(--mantine-radius-md)",
            maxWidth: 320,
            minWidth: 260,
            opacity: 0.72,
            padding: "calc(var(--mantine-spacing-xs) * 2)",
            position: "relative"
          }}
        >
          <Text c="dimmed" mb={4} size="xs">
            Podgląd
          </Text>
          <Text fw={600} size="sm">
            {d.title}
          </Text>
          <Text c="dimmed" mt={6} size="xs">
            Kliknij tło planera, aby wstawić. ESC — anuluj.
          </Text>
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
          {characterOptions.length > 0 ? (
            <Box className="nodrag" mb={6}>
              <MultiSelect
                comboboxProps={{ withinPortal: true, zIndex: 6000 }}
                data={characterOptions.map((c) => ({ label: c.name, value: c.id }))}
                onChange={(v) => setEventCharacterIds(id, v)}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="Postacie w evencie"
                size="xs"
                value={d.characterIds ?? []}
              />
            </Box>
          ) : null}
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
                <Text c="red" size="sm">
                  {threadDetailsError}
                </Text>
              ) : threadDetails ? (
                <>
                  <div>
                    <Text c="dimmed" mb={4} size="xs" tt="uppercase" fw={600}>
                      Nazwa
                    </Text>
                    <Text size="sm">{threadDetails.name}</Text>
                  </div>
                  <div>
                    <Text c="dimmed" mb={4} size="xs" tt="uppercase" fw={600}>
                      Opis
                    </Text>
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                      {threadDetails.description?.trim() ? threadDetails.description : "—"}
                    </Text>
                  </div>
                  {d.threadId ? (
                    <Text component={Link} href={`/campaign/${campaignId}/quests/${d.threadId}`} size="xs">
                      Otwórz stronę wątku
                    </Text>
                  ) : null}
                </>
              ) : null}
            </Stack>
          </Modal>
          <Modal
            centered
            onClose={() => setDetailsOpen(false)}
            opened={detailsOpen}
            title={d.title.trim() ? d.title : "Event"}
          >
            <Stack gap="md">
              <div>
                <Text c="dimmed" mb={4} size="xs" tt="uppercase" fw={600}>
                  Tytuł
                </Text>
                <Text size="sm">{d.title.trim() ? d.title : "—"}</Text>
              </div>
              <div>
                <Text c="dimmed" mb={4} size="xs" tt="uppercase" fw={600}>
                  Co
                </Text>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {d.co.trim() ? d.co : "—"}
                </Text>
              </div>
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
            placeholder="Wpisz tytuł i treść…"
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
                onClick={() => setDetailsOpen(true)}
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
