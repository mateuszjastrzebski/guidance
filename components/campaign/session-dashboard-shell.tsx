"use client";

import {
  createSessionCapture,
  updateSessionCaptureTitle
} from "@/app/(app)/campaign/[id]/session-dashboard/actions";
import {
  addSceneToSession,
  createScene,
  removeSceneFromSession
} from "@/app/(app)/campaign/[id]/scenes/actions";
import { useTopBar } from "@/components/app-shell/top-bar-context";
import { EditableEntityTitle } from "@/components/campaign/editable-entity-title";
import { SceneEditor } from "@/components/campaign/scene-editor";
import { showNotification } from "@mantine/notifications";
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  Group,
  NavLink,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  ThemeIcon
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCompass,
  IconMapPin,
  IconPlus,
  IconRouteAltLeft,
  IconSparkles,
  IconSwords,
  IconTrash,
  IconUsersGroup
} from "@tabler/icons-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { MOCK_SESSION_RSVP_PLAYERS } from "@/lib/mocks/demo-campaign-roster";
import type { SceneRecord, SceneReferenceBundle } from "@/lib/scenes";

type SessionListItem = {
  label: string;
  number: number;
  subtitle: string;
};

type SessionMode = "combat" | "exploration";

type CatalogCharacter = { id: string; name: string };
type CatalogQuest = { id: string; key_character_ids: string[]; key_npc_ids: string[]; name: string };
type CatalogWorldEntry = { id: string; name: string; templateKey: string };

type SessionDashboardShellProps = {
  campaignId: string;
  characters: CatalogCharacter[];
  initialMode: SessionMode;
  initialSessionNumber: number | null;
  plannerEvents: Array<{ id: string; label: string }>;
  quests: CatalogQuest[];
  scenes: SceneRecord[];
  sessions: SessionListItem[];
  worldEntries: CatalogWorldEntry[];
};

type DashboardTile = {
  description: string;
  eyebrow: string;
  icon: typeof IconCompass;
  title: string;
};

const SESSION_LIST_EXPANDED_WIDTH = 300;
const SESSION_LIST_COLLAPSED_WIDTH = 60;
const DEFAULT_SESSION_DATETIME = "2026-04-12T19:00";
const AVATAR_COLORS = ["cyan", "violet", "grape", "teal", "indigo", "orange"] as const;

