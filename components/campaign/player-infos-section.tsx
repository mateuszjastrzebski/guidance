"use client";

import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Stack,
  Text,
  Textarea,
  Tooltip,
  UnstyledButton
} from "@mantine/core";
import { IconCheck, IconEyeOff, IconMessages, IconUsers } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  createPlayerInfo,
  deletePlayerInfo,
  listPlayerInfosForEntity,
  revokeInfoFromCharacters,
  revealInfoToCharacters,
  updatePlayerInfoContent,
  type EntityRef,
  type PlayerInfoWithReveals
} from "@/app/(app)/campaign/[id]/board/player-infos-actions";

export type { EntityRef };

export type CharacterOption = {
  id: string;
  name: string;
};

const ACCENT = "light-dark(var(--mantine-color-violet-6), var(--mantine-color-violet-4))";
const AVATAR_COLORS = ["violet", "cyan", "grape", "teal", "indigo"] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type Row = {
  id: string;
  body: string;
  disclosedCharacterIds: string[];
  selectedCharacterIds: string[];
  revokeSelectionIds: string[];
  persisted: boolean;
};

function rowFromDb(info: PlayerInfoWithReveals): Row {
  return {
    id: info.id,
    body: info.content,
    disclosedCharacterIds: info.revealedCharacterIds,
    selectedCharacterIds: [],
    revokeSelectionIds: [],
    persisted: true
  };
}

type PlayerInfosSectionProps = {
  campaignId: string;
  campaignCharacters: CharacterOption[];
  entityRef: EntityRef;
};

