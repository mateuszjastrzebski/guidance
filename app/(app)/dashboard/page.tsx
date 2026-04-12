import { Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FabulaGrid } from "@/components/fabula/fabula-grid";
import { type FabulaRow, isFabulaKind } from "@/lib/fabula";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rows, error } = await supabase
    .from("campaigns")
    .select("id, name, system, fabula_kind, cover_image_url, created_at")
    .order("created_at", { ascending: false });

  const items: FabulaRow[] = (rows ?? [])
    .filter((r) => r.id && r.name && isFabulaKind(String(r.fabula_kind)))
    .map((r) => ({
      id: r.id,
      name: r.name,
      system: r.system,
      fabula_kind: r.fabula_kind as FabulaRow["fabula_kind"],
      cover_image_url: r.cover_image_url,
      created_at: r.created_at ?? undefined
    }));

  return (
    <Container py={48} size="lg">
      <Stack gap="xl">
        <Group align="flex-start" justify="space-between" wrap="wrap">
          <div>
            <Title order={1}>Twoje fabuły</Title>
            <Text c="dimmed" mt="sm">
              {user.email}
            </Text>
          </div>
          <Button component={Link} href="/campaigns/new">
            Nowa fabuła
          </Button>
        </Group>

        {error ? (
          <Text c="red" size="sm">
            Nie udało się wczytać listy: {error.message}
          </Text>
        ) : null}

        {items.length === 0 && !error ? (
          <Text c="dimmed">Nie masz jeszcze fabuł. Kliknij „Nowa fabuła”, żeby zacząć.</Text>
        ) : null}

        {items.length > 0 ? <FabulaGrid items={items} /> : null}
      </Stack>
    </Container>
  );
}
