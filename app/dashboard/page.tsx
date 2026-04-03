import { Container, Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Container py={48} size="md">
      <Stack gap="md">
        <div>
          <Title order={1}>Panel</Title>
          <Text c="dimmed" mt="sm">
            Jesteś zalogowany. Lista kampanii pojawi się w kolejnym kroku.
          </Text>
        </div>
        <Text size="sm">
          <strong>E-mail:</strong> {user.email ?? "—"}
        </Text>
        <SignOutButton />
      </Stack>
    </Container>
  );
}
