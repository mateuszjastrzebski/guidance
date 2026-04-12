"use client";

import { Anchor, Button, Container, Stack, Text, TextInput, Title } from "@mantine/core";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";

import posthog from "posthog-js";

import { DevBypassLoginButton } from "@/app/login/dev-bypass-button";
import { getAppBaseUrl } from "@/lib/auth/app-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type LoginFormProps = {
  authError?: string;
};

export function LoginForm({ authError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authError === "callback") {
      showNotification({
        color: "red",
        title: "Logowanie nie powiodło się",
        message: "Link mógł wygasnąć lub redirect URL w Supabase jest źle skonfigurowany."
      });
    }
    if (authError === "missing_code") {
      showNotification({
        color: "red",
        title: "Brak kodu autoryzacji",
        message: "Otwórz link z maila w całości lub poproś o nowy."
      });
    }
  }, [authError]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const baseUrl = getAppBaseUrl();
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback`
        }
      });

      if (error) {
        showNotification({
          color: "red",
          title: "Nie udało się wysłać linku",
          message: error.message
        });
        return;
      }

      posthog.capture("magic_link_requested", { email: email.trim() });
      posthog.identify(email.trim(), { email: email.trim() });

      showNotification({
        color: "green",
        title: "Sprawdź skrzynkę",
        message: "Wysłaliśmy magic link na podany adres e-mail."
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Nieznany błąd";
      posthog.captureException(caught instanceof Error ? caught : new Error(message));
      showNotification({
        color: "red",
        title: "Konfiguracja",
        message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container py={48} size="sm">
      <Stack gap="lg">
        <div>
          <Title order={1}>Zaloguj się</Title>
          <Text c="dimmed" mt="sm">
            Podaj e-mail — wyślemy magic link (Supabase Auth).
          </Text>
        </div>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              required
              autoComplete="email"
              label="E-mail"
              placeholder="twoj@email.pl"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <Button loading={loading} type="submit">
              Wyślij link
            </Button>
          </Stack>
        </form>

        <Anchor component={Link} href="/" size="sm">
          Wróć na stronę główną
        </Anchor>

        <DevBypassLoginButton />
      </Stack>
    </Container>
  );
}
