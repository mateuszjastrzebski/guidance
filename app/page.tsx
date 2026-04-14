import {
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";

import { guidanceReleaseNotes } from "@/lib/guidance-release-notes";
import { setupStatusItems } from "@/lib/setup-status";

export default function HomePage() {
  return (
    <Container py={48} size="md">
      <Stack gap="xl">
        <div>
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Badge color="violet" variant="light">
              Setup projektu
            </Badge>
            <Group gap="md">
              <Anchor component={Link} href="/login" size="sm">
                Zaloguj się
              </Anchor>
              <Anchor c="dimmed" component={Link} href="/dashboard" size="sm">
                Panel
              </Anchor>
            </Group>
          </Group>
          <Title mt="md" order={1}>
            Campaign Layer
          </Title>
          <Text c="dimmed" mt="sm">
            Strona główna pokazuje stan przygotowanego setupu oraz historię zmian kolejnych wersji Guidance.
          </Text>
        </div>

        <Stack gap="sm">
          <Title order={2}>Co zostało zrobione</Title>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {setupStatusItems.map((item) => (
              <li key={item} style={{ marginBottom: "0.75rem" }}>
                {item}
              </li>
            ))}
          </ul>
        </Stack>

        <Stack gap="md">
          <div>
            <Title order={2}>Historia wersji Guidance</Title>
            <Text c="dimmed" mt={6}>
              Przegląd został zrekonstruowany na podstawie historii repozytorium i pokazuje, co dochodziło w
              kolejnych etapach rozwoju.
            </Text>
          </div>

          <Stack gap="sm">
            {guidanceReleaseNotes
              .slice()
              .reverse()
              .map((release) => (
                <Paper key={release.version} p="lg" radius="md" withBorder>
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start" wrap="wrap">
                      <div>
                        <Group gap="xs">
                          <Badge variant="light">{release.version}</Badge>
                          <Text c="dimmed" size="sm">
                            {release.date}
                          </Text>
                        </Group>
                        <Title mt={8} order={3}>
                          {release.title}
                        </Title>
                      </div>
                    </Group>

                    <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                      {release.changes.map((change) => (
                        <li key={change} style={{ marginBottom: "0.5rem" }}>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </Stack>
                </Paper>
              ))}
          </Stack>
        </Stack>

        <Stack align="start" gap="sm">
          <Title order={2}>Smoke test design systemu</Title>
          <Text c="dimmed">
            Ten przycisk istnieje tylko po to, żeby potwierdzić poprawną instalację Mantine.
          </Text>
          <Button variant="filled">Design system OK</Button>
        </Stack>
      </Stack>
    </Container>
  );
}
