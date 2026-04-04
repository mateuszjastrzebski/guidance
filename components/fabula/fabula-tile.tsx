"use client";

import { Badge, Card, Group, Image, Text } from "@mantine/core";
import type { Route } from "next";
import Link from "next/link";

import {
  type FabulaRow,
  coverImageSrc,
  fabulaKindLabel
} from "@/lib/fabula";

type FabulaTileProps = {
  campaign: FabulaRow;
};

export function FabulaTile({ campaign }: FabulaTileProps) {
  const href = `/campaign/${campaign.id}/settings` as Route;
  const src = coverImageSrc(campaign);

  return (
    <Card
      component={Link}
      href={href}
      padding="lg"
      radius="md"
      shadow="sm"
      withBorder
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card.Section>
        <Image alt="" fit="cover" h={140} src={src} />
      </Card.Section>
      <Group justify="space-between" mt="md" wrap="nowrap">
        <Text fw={600} lineClamp={2} style={{ flex: 1 }}>
          {campaign.name}
        </Text>
        <Badge color={campaign.fabula_kind === "oneshot" ? "teal" : "violet"} variant="light">
          {fabulaKindLabel(campaign.fabula_kind)}
        </Badge>
      </Group>
    </Card>
  );
}
