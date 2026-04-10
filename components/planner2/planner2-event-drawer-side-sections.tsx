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
import { showNotification } from "@mantine/notifications";

import {
  usePlanner2ReactFlowPilot,
  type PlannerCharacterOption
} from "@/components/planner2/planner2-react-flow-pilot-context";
import {
  IconHelp,
  IconMapPin,
  IconMask,
  IconMessages,
  IconNotes,
  IconCheck,
  IconEyeOff,
  IconPackage,
  IconTrash,
  IconUsers
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";

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

const NPC_ACCENT =
  "light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))";
const PLAYER_INFO_ACCENT =
  "light-dark(var(--mantine-color-violet-6), var(--mantine-color-violet-4))";

function npcInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
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
  const { npcOptions, patchEventData } = usePlanner2ReactFlowPilot();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

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

  const shellRef = useClickOutside(() => setMenuOpen(false));

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (filtered.length === 0) {
          return;
        }
        setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (filtered.length === 0) {
          return;
        }
        setHighlighted((h) => Math.max(h - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
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
    [addNpcId, filtered, highlighted]
  );

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
            );
          })}
        </Stack>
      ) : null}

      {pool.length === 0 ? (
        <Text c="dimmed" size="md">
          Brak NPC w kampanii — dodaj postacie w zakładce NPC.
        </Text>
      ) : (
        <Box pos="relative" ref={shellRef} w="100%">
          <TextInput
            aria-autocomplete="list"
            aria-expanded={menuOpen && filtered.length > 0}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setMenuOpen(true);
            }}
            onFocus={() => setMenuOpen(true)}
            onKeyDown={onInputKeyDown}
            placeholder={
              pool.every((n) => taken.has(n.id))
                ? "Wszyscy NPC z kampanii są już na liście"
                : "Dodaj NPC…"
            }
            readOnly={pool.every((n) => taken.has(n.id))}
            size="md"
            styles={{ input: { border: "none", borderBottom: "1px solid light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))", borderRadius: 0, paddingLeft: 0, paddingRight: 0 } }}
            value={query}
            variant="unstyled"
          />
          {menuOpen && filtered.length > 0 ? (
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
              </Stack>
            </Paper>
          ) : null}
        </Box>
      )}
    </Stack>
  );
}

const AVATAR_COLORS = ["violet", "cyan", "grape", "teal", "indigo"] as const;

type PlayerInfoRow = {
  body: string;
  disclosedCharacterIds: string[];
  id: string;
  /** Zaznaczone ujawnione postacie — czerwony „Ukryj” cofa im ujawnienie. */
  revokeSelectionIds: string[];
  /** Wybrane przed kliknięciem „Ujawnij”; po wysłaniu znika i trafia do disclosed. */
  selectedCharacterIds: string[];
};

type EventDrawerPlayerInfosSectionProps = {
  campaignCharacters: PlannerCharacterOption[];
};