export function PlayerInfosSection({
  campaignId,
  campaignCharacters,
  entityRef
}: PlayerInfosSectionProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);

  // Debounce timers per row id
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Stable ref to entityRef so addRow doesn't need it as dep
  const entityRefRef = useRef(entityRef);
  entityRefRef.current = entityRef;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listPlayerInfosForEntity(campaignId, entityRef).then((result) => {
      if (cancelled) return;
      if (result.ok) setRows(result.infos.map(rowFromDb));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // entityRef is an object — stringify to detect changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, entityRef.type, entityRef.id]);

  const addRow = useCallback(async () => {
    setAddError(null);
    const result = await createPlayerInfo(campaignId, entityRefRef.current);
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    setRows((prev) => [...prev, rowFromDb(result.info)]);
  }, [campaignId]);

  const patchBody = useCallback(
    (rowId: string, body: string) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, body } : r))
      );
      clearTimeout(debounceTimers.current[rowId]);
      debounceTimers.current[rowId] = setTimeout(() => {
        updatePlayerInfoContent(rowId, body);
      }, 500);
    },
    []
  );

  const removeRow = useCallback((rowId: string) => {
    clearTimeout(debounceTimers.current[rowId]);
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    deletePlayerInfo(rowId);
  }, []);

  const toggleSelectedCharacter = useCallback((rowId: string, characterId: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId || row.disclosedCharacterIds.includes(characterId)) return row;
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
        if (row.id !== rowId || !row.disclosedCharacterIds.includes(characterId)) return row;
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

  const selectAllInRow = useCallback(
    (rowId: string) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          const inCampaign = (id: string) => campaignCharacters.some((c) => c.id === id);
          if (row.revokeSelectionIds.length > 0) {
            const disclosed = row.disclosedCharacterIds.filter(inCampaign);
            const allPicked =
              disclosed.length > 0 && disclosed.every((id) => row.revokeSelectionIds.includes(id));
            return { ...row, revokeSelectionIds: allPicked ? [] : [...disclosed], selectedCharacterIds: [] };
          }
          const undisclosed = campaignCharacters
            .filter((c) => !row.disclosedCharacterIds.includes(c.id))
            .map((c) => c.id);
          if (undisclosed.length > 0) {
            const allPicked = undisclosed.every((id) => row.selectedCharacterIds.includes(id));
            return { ...row, revokeSelectionIds: [], selectedCharacterIds: allPicked ? [] : [...undisclosed] };
          }
          const disclosed = row.disclosedCharacterIds.filter(inCampaign);
          const allRevokePicked = disclosed.length > 0 && disclosed.every((id) => row.revokeSelectionIds.includes(id));
          return { ...row, revokeSelectionIds: allRevokePicked ? [] : [...disclosed], selectedCharacterIds: [] };
        })
      );
    },
    [campaignCharacters]
  );

  const commitDisclosure = useCallback(async (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row || row.selectedCharacterIds.length === 0) return;
    const toReveal = row.selectedCharacterIds;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          disclosedCharacterIds: [...new Set([...r.disclosedCharacterIds, ...toReveal])],
          selectedCharacterIds: [],
          revokeSelectionIds: []
        };
      })
    );
    await revealInfoToCharacters(rowId, toReveal);
  }, [rows]);

  const commitRevoke = useCallback(async (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row || row.revokeSelectionIds.length === 0) return;
    const toRevoke = row.revokeSelectionIds;
    const drop = new Set(toRevoke);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          disclosedCharacterIds: r.disclosedCharacterIds.filter((id) => !drop.has(id)),
          revokeSelectionIds: []
        };
      })
    );
    await revokeInfoFromCharacters(rowId, toRevoke);
  }, [rows]);

  if (loading) {
    return (
      <Stack align="flex-start" gap="sm">
        <SectionHeading>Informacje dla graczy</SectionHeading>
        <Text c="dimmed" size="md">Ładowanie…</Text>
      </Stack>
    );
  }

  return (
    <Stack align="flex-start" gap="sm">
      <SectionHeading>Informacje dla graczy</SectionHeading>
      {rows.length > 0 && (
        <Stack gap="sm" w="100%">
          {rows.map((row) => (
            <PlayerInfoCard
              key={row.id}
              campaignCharacters={campaignCharacters}
              onBodyChange={(body) => patchBody(row.id, body)}
              onCommitDisclose={() => commitDisclosure(row.id)}
              onCommitRevoke={() => commitRevoke(row.id)}
              onRemove={() => removeRow(row.id)}
              onSelectAll={() => selectAllInRow(row.id)}
              onToggleCharacter={(cId) => toggleSelectedCharacter(row.id, cId)}
              onToggleRevokeCharacter={(cId) => toggleRevokeSelection(row.id, cId)}
              row={row}
            />
          ))}
        </Stack>
      )}
      {addError ? (
        <Text c="red" size="sm">{addError}</Text>
      ) : null}
      <Button
        aria-label="Dodaj informację dla graczy"
        color="violet"
        onClick={addRow}
        size="md"
        variant="outline"
      >
        Dodaj informację
      </Button>
    </Stack>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Group align="center" gap="sm" wrap="nowrap" w="100%">
      <IconMessages aria-hidden size={20} stroke={1.5} style={{ color: ACCENT, flexShrink: 0 }} />
      <Text fw={600} size="md" style={{ color: "light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-0))" }}>
        Informacje dla graczy
      </Text>
    </Group>
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
  campaignCharacters: CharacterOption[];
  onBodyChange: (body: string) => void;
  onCommitDisclose: () => void;
  onCommitRevoke: () => void;
  onRemove: () => void;
  onSelectAll: () => void;
  onToggleCharacter: (characterId: string) => void;
  onToggleRevokeCharacter: (characterId: string) => void;
  row: Row;
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
        : 'Zaznacz lub odznacz wszystkie ujawnione postacie (do „Ukryj")'
      : undisclosedIds.length > 0
        ? "Zaznacz lub odznacz wszystkie postacie jeszcze bez ujawnienia"
        : 'Wszystkie mają ujawnienie — zaznacz lub odznacz wszystkich do cofnięcia („Ukryj")';

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
          <IconEyeOff size={14} />
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
                color="violet"
                disabled={selectAllDisabled}
                onClick={onSelectAll}
                size="md"
                variant="outline"
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

          const avatarEl = (
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
                      ? { boxShadow: "0 0 0 1px light-dark(var(--mantine-color-teal-3), var(--mantine-color-teal-8))" }
                      : {}),
                    ...(disclosed && revokeSelected
                      ? { boxShadow: "0 0 0 1px light-dark(var(--mantine-color-red-4), var(--mantine-color-red-7))" }
                      : {})
                  }
                }}
              >
                {initials(c.name)}
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
              label={`${c.name} — kliknij, aby ${revokeSelected ? "odznaczyć" : "wybrać"} do cofnięcia ujawnienia („Ukryj")`}
              withArrow
            >
              <UnstyledButton
                aria-label={`${revokeSelected ? "Odznacz" : "Wybierz"} postać ${c.name} do ukrycia informacji`}
                aria-pressed={revokeSelected}
                onClick={() => onToggleRevokeCharacter(c.id)}
                style={{ borderRadius: "var(--mantine-radius-xl)", lineHeight: 0, padding: 0 }}
                type="button"
              >
                {avatarEl}
              </UnstyledButton>
            </Tooltip>
          ) : (
            <Tooltip
              key={c.id}
              label={`${c.name} — kliknij, aby ${selected ? "odznaczyć" : "wybrać"} przed „Ujawnij"`}
              withArrow
            >
              <UnstyledButton
                aria-label={`${selected ? "Odznacz" : "Wybierz"} postać ${c.name} do ujawnienia`}
                aria-pressed={selected}
                onClick={() => onToggleCharacter(c.id)}
                style={{ borderRadius: "var(--mantine-radius-xl)", lineHeight: 0, padding: 0 }}
                type="button"
              >
                {avatarEl}
              </UnstyledButton>
            </Tooltip>
          );
        })}
      </Group>
      {canRevoke ? (
        <Button
          aria-label="Cofnij ujawnienie informacji wybranym postaciom"
          color="red"
          leftSection={<IconEyeOff size={16} />}
          onClick={onCommitRevoke}
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
          onClick={onCommitDisclose}
          size="md"
          variant="outline"
        >
          Ujawnij
        </Button>
      )}
    </Stack>
  );
}
