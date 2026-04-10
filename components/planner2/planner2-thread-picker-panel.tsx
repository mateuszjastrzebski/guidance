"use client";

import { Button, Group, Select, Stack } from "@mantine/core";

import type { PlannerThreadOption } from "@/components/planner2/planner2-react-flow-pilot-context";

export const THREAD_PICKER_POPOVER_PROPS = {
  closeOnClickOutside: true,
  position: "bottom-start" as const,
  shadow: "md" as const,
  trapFocus: false,
  width: 280,
  withArrow: true,
  withinPortal: true,
  zIndex: 5000
};

type ThreadPickerPanelProps = {
  assignThreadToEvent: (nodeId: string, thread: PlannerThreadOption | null) => void;
  eventNodeId: string;
  onClose: () => void;
  onOpenCreate: () => void;
  threadId: string | undefined;
  threadOptions: PlannerThreadOption[];
};

export function ThreadPickerPanel({
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