type SessionPlanningState = {
  playerIds: string[];
  scheduledAt: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const dashboardTilesByMode: Record<SessionMode, DashboardTile[]> = {
  combat: [
    {
      title: "Inicjatywa",
      eyebrow: "Walka",
      description: "Miejsce na kolejkę tur, priorytety i szybkie przełączanie aktywnej postaci.",
      icon: IconSwords
    },
    {
      title: "Pozycje i zagrożenia",
      eyebrow: "Taktyka",
      description: "Kafelek pod strefy starcia, dystans, osłony i istotne statusy na polu walki.",
      icon: IconMapPin
    },
    {
      title: "Przeciwnicy",
      eyebrow: "Spotkanie",
      description: "Panel pod grupy wrogów, fazy bossa i notatki MG wykorzystywane tylko w walce.",
      icon: IconUsersGroup
    },
    {
      title: "Tempo sceny",
      eyebrow: "Reżyseria",
      description: "Sekcja na presję czasu, eskalację i konsekwencje kolejnych rund.",
      icon: IconSparkles
    }
  ],
  exploration: [
    {
      title: "Aktualny cel",
      eyebrow: "Eksploracja",
      description: "Przestrzeń na bieżący kierunek drużyny, otwarte pytania i najbliższy punkt zaczepienia.",
      icon: IconCompass
    },
    {
      title: "Miejsca i tropy",
      eyebrow: "Świat",
      description: "Kafelek pod lokacje, ślady i obiekty, które warto mieć stale pod ręką podczas scen.",
      icon: IconMapPin
    },
    {
      title: "Frakcje i NPC",
      eyebrow: "Relacje",
      description: "Widok pod aktywnych bohaterów niezależnych, nastawienie i aktualne interesy stron.",
      icon: IconUsersGroup
    },
    {
      title: "Otwarte wątki",
      eyebrow: "Narracja",
      description: "Sekcja na cliffhangery, pytania bez odpowiedzi i haczyki prowadzące do kolejnych scen.",
      icon: IconRouteAltLeft
    }
  ]
};

function buildSceneReferences(
  scene: SceneRecord,
  characters: CatalogCharacter[],
  quests: CatalogQuest[],
  worldEntries: CatalogWorldEntry[]
): SceneReferenceBundle {
  const worldMap = new Map(worldEntries.map((entry) => [entry.id, entry]));
  const threadQuest = quests.find((quest) => quest.id === scene.thread_id);

  return {
    characters: characters
      .filter((character) => (threadQuest?.key_character_ids ?? []).includes(character.id))
      .map((character) => ({ id: character.id, name: character.name })),
    locations: worldEntries
      .filter((entry) => scene.location_ids.includes(entry.id))
      .map((entry) => ({ id: entry.id, name: entry.name })),
    npcs: [...new Set([...(threadQuest?.key_npc_ids ?? []), ...scene.npc_ids])]
      .map((id) => worldMap.get(id))
      .filter((entry): entry is CatalogWorldEntry => !!entry)
      .map((entry) => ({ id: entry.id, name: entry.name })),
    playerCharacters: characters
      .filter((character) => scene.character_ids.includes(character.id))
      .map((character) => ({ id: character.id, name: character.name })),
    searchResults: [
      ...characters.map((character) => ({
        id: character.id,
        kind: "character" as const,
        meta: "Postać",
        name: character.name
      })),
      ...quests.map((quest) => ({ id: quest.id, kind: "quest" as const, meta: "Wątek", name: quest.name })),
      ...worldEntries.map((entry) => ({
        id: entry.id,
        kind: "world_entry" as const,
        meta:
          entry.templateKey === "npc"
            ? "NPC"
            : entry.templateKey === "location"
              ? "Miejsce"
              : "Świat",
        name: entry.name
      }))
    ]
  };
}

export function SessionDashboardShell({
  campaignId,
  characters,
  initialMode,
  initialSessionNumber,
  plannerEvents,
  quests,
  scenes,
  sessions,
  worldEntries
}: SessionDashboardShellProps) {
  const { config } = useTopBar();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionListOpened, { toggle: toggleSessionList }] = useDisclosure(true);
  const [mode, setMode] = useState<SessionMode>(initialMode);
  const [planningBySession, setPlanningBySession] = useState<Record<number, SessionPlanningState>>({});
  const [titleDraft, setTitleDraft] = useState("");
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedPlannerEventId, setSelectedPlannerEventId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const activeSessionNumber = initialSessionNumber ?? sessions[0]?.number ?? null;
  const activeSession = sessions.find((session) => session.number === activeSessionNumber) ?? null;

  useEffect(() => {
    setTitleDraft(activeSession?.label ?? "");
  }, [activeSession?.label]);

  const campaignCharacters = config.variant === "campaign" ? config.campaignCharacters : characters;
  const activePlanningState =
    activeSession != null
      ? planningBySession[activeSession.number] ?? {
          scheduledAt: DEFAULT_SESSION_DATETIME,
          playerIds: campaignCharacters
            .filter((character) =>
              MOCK_SESSION_RSVP_PLAYERS.some(
                (player) => player.accepted && player.name.toLowerCase() === character.name.toLowerCase()
              )
            )
            .map((character) => character.id)
        }
      : null;

  const tiles = dashboardTilesByMode[mode];
  const panelHeading = mode === "combat" ? "Tryb walki" : "Tryb eksploracji";
  const panelDescription =
    activeSession == null
      ? "Wybierz albo utwórz sesję, a ten panel stanie się kontenerem dla całej jej zawartości."
      : mode === "combat"
        ? "Ten układ jest przygotowany pod szybkie decyzje przy stole i osobne kafelki stricte bitewne."
        : "";

  const sessionScenes = useMemo(() => {
    if (activeSessionNumber == null) {
      return [];
    }
    return scenes.filter((scene) => scene.session_numbers.includes(activeSessionNumber));
  }, [activeSessionNumber, scenes]);

  const availableScenes = useMemo(() => {
    if (activeSessionNumber == null) {
      return scenes;
    }
    return scenes.filter((scene) => !scene.session_numbers.includes(activeSessionNumber));
  }, [activeSessionNumber, scenes]);

  const handleModeChange = (value: string) => {
    if (value !== "combat" && value !== "exploration") {
      return;
    }

    setMode(value);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("mode", value);
    if (activeSessionNumber != null) {
      nextParams.set("session", String(activeSessionNumber));
    }

    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  };

  const handleCreateSession = () => {
    startTransition(async () => {
      const result = await createSessionCapture(campaignId);
      if (result.error || result.sessionNumber == null) {
        showNotification({
          color: "red",
          message: result.error ?? "Nie udało się utworzyć sesji.",
          title: "Błąd tworzenia sesji"
        });
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("mode", mode);
      nextParams.set("session", String(result.sessionNumber));
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
      router.refresh();
    });
  };

  const handleTitleBlur = () => {
    if (activeSession == null) {
      return;
    }

    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === activeSession.label) {
      setTitleDraft(activeSession.label);
      return;
    }

    startTransition(async () => {
      const result = await updateSessionCaptureTitle(campaignId, activeSession.number, trimmed);
      if (result.error) {
        setTitleDraft(activeSession.label);
        showNotification({
          color: "red",
          message: result.error,
          title: "Nie udało się zapisać tytułu"
        });
        return;
      }

      router.refresh();
    });
  };

  const updateActivePlanningState = (next: Partial<SessionPlanningState>) => {
    if (activeSession == null || activePlanningState == null) {
      return;
    }

    setPlanningBySession((current) => ({
      ...current,
      [activeSession.number]: {
        ...activePlanningState,
        ...next
      }
    }));
  };

  const handleAddScene = (sceneId: string) => {
    if (activeSessionNumber == null) {
      return;
    }
    startTransition(async () => {
      const result = await addSceneToSession(campaignId, sceneId, activeSessionNumber);
      if (!result.ok) {
        showNotification({
          color: "red",
          message: result.error ?? "Nie udało się dodać sceny do sesji.",
          title: "Błąd dodawania sceny"
        });
        return;
      }
      setSelectedSceneId(null);
      router.refresh();
    });
  };

  const handleCreateManualScene = () => {
    if (activeSessionNumber == null) {
      return;
    }
    startTransition(async () => {
      const result = await createScene(campaignId, { sessionNumber: activeSessionNumber });
      if (!result.ok) {
        showNotification({
          color: "red",
          message: result.error ?? "Nie udało się utworzyć sceny.",
          title: "Błąd tworzenia sceny"
        });
        return;
      }
      router.refresh();
    });
  };

  const handleCreateSceneFromEvent = () => {
    if (activeSessionNumber == null || !selectedPlannerEventId) {
      return;
    }
    startTransition(async () => {
      const result = await createScene(campaignId, {
        sessionNumber: activeSessionNumber,
        sourceEventId: selectedPlannerEventId
      });
      if (!result.ok) {
        showNotification({
          color: "red",
          message: result.error ?? "Nie udało się utworzyć sceny z eventu.",
          title: "Błąd tworzenia sceny"
        });
        return;
      }
      setSelectedPlannerEventId(null);
      router.refresh();
    });
  };

  const handleRemoveScene = (sceneId: string) => {
    if (activeSessionNumber == null) {
      return;
    }
    startTransition(async () => {
      const result = await removeSceneFromSession(campaignId, sceneId, activeSessionNumber);
      if (!result.ok) {
        showNotification({
          color: "red",
          message: result.error ?? "Nie udało się odpiąć sceny od sesji.",
          title: "Błąd usuwania sceny"
        });
        return;
      }
      router.refresh();
    });
  };

  return (
    <Stack gap="lg">
      <Flex align="stretch" direction={{ base: "column", lg: "row" }} gap="lg">
        <Paper
          p="sm"
          radius="lg"
          style={{
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            minWidth: sessionListOpened ? SESSION_LIST_EXPANDED_WIDTH : SESSION_LIST_COLLAPSED_WIDTH,
            transition: "min-width 160ms ease"
          }}
          withBorder
        >
          <Group justify="space-between" mb="xs" wrap="nowrap">
            {sessionListOpened ? (
              <Text fw={700} size="sm">
                Sesje kampanii
              </Text>
            ) : (
              <Box />
            )}
            <ActionIcon
              aria-label={sessionListOpened ? "Zwiń listę sesji" : "Rozwiń listę sesji"}
              onClick={toggleSessionList}
              variant="subtle"
            >
              {sessionListOpened ? <IconChevronLeft size={18} /> : <IconChevronRight size={18} />}
            </ActionIcon>
          </Group>

          {sessionListOpened ? (
            <Stack gap={6}>
              <Button
                fullWidth
                leftSection={<IconPlus size={16} />}
                loading={isPending}
                onClick={handleCreateSession}
                variant="light"
              >
                Stwórz sesję
              </Button>
              {sessions.map((session) => (
                <NavLink
                  key={session.number}
                  active={session.number === activeSessionNumber}
                  component={Link}
                  description={session.subtitle}
                  href={{
                    pathname: `/campaign/${campaignId}/session-dashboard` as Route,
                    query: { mode, session: String(session.number) }
                  }}
                  label={session.label}
                  prefetch
                  rightSection={
                    session.number === activeSessionNumber ? (
                      <Badge radius="sm" variant="light">
                        Otwarta
                      </Badge>
                    ) : undefined
                  }
                />
              ))}
            </Stack>
          ) : (
            <Stack align="center" gap="xs" mt="sm">
              <ActionIcon
                aria-label="Stwórz sesję"
                loading={isPending}
                onClick={handleCreateSession}
                radius="md"
                size="lg"
                variant="light"
              >
                <IconPlus size={18} />
              </ActionIcon>
              {sessions.map((session) => {
                const isActive = session.number === activeSessionNumber;
                return (
                  <Button
                    key={session.number}
                    aria-label={`Wczytaj sesję ${session.number}`}
                    component={Link}
                    href={{
                      pathname: `/campaign/${campaignId}/session-dashboard` as Route,
                      query: { mode, session: String(session.number) }
                    }}
                    p={0}
                    radius="md"
                    size="md"
                    style={{ minWidth: 36 }}
                    variant={isActive ? "filled" : "light"}
                  >
                    {session.number}
                  </Button>
                );
              })}
            </Stack>
          )}
        </Paper>

        <Stack style={{ flex: 1, minWidth: 0 }}>
          {activeSession != null ? (
            <Group justify="flex-end">
              <SegmentedControl
                data={[
                  { label: "Eksploracja", value: "exploration" },
                  { label: "Walka", value: "combat" }
                ]}
                onChange={handleModeChange}
                value={mode}
              />
            </Group>
          ) : null}

          {activeSession != null ? (
            <>
              <Paper p="lg" radius="lg" withBorder>
                <Group align="flex-start" gap="md">
                  <Stack gap="lg" style={{ flex: 1 }}>
                    <Stack gap={6}>
                      <Group gap="xs">
                        <Badge variant="dot">{activeSession.subtitle}</Badge>
                        <Badge color={mode === "combat" ? "red" : "teal"} variant="light">
                          {panelHeading}
                        </Badge>
                      </Group>
                      <EditableEntityTitle onBlur={handleTitleBlur} onChange={setTitleDraft} value={titleDraft} />
                    </Stack>

                    <Flex direction="column" gap="md">
                      <Stack gap="xs" maw={340} style={{ minWidth: 0 }}>
                        <Text fw={600} size="sm">
                          Kiedy gramy
                        </Text>
                        <TextInput
                          onChange={(event) =>
                            updateActivePlanningState({ scheduledAt: event.currentTarget.value })
                          }
                          type="datetime-local"
                          value={activePlanningState?.scheduledAt ?? DEFAULT_SESSION_DATETIME}
                        />
                      </Stack>

                      <Stack gap="xs" style={{ minWidth: 0, width: "100%" }}>
                        <Text fw={600} size="sm">
                          Gracze
                        </Text>
                        {campaignCharacters.length > 0 ? (
                          <Checkbox.Group
                            onChange={(value) => updateActivePlanningState({ playerIds: value })}
                            value={activePlanningState?.playerIds ?? []}
                          >
                            <Group gap="sm" style={{ width: "100%" }}>
                              {campaignCharacters.map((character, index) => {
                                const checked = activePlanningState?.playerIds.includes(character.id) ?? false;
                                return (
                                  <Tooltip key={character.id} label={character.name}>
                                    <Box
                                      component="label"
                                      style={{ alignItems: "center", cursor: "pointer", display: "inline-flex", gap: 8 }}
                                    >
                                      <Checkbox size="xs" styles={{ body: { alignItems: "center" } }} value={character.id} />
                                      <Avatar
                                        aria-label={character.name}
                                        color={AVATAR_COLORS[index % AVATAR_COLORS.length]}
                                        radius="xl"
                                        size="md"
                                        style={{
                                          border: checked
                                            ? "2px solid var(--mantine-color-blue-6)"
                                            : "2px solid transparent",
                                          transition: "border-color 140ms ease"
                                        }}
                                      >
                                        {initials(character.name)}
                                      </Avatar>
                                    </Box>
                                  </Tooltip>
                                );
                              })}
                            </Group>
                          </Checkbox.Group>
                        ) : (
                          <Text c="dimmed" size="sm">
                            Brak postaci graczy do zaznaczenia.
                          </Text>
                        )}
                      </Stack>
                    </Flex>

                    {panelDescription ? (
                      <Text c="dimmed" maw={720} size="sm">
                        {panelDescription}
                      </Text>
                    ) : null}
                  </Stack>
                </Group>
              </Paper>

              <Paper p="lg" radius="lg" withBorder>
                <Stack gap="md">
                  <Group justify="space-between" wrap="wrap">
                    <Stack gap={4}>
                      <Title order={3}>Sceny sesji</Title>
                      <Text c="dimmed" size="sm">
                        Dodane sceny rozwijasz niżej i możesz dopisywać je w trakcie sesji.
                      </Text>
                    </Stack>
                    <Group>
                      <Button leftSection={<IconPlus size={16} />} loading={isPending} onClick={handleCreateManualScene} variant="light">
                        Nowa scena
                      </Button>
                    </Group>
                  </Group>

                  <Group align="flex-end" grow>
                    <Select
                      data={availableScenes.map((scene) => ({ value: scene.id, label: scene.name }))}
                      label="Dodaj istniejącą scenę"
                      onChange={setSelectedSceneId}
                      placeholder="Wybierz scenę"
                      searchable
                      value={selectedSceneId}
                    />
                    <Button disabled={!selectedSceneId} loading={isPending} onClick={() => selectedSceneId && handleAddScene(selectedSceneId)}>
                      Dodaj do sesji
                    </Button>
                  </Group>

                  <Group align="flex-end" grow>
                    <Select
                      data={plannerEvents.map((event) => ({ value: event.id, label: event.label }))}
                      label="Szybko utwórz scenę z eventu"
                      onChange={setSelectedPlannerEventId}
                      placeholder="Wybierz event"
                      searchable
                      value={selectedPlannerEventId}
                    />
                    <Button
                      disabled={!selectedPlannerEventId}
                      loading={isPending}
                      onClick={handleCreateSceneFromEvent}
                      variant="light"
                    >
                      Dodaj z eventu
                    </Button>
                  </Group>

                  {sessionScenes.length === 0 ? (
                    <Text c="dimmed" size="sm">
                      Ta sesja nie ma jeszcze przypisanych scen.
                    </Text>
                  ) : (
                    <Stack gap="lg">
                      {sessionScenes.map((scene) => (
                        <Paper key={scene.id} p="md" radius="md" withBorder>
                          <Stack gap="md">
                            <Group justify="space-between" wrap="wrap">
                              <Group gap="xs">
                                <Title order={4}>{scene.name}</Title>
                                {scene.thread_label ? <Badge variant="outline">{scene.thread_label}</Badge> : null}
                              </Group>
                              <ActionIcon
                                aria-label={`Usuń scenę ${scene.name} z sesji`}
                                color="red"
                                onClick={() => handleRemoveScene(scene.id)}
                                variant="subtle"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                            <SceneEditor
                              campaignId={campaignId}
                              compact
                              references={buildSceneReferences(scene, characters, quests, worldEntries)}
                              scene={scene}
                            />
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Paper>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {tiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <Paper key={tile.title} p="lg" radius="lg" style={{ minHeight: 220 }} withBorder>
                      <Stack h="100%" gap="md">
                        <Group align="flex-start" justify="space-between">
                          <ThemeIcon color={mode === "combat" ? "red" : "teal"} radius="md" size={42} variant="light">
                            <Icon size={22} stroke={1.8} />
                          </ThemeIcon>
                          <Badge variant="light">{tile.eyebrow}</Badge>
                        </Group>
                        <Stack gap={6}>
                          <Title order={4}>{tile.title}</Title>
                          <Text c="dimmed" size="sm">
                            {tile.description}
                          </Text>
                        </Stack>
                        <Divider mt="auto" />
                        <Text c="dimmed" size="xs">
                          Rezerwacja miejsca pod docelowy widget tego trybu.
                        </Text>
                      </Stack>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            </>
          ) : null}
        </Stack>
      </Flex>
    </Stack>
  );
}
