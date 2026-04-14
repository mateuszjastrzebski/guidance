"use client";

import { ActionIcon, Tooltip } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <Tooltip label="Wróć">
      <ActionIcon aria-label="Wróć" onClick={() => router.back()} size="lg" variant="subtle">
        <IconArrowLeft size={20} />
      </ActionIcon>
    </Tooltip>
  );
}
