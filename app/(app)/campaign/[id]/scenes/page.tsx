import { Container, Stack, Text, Title } from "@mantine/core";

export default function ScenesPage() {
  return (
    <Container pb="xl" pt="md" size="sm">
      <Stack gap="md">
        <Title order={2}>Sceny</Title>
        <Text c="dimmed" size="sm">
          Ten widok jest w przygotowaniu.
        </Text>
      </Stack>
    </Container>
  );
}