export function EventDrawerPlayerInfosSection({ campaignCharacters }: EventDrawerPlayerInfosSectionProps) {
  const [rows, setRows] = useState<PlayerInfoRow[]>([]);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        body: "",
        disclosedCharacterIds: [],
        revokeSelectionIds: [],
        selectedCharacterIds: []
      }
    ]);
  }, []);

  const patchRow = useCallback(
    (rowId: string, patch: Partial<Pick<PlayerInfoRow, "body">>) => {
      setRows((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
      );
    },
    []
  );

  const toggleSelectedCharacter = useCallback((rowId: string, characterId: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) {
          return row;
        }
        if (row.disclosedCharacterIds.includes(characterId)) {
          return row;
        }
        const has = row.selectedCharacterIds.includes(characterId);
        return {
          ...row,
          revokeSelectionIds: [],
          selectedCharacterIds: has
            ? row.selectedCharacterIds.filter((c) => c !== characterId)
            : [...row.selectedCharacterIds, characterId]
        };
      })
    );
  }, []);

  const toggleRevokeSelection = useCallback((rowId: string, characterId: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) {
          return row;
        }
        if (!row.disclosedCharacterIds.includes(characterId)) {
          return row;
        }
        const has = row.revokeSelectionIds.includes(characterId);
        return {
          ...row,
          revokeSelectionIds: has
            ? row.revokeSelectionIds.filter((c) => c !== characterId)
            : [...row.revokeSelectionIds, characterId],
          selectedCharacterIds: []
        };
      })
    );
  }, []);

  const commitRevoke = useCallback((rowId: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId || row.revokeSelectionIds.length === 0) {
          return row;
        }
        const drop = new Set(row.revokeSelectionIds);
        return {
          ...row,
          disclosedCharacterIds: row.disclosedCharacterIds.filter((id) => !drop.has(id)),
          revokeSelectionIds: []
        };
      })
    );
  }, []);

  const commitDisclosure = useCallback((rowId: string) => {
    let didCommit = false;
    setRows((prev) => {
      const row = prev.find((r) => r.id === rowId);
      if (!row || row.selectedCharacterIds.length === 0) {
        return prev;
      }
      didCommit = true;
      return prev.map((r) => {
        if (r.id !== rowId) {
          return r;
        }
        const nextDisclosed = [...new Set([...r.disclosedCharacterIds, ...r.selectedCharacterIds])];
        return {
          ...r,
          disclosedCharacterIds: nextDisclosed,
          revokeSelectionIds: [],
          selectedCharacterIds: []
        };
      });
    });
    if (didCommit) {
      showNotification({
        autoClose: 6000,
        color: "teal",
        message: (
          <Stack gap={6}>
            <Text size="md">Informacja została wysłana (symulacja).</Text>
            <Text c="dimmed" size="md">
              To tylko placeholder toasta — trzeba dorobić prawdziwe wysyłanie do graczy.
            </Text>
          </Stack>
        ),
        title: "Informacje wysłane"
      });
    }
  }, []);

  const removeRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  }, []);

  const selectAllInRow = useCallback(
    (rowId: string) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) {
            return row;
          }
          const inCampaign = (id: string) => campaignCharacters.some((c) => c.id === id);
          if (row.revokeSelectionIds.length > 0) {
            const disclosed = row.disclosedCharacterIds.filter(inCampaign);
            const allPicked =
              disclosed.length > 0 && disclosed.every((id) => row.revokeSelectionIds.includes(id));
            return {
              ...row,
              revokeSelectionIds: allPicked ? [] : [...disclosed],
              selectedCharacterIds: []
            };
          }
          const undisclosed = campaignCharacters
            .filter((c) => !row.disclosedCharacterIds.includes(c.id))
            .map((c) => c.id);
          if (undisclosed.length > 0) {
            const allPicked =
              undisclosed.length > 0 && undisclosed.every((id) => row.selectedCharacterIds.includes(id));
            return {
              ...row,
              revokeSelectionIds: [],
              selectedCharacterIds: allPicked ? [] : [...undisclosed]
            };
          }
          const disclosed = row.disclosedCharacterIds.filter(inCampaign);
          const allRevokePicked =
            disclosed.length > 0 && disclosed.every((id) => row.revokeSelectionIds.includes(id));
          return {
            ...row,
            revokeSelectionIds: allRevokePicked ? [] : [...disclosed],
            selectedCharacterIds: []
          };
        })
      );
    },
    [campaignCharacters]
  );

  return (
    <Stack align="flex-start" gap="sm">
      <EventDrawerSectionHeading icon={IconMessages} iconColor={PLAYER_INFO_ACCENT}>
        Informacje dla graczy
      </EventDrawerSectionHeading>
      {rows.length > 0 ? (
        <Stack gap="sm" w="100%">
          {rows.map((row) => (
            <PlayerInfoCard
              key={row.id}
              campaignCharacters={campaignCharacters}
              onBodyChange={(body) => patchRow(row.id, { body })}
              onCommitDisclose={() => commitDisclosure(row.id)}
              onCommitRevoke={() => commitRevoke(row.id)}
              onRemove={() => removeRow(row.id)}
              onToggleCharacter={(characterId) => toggleSelectedCharacter(row.id, characterId)}
              onSelectAll={() => selectAllInRow(row.id)}
              onToggleRevokeCharacter={(characterId) => toggleRevokeSelection(row.id, characterId)}
              row={row}
            />
          ))}
        </Stack>
      ) : null}
      <Button aria-label="Dodaj informację dla graczy" onClick={addRow} {...drawerPrimaryOutlineButtonProps}>
        Dodaj informację
      </Button>
    </Stack>
  );
}

