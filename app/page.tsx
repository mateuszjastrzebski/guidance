import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title
} from "@mantine/core";
import {
  IconArrowRight,
  IconCompass,
  IconMap2,
  IconSwords,
  IconUsersGroup
} from "@tabler/icons-react";
import { Fraunces, Space_Grotesk } from "next/font/google";
import Link from "next/link";

import { guidanceReleaseNotes } from "@/lib/guidance-release-notes";

import classes from "./page.module.css";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"]
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

const productSignals = [
  { value: "6+", label: "obszarów pracy MG" },
  { value: "2", label: "tryby dashboardu sesji" },
  { value: "1", label: "spójny workspace" }
] as const;

const moduleSections = [
  {
    eyebrow: "Planner fabuły",
    title: "Rozpisujesz wątki jak na reżyserskiej planszy.",
    description: "Eventy, napięcie i kierunek kampanii ułożone w czytelny, wizualny flow.",
    accentClassName: classes.plannerMock,
    layoutClassName: classes.moduleLayoutWide,
    icon: IconCompass
  },
  {
    eyebrow: "Dashboard sesji",
    title: "Przełączasz fokus między eksploracją i walką.",
    description: "Jednym ekranem ogarniasz rytm sesji, aktywne sceny i to, co MG ma mieć pod ręką teraz.",
    accentClassName: classes.sessionMock,
    layoutClassName: classes.moduleLayoutReverse,
    icon: IconSwords
  },
  {
    eyebrow: "Świat kampanii",
    title: "Budujesz atlas miejsc, NPC-ów i powiązań.",
    description: "Nie encyklopedia bez końca, tylko szybki kontekst do użycia przy stole.",
    accentClassName: classes.worldMock,
    layoutClassName: classes.moduleLayoutWide,
    icon: IconMap2
  },
  {
    eyebrow: "Postacie i sceny",
    title: "Trzymasz drużynę, questy i przebieg kampanii razem.",
    description: "Roster graczy, aktywne questy i przygotowane sceny składają się w jeden operacyjny widok.",
    accentClassName: classes.rosterMock,
    layoutClassName: classes.moduleLayoutReverse,
    icon: IconUsersGroup
  }
] as const;

const latestReleaseNotes = guidanceReleaseNotes.slice(-2).reverse();

