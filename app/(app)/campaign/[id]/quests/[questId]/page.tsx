import { Anchor, Container, Stack, Text, Title } from "@mantine/core";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const QUEST_STATUS_LABEL: Record<string, string> = {
  active: "Aktywny",
  completed: "Zakończony",
  suspended: "Wstrzymany"
};

type QuestDetailPageProps = {
  params: { id: string; questId: string };
};

export default async function QuestDetailPage({ params }: QuestDetailPageProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: quest, error } = await supabase
    .from("quests")
    .select("id, name, description, status, campaign_id")
    .eq("id", params.questId)
    .eq("campaign_id", params.id)
    .single();

  if (error || !quest) {
    notFound();
  }

  const boardHref = `/campaign/${params.id}` as Route;

  return (
    <Container pb="xl" pt="md" size="sm">
      <Stack gap="md">
        <Anchor component={Link} href={boardHref} size="sm">
          Wróć do tablicy
        </Anchor>
        <Title order={2}>{quest.name}</Title>
        <Text c="dimmed" size="sm">
          Status: {QUEST_STATUS_LABEL[quest.status] ?? quest.status}
        </Text>
        {quest.description ? (
          <Text style={{ whiteSpace: "pre-wrap" }}>{quest.description}</Text>
        ) : (
          <Text c="dimmed">Brak opisu.</Text>
        )}
      </Stack>
    </Container>
  );
}
