"use client";

import { SimpleGrid } from "@mantine/core";

import { FabulaTile } from "@/components/fabula/fabula-tile";
import { type FabulaRow } from "@/lib/fabula";

type FabulaGridProps = {
  items: FabulaRow[];
};

export function FabulaGrid({ items }: FabulaGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
      {items.map((c) => (
        <FabulaTile campaign={c} key={c.id} />
      ))}
    </SimpleGrid>
  );
}
