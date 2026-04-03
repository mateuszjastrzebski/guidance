import { Anchor, Badge, Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";

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
            Strona główna pokazuje wyłącznie stan przygotowanego setupu na podstawie PRD.
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
