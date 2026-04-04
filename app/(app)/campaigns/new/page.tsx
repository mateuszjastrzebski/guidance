import { Container, Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";

import { CreateFabulaForm } from "@/app/(app)/campaigns/new/create-fabula-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewFabulaPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Container py={48} size="sm">
      <Stack gap="lg">
        <div>
          <Title order={1}>Nowa fabuła</Title>
          <Text c="dimmed" mt="sm">
            Kampania albo jednostrzal — na razie ta sama przestrzeń robocza; później rozwiną się osobne
            ścieżki produktowe.
          </Text>
        </div>
        <CreateFabulaForm />
      </Stack>
    </Container>
  );
}
