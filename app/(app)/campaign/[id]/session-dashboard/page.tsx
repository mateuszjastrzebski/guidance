import { Container, Stack, Text, Title } from "@mantine/core";

export default function SessionDashboardPage() {
  return (
    <Container pb="xl" pt="md" size="lg">
      <Stack gap="md">
        <Title order={2}>Pulpit sesji</Title>
        <Text c="dimmed" size="sm">
          Ten widok jest w przygotowaniu.
        </Text>
      </Stack>
    </Container>
  );
}