export default function HomePage() {
  return (
    <Box className={`${classes.page} ${bodyFont.className}`}>
      <Container className={classes.container} py={36} size="xl">
        <Stack gap={56}>
          <Group justify="space-between" wrap="wrap">
            <Group gap="sm">
              <Text className={`${classes.wordmark} ${displayFont.className}`}>
                Guidance
              </Text>
              <Text className={classes.topbarText} size="sm">
                narzędzie dla MG
              </Text>
            </Group>

            <Group gap="sm">
              <Anchor component={Link} href="/changelog" size="sm">
                Changelog
              </Anchor>
              <Anchor component={Link} href="/login" size="sm">
                Zaloguj się
              </Anchor>
              <Button component={Link} href="/dashboard" radius="xl" variant="light">
                Otwórz aplikację
              </Button>
            </Group>
          </Group>

          <section>
            <Card className={classes.heroCard} padding="xl" radius="xl">
              <div className={classes.heroGlow} />
              <div className={classes.heroGrid}>
                <Stack className={classes.heroContent} gap="xl">
                  <div>
                    <Title className={`${classes.heroTitle} ${displayFont.className}`} order={1}>
                      Narzędzie do budowania
                      <br />
                      wciągających historii.
                    </Title>
                    <Text className={classes.heroText} mt="md" size="lg">
                      Guidance pomaga układać wątki, sceny, świat i sesje w jeden płynny proces prowadzenia.
                    </Text>
                  </div>

                  <Group gap="sm" wrap="wrap">
                    <Button
                      component={Link}
                      href="/dashboard"
                      radius="xl"
                      rightSection={<IconArrowRight size={16} />}
                      size="lg"
                    >
                      Zobacz workspace
                    </Button>
                    <Button component={Link} href="/changelog" radius="xl" size="lg" variant="default">
                      Ostatnie zmiany
                    </Button>
                  </Group>
                </Stack>

                <div className={classes.heroVisual}>
                  <div className={classes.orbit} />
                  <Card className={`${classes.floatingCard} ${classes.cardA}`} padding="md" radius="xl">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon className={classes.featureIcon} radius="xl" size={42}>
                        <IconCompass size={20} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700}>Planner</Text>
                        <Text className={classes.visualSubtext} size="sm">
                          aktywne wątki
                        </Text>
                      </div>
                    </Group>
                  </Card>

                  <Card className={`${classes.floatingCard} ${classes.cardB}`} padding="md" radius="xl">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon className={classes.featureIcon} radius="xl" size={42}>
                        <IconSwords size={20} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700}>Sesja</Text>
                        <Text className={classes.visualSubtext} size="sm">
                          combat / exploration
                        </Text>
                      </div>
                    </Group>
                  </Card>

                  <Card className={`${classes.floatingCard} ${classes.cardC}`} padding="md" radius="xl">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon className={classes.featureIcon} radius="xl" size={42}>
                        <IconMap2 size={20} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700}>Świat</Text>
                        <Text className={classes.visualSubtext} size="sm">
                          miejsca i postacie
                        </Text>
                      </div>
                    </Group>
                  </Card>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
              {productSignals.map((signal) => (
                <Card className={classes.signalCard} key={signal.label} padding="xl" radius="xl">
                  <Text className={classes.signalValue}>{signal.value}</Text>
                  <Text className={classes.signalText} mt={8}>
                    {signal.label}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </section>

          <section>
            <Group align="end" justify="space-between" mb="xl" wrap="wrap">
              <div>
                <Text className={classes.sectionEyebrow}>Zakres produktu</Text>
                <Title className={displayFont.className} order={2}>
                  Moduły Guidance
                </Title>
              </div>
            </Group>

            <Stack gap={28}>
              {moduleSections.map((section) => (
                <Card className={classes.moduleSection} key={section.title} padding="xl" radius="xl">
                  <div className={`${classes.moduleGrid} ${section.layoutClassName}`}>
                    <Stack className={classes.moduleCopy} gap="lg">
                      <Group gap="sm" wrap="wrap">
                        <ThemeIcon className={classes.featureIcon} radius="xl" size={48}>
                          <section.icon size={22} />
                        </ThemeIcon>
                        <Text className={classes.sectionEyebrow}>{section.eyebrow}</Text>
                      </Group>

                      <div>
                        <Title className={displayFont.className} order={3}>
                          {section.title}
                        </Title>
                        <Text className={classes.moduleDescription} mt="md" size="lg">
                          {section.description}
                        </Text>
                      </div>
                    </Stack>

                    <div className={`${classes.moduleMock} ${section.accentClassName}`}>
                      {section.eyebrow === "Planner fabuły" ? (
                        <>
                          <div className={classes.mockToolbar}>
                            <span />
                            <span />
                            <span />
                          </div>
                          <div className={classes.mockCanvas}>
                            <div className={`${classes.mockNode} ${classes.mockNodePrimary}`}>
                              Incydent
                            </div>
                            <div className={classes.mockConnector} />
                            <div className={`${classes.mockNode} ${classes.mockNodeSecondary}`}>
                              Zwrot
                            </div>
                            <div className={classes.mockConnectorShort} />
                            <div className={`${classes.mockNode} ${classes.mockNodeAccent}`}>
                              Finał
                            </div>
                          </div>
                        </>
                      ) : null}

                      {section.eyebrow === "Dashboard sesji" ? (
                        <>
                          <div className={classes.mockHeaderBar}>
                            <div className={classes.mockPillActive}>Exploration</div>
                            <div className={classes.mockPill}>Combat</div>
                          </div>
                          <div className={classes.mockSplitLayout}>
                            <div className={classes.mockSessionColumn}>
                              <div className={classes.mockPanelTitle}>Aktualna scena</div>
                              <div className={classes.mockPanelCardTall} />
                            </div>
                            <div className={classes.mockSessionColumn}>
                              <div className={classes.mockPanelTitle}>Sesje</div>
                              <div className={classes.mockListLine} />
                              <div className={classes.mockListLineShort} />
                              <div className={classes.mockListLine} />
                            </div>
                          </div>
                        </>
                      ) : null}

                      {section.eyebrow === "Świat kampanii" ? (
                        <>
                          <div className={classes.mockWorldSidebar}>
                            <div className={classes.mockSidebarDot} />
                            <div className={classes.mockSidebarDot} />
                            <div className={classes.mockSidebarDot} />
                          </div>
                          <div className={classes.mockWorldContent}>
                            <div className={classes.mockWorldCardLarge} />
                            <div className={classes.mockWorldRow}>
                              <div className={classes.mockWorldCardSmall} />
                              <div className={classes.mockWorldCardSmall} />
                            </div>
                            <div className={classes.mockLinkRow}>
                              <span />
                              <span />
                              <span />
                            </div>
                          </div>
                        </>
                      ) : null}

                      {section.eyebrow === "Postacie i sceny" ? (
                        <>
                          <div className={classes.mockRosterTop}>
                            <div className={classes.mockAvatarCluster}>
                              <span />
                              <span />
                              <span />
                            </div>
                            <div className={classes.mockWidePill}>Aktywne questy</div>
                          </div>
                          <div className={classes.mockRosterCards}>
                            <div className={classes.mockRosterCard} />
                            <div className={classes.mockRosterCard} />
                            <div className={classes.mockRosterCardAccent} />
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </Stack>
          </section>

          <section>
            <Group align="end" justify="space-between" mb="xl" wrap="wrap">
              <div>
                <Text className={classes.sectionEyebrow}>Nowości</Text>
                <Title className={displayFont.className} order={2}>
                  Ostatnie zmiany
                </Title>
              </div>
              <Button component={Link} href="/changelog" radius="xl" variant="subtle">
                Pełny changelog
              </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              {latestReleaseNotes.map((release) => (
                <Card className={classes.releaseCard} key={release.version} padding="xl" radius="xl">
                  <Stack gap="md">
                    <Group gap="sm">
                      <Badge radius="xl" variant="light">
                        {release.version}
                      </Badge>
                      <Text c="dimmed" size="sm">
                        {release.date}
                      </Text>
                    </Group>
                    <Title order={3} size="h4">
                      {release.title}
                    </Title>
                    <Text className={classes.releaseText} size="sm">
                      {release.changes[0]}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </section>
        </Stack>
      </Container>
    </Box>
  );
}
