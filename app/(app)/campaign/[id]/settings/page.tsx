import {
  Badge,
  Container,
  Image,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { notFound } from "next/navigation";

import {
  GAME_SYSTEM_OPTIONS,
  coverImageSrc,
  fabulaKindLabel,
  isFabulaKind
} from "@/lib/fabula";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SettingsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignSettingsPage({ params }: SettingsPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, name, system, fabula_kind, cover_image_url")
    .eq("id", id)
    .single();

  if (error || !campaign || !isFabulaKind(campaign.fabula_kind)) {
    notFound();
  }

  const systemLabel =
    GAME_SYSTEM_OPTIONS.find((o) => o.value === campaign.system)?.label ??
    campaign.system;

  const row = {
    cover_image_url: campaign.cover_image_url,
    fabula_kind: campaign.fabula_kind
  };

  return (
    <Container pb="xl" size="md">
      <Stack gap="lg">
        <div>
          <Title order={2}>Ustawienia fabuły</Title>
          <Text c="dimmed" mt="sm">
            Tu później zmienisz nazwę, okładkę i szczegóły kampanii lub jednostrzalu.
          </Text>
        </div>

        <Image alt="" fit="cover" h={160} radius="md" src={coverImageSrc(row)} />

        <Stack gap="xs">
          <Text size="sm">
            <strong>Nazwa:</strong> {campaign.name}
          </Text>
          <Text size="sm">
            <strong>System:</strong> {systemLabel}
          </Text>
          <Text size="sm">
            <strong>Typ fabuły:</strong>{" "}
            <Badge color={campaign.fabula_kind === "oneshot" ? "teal" : "violet"} variant="light">
              {fabulaKindLabel(campaign.fabula_kind)}
            </Badge>
          </Text>
        </Stack>

        <Text c="dimmed" size="sm">
          Edycja pól i upload okładki — wkrótce.
        </Text>
      </Stack>
    </Container>
  );
}
