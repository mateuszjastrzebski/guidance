"use client";

import { Button, Divider, Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useTransition } from "react";

import { devBypassLogin } from "@/app/login/dev-bypass";

export function DevBypassLoginButton() {
  const [pending, startTransition] = useTransition();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Stack gap="sm" mt="xl">
      <Divider label="Development" labelPosition="center" />
      <Text c="dimmed" size="xs">
        Szybkie logowanie bez magic linka — tylko lokalnie, gdy ustawisz{" "}
        <code>DEV_TEST_EMAIL</code> / <code>DEV_TEST_PASSWORD</code>.
      </Text>
      <Button
        color="gray"
        loading={pending}
        variant="light"
        onClick={() => {
          startTransition(async () => {
            const result = await devBypassLogin();
            if (result && "error" in result) {
              showNotification({
                color: "red",
                title: "Bypass dev",
                message: result.error
              });
            }
          });
        }}
      >
        Zaloguj (konto testowe)
      </Button>
    </Stack>
  );
}
