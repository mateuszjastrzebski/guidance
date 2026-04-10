"use client";

import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Popover,
  Stack,
  Text,
  TextInput
} from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { getQuestForBoard } from "@/app/(app)/campaign/[id]/board/quests-actions";
import { usePlanner2ReactFlowPilot } from "@/components/planner2/planner2-react-flow-pilot-context";
import {
  THREAD_PICKER_POPOVER_PROPS,
  ThreadPickerPanel
} from "@/components/planner2/planner2-thread-picker-panel";
import type { PlannerEventNodeData } from "@/types/planner2-react-flow-pilot";

type Planner2EventDetailsThreadBarProps = {
  eventNodeId: string;
  eventData: PlannerEventNodeData;
};

export function Planner2EventDetailsThreadBar({ eventNodeId, eventData: d }: Planner2EventDetailsThreadBarProps) {
  const { assignThreadToEvent, campaignId, createThreadForEvent, threadOptions } = usePlanner2ReactFlowPilot();

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

  const showThreadPickerTrigger = threadHover || pickerOpen;

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

  return (
    <>
      <Group justify="space-between" mb={4} wrap="nowrap" w="100%">
        {d.threadLabel ? (
          <Group
            gap={4}
            onMouseEnter={() => setThreadHover(true)}
            onMouseLeave={() => setThreadHover(false)}
            wrap="nowrap"
          >
            <Badge
              component="button"
              onClick={() => {
                void openThreadDetails();
              }}
              size="md"
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
            <Popover {...THREAD_PICKER_POPOVER_PROPS} onChange={setPickerOpen} opened={pickerOpen}>
              <Popover.Target>
                <ActionIcon
                  aria-label="Edytuj wątek"
                  color="gray"
                  onClick={() => setPickerOpen((v) => !v)}
                  size="sm"
                  style={{
                    opacity: showThreadPickerTrigger ? 1 : 0,
                    pointerEvents: showThreadPickerTrigger ? "auto" : "none"
                  }}
                  variant="subtle"
                >
                  <IconPencil size={12} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown p="xs">
                <ThreadPickerPanel
                  assignThreadToEvent={assignThreadToEvent}
                  eventNodeId={eventNodeId}
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
                onClick={() => {
                  assignThreadToEvent(eventNodeId, null);
                  setPickerOpen(false);
                }}
                size="sm"
                variant="subtle"
              >
                <IconTrash size={12} />
              </ActionIcon>
            ) : null}
          </Group>
        ) : (
          <Popover {...THREAD_PICKER_POPOVER_PROPS} onChange={setPickerOpen} opened={pickerOpen}>
            <Popover.Target>
              <Anchor
                c="violet"
                component="button"
                fz="md"
                onClick={() => setPickerOpen((v) => !v)}
                type="button"
                style={{ lineHeight: 1.1 }}
              >
                Dodaj wątek
              </Anchor>
            </Popover.Target>
            <Popover.Dropdown p="xs">
              <ThreadPickerPanel
                assignThreadToEvent={assignThreadToEvent}
                eventNodeId={eventNodeId}
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
            <Text c="red" size="md">
              {threadError}
            </Text>
          ) : null}
          <Group justify="flex-end">
            <Button disabled={savingThread} onClick={() => setCreateThreadOpen(false)} variant="default">
              Anuluj
            </Button>
            <Button
              loading={savingThread}
              onClick={async () => {
                setSavingThread(true);
                setThreadError(null);
                const result = await createThreadForEvent(eventNodeId, newThreadName, newThreadColor);
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
    </>
  );
}
