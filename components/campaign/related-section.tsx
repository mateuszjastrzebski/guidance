import { Button, Paper, Stack, Text, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import type { ReactNode } from "react";

type RelatedSectionProps = {
  title: string;
  children?: ReactNode;
};

export function RelatedSection({ title, children }: RelatedSectionProps) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Title order={5}>{title}</Title>
        {children ?? (
          <Text c="dimmed" size="sm">
            Brak powiązanych elementów.
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

export function AddTilePlaceholder() {
  return (
    <Paper p="md" radius="md" style={{ borderStyle: "dashed" }} withBorder>
      <Stack align="center" gap="xs" py="sm">
        <Button
          color="gray"
          disabled
          leftSection={<IconPlus size={16} />}
          size="sm"
          variant="subtle"
        >
          Dodaj kafelek
        </Button>
        <Text c="dimmed" size="xs">
          Wkrótce
        </Text>
      </Stack>
    </Paper>
  );
}
