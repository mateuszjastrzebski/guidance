"use client";

import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton
} from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";

import {
  usePlanner2ReactFlowPilot,
  type PlannerCharacterOption,
  type PlannerLocationOption
} from "@/components/planner2/planner2-react-flow-pilot-context";
import {
  IconExternalLink,
  IconHelp,
  IconMapPin,
  IconMask,
  IconNotes,
  IconPackage,
  IconPlus,
  IconTrash
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";

import { PlayerInfosSection } from "@/components/campaign/player-infos-section";

export type EventDrawerMultiValueVariant = "places" | "items" | "notes";

/** Obrys w kolorze primary motywu (`primaryColor` w `mantine-theme.ts`). */
const drawerPrimaryOutlineButtonProps = {
  color: "violet" as const,
  size: "md" as const,
  variant: "outline" as const
};

const DLACZEGO_ACCENT =
  "light-dark(var(--mantine-color-red-6), var(--mantine-color-red-4))";

/**
 * Nagłówek sekcji w drawera — skala theme: poniżej tytułu eventu (h2), spójnie dla wszystkich bloków.
 * `order={4}` ≈ „podtytuł panelu” względem głównego pola tytułu.
 */
function EventDrawerSectionHeading({
  children,
  icon: Icon,
  iconColor
}: {
  children: ReactNode;
  icon: typeof IconMapPin;
  iconColor: string;
}) {
  return (
    <Group align="center" gap="sm" wrap="nowrap" w="100%">
      <Icon aria-hidden size={20} stroke={1.5} style={{ color: iconColor, flexShrink: 0 }} />
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

const VARIANT_META: Record<
  EventDrawerMultiValueVariant,
  {
    accent: string;
    addLabel: string;
    Icon: typeof IconMapPin;
  }
> = {
  places: {
    Icon: IconMapPin,
    accent: "light-dark(var(--mantine-color-teal-6), var(--mantine-color-teal-4))",
    addLabel: "Dodaj miejsce"
  },
  items: {
    Icon: IconPackage,
    accent: "light-dark(var(--mantine-color-orange-6), var(--mantine-color-orange-4))",
    addLabel: "Dodaj rekwizyt"
  },
  notes: {
    Icon: IconNotes,
    accent: "light-dark(var(--mantine-color-violet-6), var(--mantine-color-violet-4))",
    addLabel: "Dodaj notatkę"
  }
};

type EventDrawerMultiValueSectionProps = {
  title: string;
  variant: EventDrawerMultiValueVariant;
};

export function EventDrawerMultiValueSection({ title, variant }: EventDrawerMultiValueSectionProps) {
  const [items, setItems] = useState<string[]>([]);
  const meta = VARIANT_META[variant];
  const { Icon, accent, addLabel } = meta;

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, `${title} ${prev.length + 1} (placeholder)`]);
  }, [title]);

  return (
    <Stack align="flex-start" gap="sm">
      <EventDrawerSectionHeading icon={Icon} iconColor={accent}>
        {title}
      </EventDrawerSectionHeading>
      {items.length > 0 ? (
        <Stack gap={4} w="100%">
          {items.map((item, idx) => (
            <Group gap="xs" justify="space-between" key={`${item}-${idx}`} wrap="nowrap">
              <Text lineClamp={2} size="md" style={{ flex: 1 }}>
                {item}
              </Text>
              <ActionIcon
                aria-label={`Usuń wpis: ${item}`}
                color="gray"
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                size="sm"
                variant="subtle"
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      ) : null}
      <Button
        aria-label={`${addLabel} — sekcja ${title}`}
        onClick={addItem}
        {...drawerPrimaryOutlineButtonProps}
      >
        {addLabel}
      </Button>
    </Stack>
  );
}

const LOCATION_ACCENT =
  "light-dark(var(--mantine-color-teal-6), var(--mantine-color-teal-4))";

const NPC_ACCENT =
  "light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))";

function npcInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type EventDrawerLocationsSectionProps = {
  eventNodeId: string;
  locationIds: string[];
};

export function EventDrawerLocationsSection({
  eventNodeId,
  locationIds
}: EventDrawerLocationsSectionProps) {
  const { campaignId, locationOptions, createLocationInline, patchEventData } = usePlanner2ReactFlowPilot();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [creating, setCreating] = useState(false);

  const locationById = useMemo(() => new Map(locationOptions.map((l) => [l.id, l])), [locationOptions]);
  const taken = useMemo(() => new Set(locationIds), [locationIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locationOptions.filter((l) => {
      if (taken.has(l.id)) return false;
      if (!q) return true;
      return l.name.toLowerCase().includes(q);
    });
  }, [locationOptions, query, taken]);

  useEffect(() => {
    setHighlighted(0);
  }, [query, filtered.length]);

  const addLocationId = useCallback(
    (id: string) => {
      if (taken.has(id)) return;
      patchEventData(eventNodeId, { locationIds: [...locationIds, id] });
      setQuery("");
      setMenuOpen(false);
    },
    [eventNodeId, locationIds, patchEventData, taken]
  );

  const removeLocationId = useCallback(
    (id: string) => {
      const next = locationIds.filter((x) => x !== id);
      patchEventData(eventNodeId, { locationIds: next.length > 0 ? next : undefined });
    },
    [eventNodeId, locationIds, patchEventData]
  );

  const handleCreateLocation = useCallback(async () => {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    const opt = await createLocationInline(name);
    setCreating(false);
    if (opt) {
      addLocationId(opt.id);
    }
  }, [addLocationId, createLocationInline, creating, query]);

  const shellRef = useClickOutside(() => setMenuOpen(false));

  const showCreateOption = query.trim().length > 0;
  const totalItems = filtered.length + (showCreateOption ? 1 : 0);
  const createOptionIndex = filtered.length;

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (totalItems === 0) return;
        setHighlighted((h) => Math.min(h + 1, totalItems - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (totalItems === 0) return;
        setHighlighted((h) => Math.max(h - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (showCreateOption && highlighted === createOptionIndex) {
          void handleCreateLocation();
          return;
        }
        const pick = filtered[highlighted] ?? filtered[0];
        if (pick) addLocationId(pick.id);
        return;
      }
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    },
    [addLocationId, createOptionIndex, filtered, handleCreateLocation, highlighted, showCreateOption, totalItems]
  );

  const menuVisible = menuOpen && (filtered.length > 0 || showCreateOption);

  return (
    <Stack align="flex-start" gap="sm" w="100%">
      <EventDrawerSectionHeading icon={IconMapPin} iconColor={LOCATION_ACCENT}>
        Miejsca
      </EventDrawerSectionHeading>
      {locationIds.length > 0 ? (
        <Stack gap={6} w="100%">
          {locationIds.map((id) => {
            const row = locationById.get(id);
            const label = row?.name ?? `Lokacja (${id.slice(0, 8)}…)`;
            return (
              <Group gap="sm" justify="space-between" key={id} wrap="nowrap">
                <Text lineClamp={1} size="md" style={{ flex: 1, minWidth: 0 }}>
                  {label}
                </Text>
                <Group gap={2} wrap="nowrap">
                  <Tooltip label="Otwórz szczegóły" withArrow>
                    <ActionIcon
                      aria-label={`Otwórz szczegóły: ${label}`}
                      color="gray"
                      component="a"
                      href={`/campaign/${campaignId}/locations`}
                      rel="noopener noreferrer"
                      size="sm"
                      target="_blank"
                      variant="subtle"
                    >
                      <IconExternalLink size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <ActionIcon
                    aria-label={`Usuń ${label} z eventu`}
                    color="gray"
                    onClick={() => removeLocationId(id)}
                    size="sm"
                    variant="subtle"
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
            );
          })}
        </Stack>
      ) : null}

      <Box pos="relative" ref={shellRef} w="100%">
        <TextInput
          aria-autocomplete="list"
          aria-expanded={menuVisible}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setMenuOpen(true);
          }}
          onFocus={() => setMenuOpen(true)}
          onKeyDown={onInputKeyDown}
          placeholder="Dodaj lub stwórz miejsce…"
          size="md"
          styles={{ input: { border: "none", borderBottom: "1px solid light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))", borderRadius: 0, paddingLeft: 0, paddingRight: 0 } }}
          value={query}
          variant="unstyled"
        />
        {menuVisible ? (
          <Paper
            p={4}
            radius="sm"
            shadow="md"
            style={{
              left: 0,
              maxHeight: 220,
              overflow: "auto",
              position: "absolute",
              right: 0,
              top: "100%",
              zIndex: 400
            }}
            withBorder
          >
            <Stack gap={0}>
              {filtered.map((l, i) => (
                <UnstyledButton
                  key={l.id}
                  onClick={() => addLocationId(l.id)}
                  onMouseEnter={() => setHighlighted(i)}
                  p="xs"
                  style={{
                    backgroundColor:
                      i === highlighted
                        ? "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
                        : undefined,
                    borderRadius: "var(--mantine-radius-sm)"
                  }}
                  type="button"
                >
                  <Text lineClamp={1} size="md">
                    {l.name}
                  </Text>
                </UnstyledButton>
              ))}
              {showCreateOption ? (
                <UnstyledButton
                  disabled={creating}
                  onClick={() => void handleCreateLocation()}
                  onMouseEnter={() => setHighlighted(createOptionIndex)}
                  p="xs"
                  style={{
                    backgroundColor:
                      highlighted === createOptionIndex
                        ? "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
                        : undefined,
                    borderRadius: "var(--mantine-radius-sm)",
                    borderTop: filtered.length > 0 ? "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))" : undefined,
                    marginTop: filtered.length > 0 ? 4 : undefined
                  }}
                  type="button"
                >
                  <Group gap="xs" wrap="nowrap">
                    <IconPlus size={14} style={{ flexShrink: 0 }} />
                    <Text size="md">
                      Stwórz <Text component="span" fw={700}>{query.trim()}</Text>
                    </Text>
                  </Group>
                </UnstyledButton>
              ) : null}
            </Stack>
          </Paper>
        ) : null}
      </Box>
    </Stack>
  );
}

type EventDrawerCharactersSectionProps = {
  eventNodeId: string;
  /** Przyszłość: filtrowanie puli NPC do wątku — na razie ignorowane. */
  eventThreadId?: string;
  npcIds: string[];
};

/** NPC z kampanii (wyszukiwarka inline); później można zawęzić pulę do wątku. */
export function EventDrawerCharactersSection({
  eventNodeId,
  eventThreadId,
  npcIds
}: EventDrawerCharactersSectionProps) {
  const { campaignId, npcOptions, createNpcInline, patchEventData } = usePlanner2ReactFlowPilot();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [creating, setCreating] = useState(false);

  const pool = useMemo(() => {
    void eventThreadId;
    return npcOptions;
  }, [eventThreadId, npcOptions]);

  const npcById = useMemo(() => {
    const m = new Map(pool.map((n) => [n.id, n]));
    return m;
  }, [pool]);

  const taken = useMemo(() => new Set(npcIds), [npcIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((n) => {
      if (taken.has(n.id)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return n.name.toLowerCase().includes(q);
    });
  }, [pool, query, taken]);

  useEffect(() => {
    setHighlighted(0);
  }, [query, filtered.length]);

  const addNpcId = useCallback(
    (id: string) => {
      if (taken.has(id)) {
        return;
      }
      const next = [...npcIds, id];
      patchEventData(eventNodeId, { npcIds: next });
      setQuery("");
      setMenuOpen(false);
    },
    [eventNodeId, npcIds, patchEventData, taken]
  );

  const removeNpcId = useCallback(
    (id: string) => {
      const next = npcIds.filter((x) => x !== id);
      patchEventData(eventNodeId, { npcIds: next.length > 0 ? next : undefined });
    },
    [eventNodeId, npcIds, patchEventData]
  );

  const handleCreateNpc = useCallback(async () => {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    const opt = await createNpcInline(name);
    setCreating(false);
    if (opt) {
      addNpcId(opt.id);
    }
  }, [addNpcId, createNpcInline, creating, query]);

  const shellRef = useClickOutside(() => setMenuOpen(false));

  const showCreateOption = query.trim().length > 0;
  const totalItems = filtered.length + (showCreateOption ? 1 : 0);
  const createOptionIndex = filtered.length;

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (totalItems === 0) return;
        setHighlighted((h) => Math.min(h + 1, totalItems - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (totalItems === 0) return;
        setHighlighted((h) => Math.max(h - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (showCreateOption && highlighted === createOptionIndex) {
          void handleCreateNpc();
          return;
        }
        const pick = filtered[highlighted] ?? filtered[0];
        if (pick) {
          addNpcId(pick.id);
        }
        return;
      }
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    },
    [addNpcId, createOptionIndex, filtered, handleCreateNpc, highlighted, showCreateOption, totalItems]
  );

  const menuVisible = menuOpen && (filtered.length > 0 || showCreateOption);

  return (
    <Stack align="flex-start" gap="sm" w="100%">
      <EventDrawerSectionHeading icon={IconMask} iconColor={NPC_ACCENT}>
        NPC
      </EventDrawerSectionHeading>
      {npcIds.length > 0 ? (
        <Stack gap={6} w="100%">
          {npcIds.map((id) => {
            const row = npcById.get(id);
            const label = row?.name ?? `NPC (${id.slice(0, 8)}…)`;
            return (
              <Group gap="sm" justify="space-between" key={id} wrap="nowrap">
                <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  {row?.portrait_url ? (
                    <Image
                      alt=""
                      fit="cover"
                      h={32}
                      radius="xl"
                      src={row.portrait_url}
                      style={{ flexShrink: 0 }}
                      w={32}
                    />
                  ) : (
                    <Avatar color="gray" radius="xl" size="sm">
                      {row ? npcInitials(row.name) : "?"}
                    </Avatar>
                  )}
                  <Text lineClamp={1} size="md" style={{ flex: 1, minWidth: 0 }}>
                    {label}
                  </Text>
                </Group>
                <Group gap={2} wrap="nowrap">
                  <Tooltip label="Otwórz szczegóły" withArrow>
                    <ActionIcon
                      aria-label={`Otwórz szczegóły: ${label}`}
                      color="gray"
                      component="a"
                      href={`/campaign/${campaignId}/npcs`}
                      rel="noopener noreferrer"
                      size="sm"
                      target="_blank"
                      variant="subtle"
                    >
                      <IconExternalLink size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <ActionIcon
                    aria-label={`Usuń ${label} z eventu`}
                    color="gray"
                    onClick={() => removeNpcId(id)}
                    size="sm"
                    variant="subtle"
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
            );
          })}
        </Stack>
      ) : null}

      <Box pos="relative" ref={shellRef} w="100%">
        <TextInput
          aria-autocomplete="list"
          aria-expanded={menuVisible}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setMenuOpen(true);
          }}
          onFocus={() => setMenuOpen(true)}
          onKeyDown={onInputKeyDown}
          placeholder="Dodaj lub stwórz NPC…"
          size="md"
          styles={{ input: { border: "none", borderBottom: "1px solid light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))", borderRadius: 0, paddingLeft: 0, paddingRight: 0 } }}
          value={query}
          variant="unstyled"
        />
        {menuVisible ? (
          <Paper
            p={4}
            radius="sm"
            shadow="md"
            style={{
              left: 0,
              maxHeight: 220,
              overflow: "auto",
              position: "absolute",
              right: 0,
              top: "100%",
              zIndex: 400
            }}
            withBorder
          >
            <Stack gap={0}>
              {filtered.map((n, i) => (
                <UnstyledButton
                  key={n.id}
                  onClick={() => addNpcId(n.id)}
                  onMouseEnter={() => setHighlighted(i)}
                  p="xs"
                  style={{
                    backgroundColor:
                      i === highlighted
                        ? "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
                        : undefined,
                    borderRadius: "var(--mantine-radius-sm)"
                  }}
                  type="button"
                >
                  <Group gap="sm" wrap="nowrap">
                    {n.portrait_url ? (
                      <Image alt="" fit="cover" h={28} radius="xl" src={n.portrait_url} w={28} />
                    ) : (
                      <Avatar color="gray" radius="xl" size="sm">
                        {npcInitials(n.name)}
                      </Avatar>
                    )}
                    <Text lineClamp={1} size="md" style={{ flex: 1 }}>
                      {n.name}
                    </Text>
                  </Group>
                </UnstyledButton>
              ))}
              {showCreateOption ? (
                <UnstyledButton
                  disabled={creating}
                  onClick={() => void handleCreateNpc()}
                  onMouseEnter={() => setHighlighted(createOptionIndex)}
                  p="xs"
                  style={{
                    backgroundColor:
                      highlighted === createOptionIndex
                        ? "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
                        : undefined,
                    borderRadius: "var(--mantine-radius-sm)",
                    borderTop: filtered.length > 0 ? "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))" : undefined,
                    marginTop: filtered.length > 0 ? 4 : undefined
                  }}
                  type="button"
                >
                  <Group gap="xs" wrap="nowrap">
                    <IconPlus size={14} style={{ flexShrink: 0 }} />
                    <Text size="md">
                      Stwórz <Text component="span" fw={700}>{query.trim()}</Text>
                    </Text>
                  </Group>
                </UnstyledButton>
              ) : null}
            </Stack>
          </Paper>
        ) : null}
      </Box>
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
      entityRef={{ type: 'event' as const, id: eventNodeId }}
    />
  );
}

type Planner2EventDrawerSideSectionsProps = {
  campaignCharacters: PlannerCharacterOption[];
  dlaczego: string;
  eventNodeId: string;
  eventThreadId?: string;
  locationIds: string[];
  npcIds: string[];
  onDlaczegoChange: (value: string) => void;
};

export function Planner2EventDrawerSideSections({
  campaignCharacters,
  dlaczego,
  eventNodeId,
  eventThreadId,
  locationIds,
  npcIds,
  onDlaczegoChange
}: Planner2EventDrawerSideSectionsProps) {
  return (
    <Stack align="flex-start" style={{ gap: "2.5rem" }} w="100%">
      <EventDrawerDlaczegoSection onChange={onDlaczegoChange} value={dlaczego} />
      <Divider w="100%" />
      <EventDrawerLocationsSection eventNodeId={eventNodeId} locationIds={locationIds} />
      <Divider w="100%" />
      <EventDrawerMultiValueSection title="Rekwizyty" variant="items" />
      <Divider w="100%" />
      <EventDrawerCharactersSection
        eventNodeId={eventNodeId}
        eventThreadId={eventThreadId}
        npcIds={npcIds}
      />
      <Divider w="100%" />
      <EventDrawerPlayerInfosSection campaignCharacters={campaignCharacters} eventNodeId={eventNodeId} />
    </Stack>
  );
}
