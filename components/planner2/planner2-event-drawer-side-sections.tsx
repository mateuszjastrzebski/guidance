"use client";

import {
  ActionIcon,
  Box,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton
} from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";
import { useCallback, type ComponentType, type ReactNode } from "react";

import {
  WorldEntryCollectionEditorSection,
  type EditableWorldCollection,
  type EditableWorldEntryOption
} from "@/components/campaign/world-entry-collection-editor-section";
import { PlayerInfosSection } from "@/components/campaign/player-infos-section";
import {
  usePlanner2ReactFlowPilot,
  type PlannerCharacterOption,
  type PlannerWorldCollectionOption
} from "@/components/planner2/planner2-react-flow-pilot-context";
import type { PlannerWorldEntryRef } from "@/types/planner2-react-flow-pilot";

const DLACZEGO_ACCENT =
  "light-dark(var(--mantine-color-red-6), var(--mantine-color-red-4))";

function EventDrawerSectionHeading({
  children,
  icon: Icon,
  iconColor
}: {
  children: ReactNode;
  icon: ComponentType<{ size?: number | string; stroke?: number | string; style?: object }>;
  iconColor: string;
}) {
  return (
    <Group align="center" gap="sm" wrap="nowrap" w="100%">
      <span style={{ color: iconColor, display: "inline-flex", flexShrink: 0 }}>
        <Icon size={20} stroke={1.5} />
      </span>
      <Title
        order={4}
        style={{
          color: "light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-0))",
          flex: 1,
          fontWeight: 600,
          lineHeight: 1.35,
          margin: 0
        }}
      >
        {children}
      </Title>
    </Group>
  );
}

type EventDrawerDlaczegoSectionProps = {
  onChange: (value: string) => void;
  value: string;
};

export function EventDrawerDlaczegoSection({ onChange, value }: EventDrawerDlaczegoSectionProps) {
  return (
    <Stack align="flex-start" gap="sm" w="100%">
      <EventDrawerSectionHeading icon={IconHelp} iconColor={DLACZEGO_ACCENT}>
        Dlaczego to się stało?
      </EventDrawerSectionHeading>
      <Textarea
        autosize
        maxRows={16}
        minRows={4}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder="Motywacje NPC, konsekwencje wcześniejszych scen, ukryte przyczyny…"
        resize="none"
        size="md"
        styles={{ root: { width: "100%" } }}
        value={value}
      />
    </Stack>
  );
}

function EventDrawerPlayerInfosSection({
  campaignCharacters,
  eventNodeId
}: {
  campaignCharacters: PlannerCharacterOption[];
  eventNodeId: string;
}) {
  const { campaignId } = usePlanner2ReactFlowPilot();
  return (
    <PlayerInfosSection
      campaignId={campaignId}
      campaignCharacters={campaignCharacters}
      entityRef={{ type: "event" as const, id: eventNodeId }}
    />
  );
}

type Planner2EventDrawerSideSectionsProps = {
  campaignCharacters: PlannerCharacterOption[];
  dlaczego: string;
  eventNodeId: string;
  eventThreadId?: string;
  onDlaczegoChange: (value: string) => void;
  worldEntryRefs: PlannerWorldEntryRef[];
};

export function Planner2EventDrawerSideSections({
  campaignCharacters,
  dlaczego,
  eventNodeId,
  eventThreadId,
  onDlaczegoChange,
  worldEntryRefs
}: Planner2EventDrawerSideSectionsProps) {
  const { createWorldEntryInline, patchEventData, worldCollections, worldEntryOptions, worldEntryRefHref } =
    usePlanner2ReactFlowPilot();
  void eventThreadId;

  return (
    <Stack align="flex-start" style={{ gap: "2.5rem" }} w="100%">
      <EventDrawerDlaczegoSection onChange={onDlaczegoChange} value={dlaczego} />
      {worldCollections.map((collection) => (
        <Box key={collection.id} w="100%">
          <Divider mb="2.5rem" w="100%" />
          <WorldEntryCollectionEditorSection
            collection={collection}
            createWorldEntryInline={createWorldEntryInline as (
              collectionId: string,
              name: string
            ) => Promise<EditableWorldEntryOption | null>}
            hrefForRef={worldEntryRefHref}
            onChange={(nextRefs) =>
              patchEventData(eventNodeId, {
                worldEntryRefs: nextRefs.length > 0 ? nextRefs : undefined
              })
            }
            worldEntryOptions={worldEntryOptions.map((entry) => ({
              collectionId: entry.collectionId,
              collectionSlug: entry.collectionSlug,
              id: entry.entryId,
              name: entry.name
            }))}
            worldEntryRefs={worldEntryRefs}
          />
        </Box>
      ))}
      <Divider w="100%" />
      <EventDrawerPlayerInfosSection
        campaignCharacters={campaignCharacters}
        eventNodeId={eventNodeId}
      />
    </Stack>
  );
}