function PlayerInfoCard({
  campaignCharacters,
  onBodyChange,
  onCommitDisclose,
  onCommitRevoke,
  onRemove,
  onSelectAll,
  onToggleCharacter,
  onToggleRevokeCharacter,
  row
}: {
  campaignCharacters: PlannerCharacterOption[];
  onBodyChange: (body: string) => void;
  onCommitDisclose: () => void;
  onCommitRevoke: () => void;
  onRemove: () => void;
  onSelectAll: () => void;
  onToggleCharacter: (characterId: string) => void;
  onToggleRevokeCharacter: (characterId: string) => void;
  row: PlayerInfoRow;
}) {
  const hasPendingSelection = row.selectedCharacterIds.length > 0;
  const hasRevokeSelection = row.revokeSelectionIds.length > 0;
  const hasCharacters = campaignCharacters.length > 0;
  const canDisclose = hasPendingSelection && hasCharacters && !hasRevokeSelection;
  const canRevoke = hasRevokeSelection && hasCharacters;

  const undisclosedIds = campaignCharacters
    .filter((c) => !row.disclosedCharacterIds.includes(c.id))
    .map((c) => c.id);
  const disclosedInCampaign = row.disclosedCharacterIds.filter((id) =>
    campaignCharacters.some((c) => c.id === id)
  );
  const selectAllDisabled =
    !hasCharacters ||
    (hasRevokeSelection
      ? disclosedInCampaign.length === 0
      : undisclosedIds.length === 0 && disclosedInCampaign.length === 0);
  const selectAllTooltip = !hasCharacters
    ? ""
    : hasRevokeSelection
      ? disclosedInCampaign.length === 0
        ? "Brak ujawnionych postaci"
        : "Zaznacz lub odznacz wszystkie ujawnione postacie (do „Ukryj”)"
      : undisclosedIds.length > 0
        ? "Zaznacz lub odznacz wszystkie postacie jeszcze bez ujawnienia"
        : "Wszystkie mają ujawnienie — zaznacz lub odznacz wszystkich do cofnięcia („Ukryj”)";

  return (
    <Stack align="flex-start" gap="sm">
      <Group align="flex-start" gap="xs" wrap="nowrap" w="100%">
        <Textarea
          autosize
          flex={1}
          maxRows={12}
          miw={0}
          minRows={3}
          onChange={(e) => onBodyChange(e.currentTarget.value)}
          placeholder="Treść informacji dla wybranych postaci…"
          resize="none"
          size="md"
          styles={{ root: { flex: 1, minWidth: 0 } }}
          value={row.body}
        />
        <ActionIcon
          aria-label="Usuń tę informację"
          color="gray"
          mt={4}
          onClick={onRemove}
          size="sm"
          style={{ flexShrink: 0 }}
          variant="subtle"
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
      <Group align="center" gap="md" justify="flex-start" wrap="wrap" w="100%">
        {!hasCharacters ? (
          <Text c="dimmed" size="md">
            Brak postaci w kampanii — dodaj postacie, żeby móc wybierać ujawnienia.
          </Text>
        ) : (
          <Tooltip label={selectAllTooltip} withArrow>
            <Box component="span" display="inline-block">
              <Button
                aria-label={selectAllTooltip}
                disabled={selectAllDisabled}
                onClick={onSelectAll}
                {...drawerPrimaryOutlineButtonProps}
              >
                Wszyscy
              </Button>
            </Box>
          </Tooltip>
        )}
        {campaignCharacters.map((c, i) => {
          const disclosed = row.disclosedCharacterIds.includes(c.id);
          const selected = row.selectedCharacterIds.includes(c.id);
          const revokeSelected = row.revokeSelectionIds.includes(c.id);
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

          const avatarWithOverlay = (
            <Box style={{ display: "inline-block", lineHeight: 0, position: "relative" }}>
              <Avatar
                color={color}
                radius="xl"
                size="sm"
                styles={{
                  root: {
                    cursor: "pointer",
                    opacity: disclosed ? (revokeSelected ? 0.92 : 0.42) : 1,
                    outline: disclosed
                      ? revokeSelected
                        ? "2px solid light-dark(var(--mantine-color-red-6), var(--mantine-color-red-4))"
                        : "2px solid light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-3))"
                      : selected
                        ? "2px solid light-dark(var(--mantine-color-teal-6), var(--mantine-color-teal-4))"
                        : "2px solid transparent",
                    outlineOffset: 2,
                    transition: "opacity 120ms ease, outline-color 120ms ease, box-shadow 120ms ease, transform 100ms ease",
                    ...(selected && !disclosed
                      ? {
                          boxShadow:
                            "0 0 0 1px light-dark(var(--mantine-color-teal-3), var(--mantine-color-teal-8))"
                        }
                      : {}),
                    ...(disclosed && revokeSelected
                      ? {
                          boxShadow:
                            "0 0 0 1px light-dark(var(--mantine-color-red-4), var(--mantine-color-red-7))"
                        }
                      : {}),
                    "&:hover": {
                      transform: "scale(1.06)"
                    }
                  }
                }}
              >
                {npcInitials(c.name)}
              </Avatar>
              {disclosed && !revokeSelected ? (
                <Box
                  aria-hidden
                  style={{
                    alignItems: "center",
                    backgroundColor: "light-dark(var(--mantine-color-teal-6), var(--mantine-color-teal-5))",
                    border: "2px solid var(--mantine-color-body)",
                    borderRadius: 3,
                    bottom: -2,
                    boxSizing: "border-box",
                    display: "flex",
                    height: 16,
                    justifyContent: "center",
                    position: "absolute",
                    right: -2,
                    width: 16
                  }}
                >
                  <IconCheck color="var(--mantine-color-white)" size={10} stroke={3} />
                </Box>
              ) : null}
            </Box>
          );

          return disclosed ? (
            <Tooltip
              key={c.id}
              label={`${c.name} — kliknij, aby ${revokeSelected ? "odznaczyć" : "wybrać"} do cofnięcia ujawnienia („Ukryj”)`}
              withArrow
            >
              <UnstyledButton
                aria-label={`${revokeSelected ? "Odznacz" : "Wybierz"} postać ${c.name} do ukrycia informacji`}
                aria-pressed={revokeSelected}
                onClick={() => onToggleRevokeCharacter(c.id)}
                style={{
                  borderRadius: "var(--mantine-radius-xl)",
                  lineHeight: 0,
                  padding: 0
                }}
                type="button"
              >
                {avatarWithOverlay}
              </UnstyledButton>
            </Tooltip>
          ) : (
            <Tooltip
              key={c.id}
              label={`${c.name} — kliknij, aby ${selected ? "odznaczyć" : "wybrać"} przed „Ujawnij”`}
              withArrow
            >
              <UnstyledButton
                aria-label={`${selected ? "Odznacz" : "Wybierz"} postać ${c.name} do ujawnienia`}
                aria-pressed={selected}
                onClick={() => onToggleCharacter(c.id)}
                style={{
                  borderRadius: "var(--mantine-radius-xl)",
                  lineHeight: 0,
                  padding: 0
                }}
                type="button"
              >
                {avatarWithOverlay}
              </UnstyledButton>
            </Tooltip>
          );
        })}
      </Group>
      {canRevoke ? (
        <Button
          aria-label="Cofnij ujawnienie informacji wybranym postaciom"
          color="red"
          disabled={!hasCharacters}
          leftSection={<IconEyeOff size={16} />}
          onClick={() => {
            if (!canRevoke) {
              return;
            }
            onCommitRevoke();
          }}
          size="md"
          variant="outline"
        >
          Ukryj
        </Button>
      ) : (
        <Button
          aria-label={
            !hasCharacters
              ? "Brak postaci w kampanii"
              : canDisclose
                ? "Ujawnij informację wybranym postaciom"
                : "Wybierz co najmniej jedną postać, której jeszcze nie ujawniono"
          }
          color={canDisclose ? "violet" : "gray"}
          disabled={!canDisclose || !hasCharacters}
          leftSection={<IconUsers size={16} />}
          onClick={() => {
            if (!canDisclose) {
              return;
            }
            onCommitDisclose();
          }}
          size="md"
          variant="outline"
        >
          Ujawnij
        </Button>
      )}
    </Stack>
  );
}

type Planner2EventDrawerSideSectionsProps = {
  campaignCharacters: PlannerCharacterOption[];
  dlaczego: string;
  eventNodeId: string;
  eventThreadId?: string;
  npcIds: string[];
  onDlaczegoChange: (value: string) => void;
};

export function Planner2EventDrawerSideSections({
  campaignCharacters,
  dlaczego,
  eventNodeId,
  eventThreadId,
  npcIds,
  onDlaczegoChange
}: Planner2EventDrawerSideSectionsProps) {
  return (
    <Stack align="flex-start" style={{ gap: "2.5rem" }} w="100%">
      <EventDrawerDlaczegoSection onChange={onDlaczegoChange} value={dlaczego} />
      <Divider w="100%" />
      <EventDrawerMultiValueSection title="Miejsca" variant="places" />
      <Divider w="100%" />
      <EventDrawerMultiValueSection title="Rekwizyty" variant="items" />
      <Divider w="100%" />
      <EventDrawerCharactersSection
        eventNodeId={eventNodeId}
        eventThreadId={eventThreadId}
        npcIds={npcIds}
      />
      <Divider w="100%" />
      <EventDrawerPlayerInfosSection campaignCharacters={campaignCharacters} />
    </Stack>
  );
}
