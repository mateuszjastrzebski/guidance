import {
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { Fraunces, Space_Grotesk } from "next/font/google";
import Link from "next/link";

import { guidanceReleaseNotes } from "@/lib/guidance-release-notes";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"]
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

export default function ChangelogPage() {
  return (
    <Container className={bodyFont.className} py={40} size="md">
      <Stack gap="xl">
        <Group justify="space-between" wrap="wrap">
          <div>
            <Group gap="sm">
              <Badge color="teal" radius="xl" variant="light">
                Changelog
              </Badge>
              <Text c="dimmed" size="sm">
                Najważniejsze zmiany z perspektywy klienta
              </Text>
            </Group>
            <Title className={displayFont.className} mt="md" order={1}>
              Co zmienia się w Guidance
            </Title>
            <Text c="dimmed" mt="sm">
              Tu zbieramy tylko te aktualizacje, które wpływają na sposób pracy MG, przygotowanie kampanii i
              prowadzenie sesji.
            </Text>
          </div>

          <Group gap="sm">
            <Anchor component={Link} href="/">
              Wróć na landing
            </Anchor>
            <Button component={Link} href="/dashboard" radius="xl" variant="light">
              Otwórz aplikację
            </Button>
          </Group>
        </Group>

        <Stack gap="md">
          {guidanceReleaseNotes
            .slice()
            .reverse()
            .map((release) => (
              <Paper key={release.version} p="lg" radius="xl" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start" wrap="wrap">
                    <div>
                      <Group gap="xs">
                        <Badge radius="xl" variant="light">
                          {release.version}
                        </Badge>
                        <Text c="dimmed" size="sm">
                          {release.date}
                        </Text>
                      </Group>
                      <Title className={displayFont.className} mt={10} order={3}>
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
    </Container>
  );
}
