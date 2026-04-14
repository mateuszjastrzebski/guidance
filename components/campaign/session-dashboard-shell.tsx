"use client";

import {
  createSessionCapture,
  updateSessionCaptureTitle
} from "@/app/(app)/campaign/[id]/session-dashboard/actions";
import { useTopBar } from "@/components/app-shell/top-bar-context";
import { EditableEntityTitle } from "@/components/campaign/editable-entity-title";
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
  IconUsersGroup
} from "@tabler/icons-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { MOCK_SESSION_RSVP_PLAYERS } from "@/lib/mocks/demo-campaign-roster";

type SessionListItem = {
  label: string;
  number: number;
  subtitle: string;
};

type SessionMode = "combat" | "exploration";

type SessionDashboardShellProps = {
  campaignId: string;
  initialMode: SessionMode;
  initialSessionNumber: number | null;
  sessions: SessionListItem[];
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

export function SessionDashboardShell({
  campaignId,
  initialMode,
  initialSessionNumber,
  sessions
}: SessionDashboardShellProps) {
  const { config } = useTopBar();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionListOpened, { toggle: toggleSessionList }] = useDisclosure(true);
  const [mode, setMode] = useState<SessionMode>(initialMode);
  const [planningBySession, setPlanningBySession] = useState<Record<number, SessionPlanningState>>({});
  const [titleDraft, setTitleDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const activeSessionNumber = (() => {
    if (initialSessionNumber != null) {
      return initialSessionNumber;
    }

    return sessions[0]?.number ?? null;
  })();
  const activeSession =
    sessions.find((session) => session.number === activeSessionNumber) ?? null;

  useEffect(() => {
    setTitleDraft(activeSession?.label ?? "");
  }, [activeSession?.label]);

  const campaignCharacters = config.variant === "campaign" ? config.campaignCharacters : [];
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
  const hasSessions = sessions.length > 0;
  const panelHeading = mode === "combat" ? "Tryb walki" : "Tryb eksploracji";
  const panelDescription =
    activeSession == null
      ? "Wybierz albo utwórz sesję, a ten panel stanie się kontenerem dla całej jej zawartości."
      : mode === "combat"
        ? "Ten układ jest przygotowany pod szybkie decyzje przy stole i osobne kafelki stricte bitewne."
        : "";

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

  return (
    <Stack gap="lg">
      <Flex align="stretch" direction={{ base: "column", lg: "row" }} gap="lg">
        <Paper
          withBorder
          radius="lg"
          p="sm"
          style={{
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            minWidth: sessionListOpened ? SESSION_LIST_EXPANDED_WIDTH : SESSION_LIST_COLLAPSED_WIDTH,
            transition: "min-width 160ms ease"
          }}
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
              {sessions.map((session) => {
                const href = {
                  pathname: `/campaign/${campaignId}/session-dashboard` as Route,
                  query: { mode, session: String(session.number) }
                };

                return (
                  <NavLink
                    key={session.number}
                    active={session.number === activeSessionNumber}
                    component={Link}
                    description={session.subtitle}
                    href={href}
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
                );
              })}
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
              <Paper withBorder radius="lg" p="lg">
                <Group align="flex-start" gap="md">
                  <Stack gap="lg" style={{ flex: 1 }}>
                    <Stack gap={6}>
                      <Group gap="xs">
                        <Badge variant="dot">{activeSession.subtitle}</Badge>
                        <Badge color={mode === "combat" ? "red" : "teal"} variant="light">
                          {panelHeading}
                        </Badge>
                      </Group>
                      <EditableEntityTitle
                        onBlur={handleTitleBlur}
                        onChange={setTitleDraft}
                        value={titleDraft}
                      />
                    </Stack>

                    <Flex direction="column" gap="md">
                      <Stack gap="xs" maw={340} style={{ minWidth: 0 }}>
                        <Stack gap="xs">
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
                      </Stack>

                      <Stack gap="xs" style={{ minWidth: 0, width: "100%" }}>
                        <Stack gap="xs">
                          <Text fw={600} size="sm">
                            Gracze
                          </Text>
                          {campaignCharacters.length > 0 ? (
                            <Checkbox.Group
                              onChange={(value) =>
                                updateActivePlanningState({ playerIds: value })
                              }
                              value={activePlanningState?.playerIds ?? []}
                            >
                              <Group gap="sm" style={{ width: "100%" }}>
                                {campaignCharacters.map((character, index) => {
                                  const checked = activePlanningState?.playerIds.includes(character.id) ?? false;

                                  return (
                                    <Tooltip key={character.id} label={character.name}>
                                      <Box
                                        component="label"
                                        style={{
                                          alignItems: "center",
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          gap: 8
                                        }}
                                      >
                                        <Checkbox
                                          size="xs"
                                          styles={{ body: { alignItems: "center" } }}
                                          value={character.id}
                                        />
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

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {tiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <Paper key={tile.title} withBorder radius="lg" p="lg" style={{ minHeight: 220 }}>
                      <Stack h="100%" gap="md">
                        <Group justify="space-between" align="flex-start">
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
