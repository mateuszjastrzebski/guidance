import { Container, Stack, Text, Title } from "@mantine/core";

export default function CampaignSettingsInvitationsPage() {
  return (
    <Container pb="xl" size="md">
      <Stack gap="md">
        <Title order={2}>Zaproszenia</Title>
        <Text c="dimmed">
          Zapraszanie graczy linkiem lub mailem pojawi się w kolejnym etapie.
        </Text>
      </Stack>
    </Container>
  );
}
