"use client";

import { Anchor } from "@mantine/core";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  label?: string;
};

export function BackButton({ label = "Wróć" }: BackButtonProps) {
  const router = useRouter();
  return (
    <Anchor component="button" onClick={() => router.back()} size="sm">
      {label}
    </Anchor>
  );
}
