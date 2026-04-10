"use client";

import { Avatar, Box, Image } from "@mantine/core";

export function campaignEntityInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export type CampaignEntityPortraitProps = {
  name: string;
  portrait_url: string | null;
  variant: "player" | "npc";
  width: number;
  height: number;
};

export function CampaignEntityPortrait({
  name,
  portrait_url,
  variant,
  width,
  height
}: CampaignEntityPortraitProps) {
  const color = variant === "player" ? "grape" : "gray";
  return (
    <Box
      style={{
        flexShrink: 0,
        width,
        height,
        overflow: "hidden",
        borderRadius: "var(--mantine-radius-md)"
      }}
    >
      {portrait_url ? (
        <Image alt="" fit="cover" h={height} radius="md" src={portrait_url} w={width} />
      ) : (
        <Avatar
          color={color}
          h={height}
          radius="md"
          styles={{ root: { width: "100%", height: "100%" } }}
          w={width}
        >
          {campaignEntityInitials(name)}
        </Avatar>
      )}
    </Box>
  );
}
