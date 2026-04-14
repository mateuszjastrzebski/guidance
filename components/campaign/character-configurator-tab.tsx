"use client";

import {
  Accordion,
  Badge,
  Button,
  Card,
  Collapse,
  Divider,
  Grid,
  Group,
  List,
  Paper,
  Slider,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useMemo, useState, useTransition } from "react";

import type { CharacterConfigRow } from "@/app/(app)/campaign/[id]/world/[collectionSlug]/[entryId]/configurator-actions";
import { saveCharacterConfig } from "@/app/(app)/campaign/[id]/world/[collectionSlug]/[entryId]/configurator-actions";
import { generateConfig, type SliderValues } from "@/lib/character-configurator/logic";

type Props = {
  campaignId: string;
  worldEntryId: string;
  config: CharacterConfigRow | null;
};

function sliderInitial(config: CharacterConfigRow | null, key: keyof CharacterConfigRow, fallback: number): number {
  if (!config) return fallback;
  const val = config[key];
  return typeof val === "number" ? val : fallback;
}

type SliderBlockProps = {
  label: string;
  question: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (val: number) => void;
};

function SliderBlock({ label, question, leftLabel, rightLabel, value, onChange }: SliderBlockProps) {
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text c="dimmed" size="xs">{leftLabel}</Text>
        <Text c="dimmed" size="xs">{rightLabel}</Text>
      </Group>
      <Text fw={500} size="sm">{label} — {question}</Text>
      <Slider
        label={(v) => String(v)}
        marks={[
          { value: 1, label: "1" },
          { value: 5, label: "5" },
          { value: 10, label: "10" },
        ]}
        max={10}
        min={1}
        onChange={onChange}
        step={1}
        value={value}
      />
    </Stack>
  );
}

export function CharacterConfiguratorTab({ campaignId, worldEntryId, config }: Props) {
  const [sliders, setSliders] = useState<SliderValues>({
    heart: sliderInitial(config, "slider_heart", 5),
    soul: sliderInitial(config, "slider_soul", 5),
    mask: sliderInitial(config, "slider_mask", 5),
    wound: sliderInitial(config, "slider_wound", 5),
    bonds: sliderInitial(config, "slider_bonds", 5),
    code: sliderInitial(config, "slider_code", 5),
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const [debouncedSliders] = useDebouncedValue(sliders, 150);
  const generated = useMemo(() => generateConfig(debouncedSliders), [debouncedSliders]);

  const setSlider = (key: keyof SliderValues) => (val: number) =>
    setSliders((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    setSaveError(null);
    startSaving(async () => {
      const result = await saveCharacterConfig(campaignId, worldEntryId, sliders, generated);
      if (!result.ok) setSaveError(result.error);
    });
  };

  return (
    <Grid gutter="xl">
      {/* ── Panel suwaków ─────────────────────────────────────────────── */}
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Stack gap="xl">
          <Paper p="md" radius="md" withBorder>
            <Stack gap="lg">
              <Title order={5}>Suwaki bazowe</Title>

              <SliderBlock
                label="SERCE"
                leftLabel="Strach"
                onChange={setSlider("heart")}
                question="Co cię napędza?"
                rightLabel="Pragnienie"
                value={sliders.heart}
              />
              <SliderBlock
                label="DUSZA"
                leftLabel="Ja"
                onChange={setSlider("soul")}
                question="Komu służysz?"
                rightLabel="Inni"
                value={sliders.soul}
              />
              <SliderBlock
                label="MASKA"
                leftLabel="Cień"
                onChange={setSlider("mask")}
                question="Jak działasz w świecie?"
                rightLabel="Światło"
                value={sliders.mask}
              />
              <SliderBlock
                label="RANA"
                leftLabel="Wyparcie"
                onChange={setSlider("wound")}
                question="Co nosisz w sobie?"
                rightLabel="Integracja"
                value={sliders.wound}
              />

              <Divider />

              <Button
                onClick={() => setAdvancedOpen((o) => !o)}
                size="xs"
                variant="subtle"
              >
                {advancedOpen ? "Ukryj zaawansowane" : "Pokaż zaawansowane suwaki"}
              </Button>

              <Collapse in={advancedOpen}>
                <Stack gap="lg" pt="xs">
                  <SliderBlock
                    label="WIĘZY"
                    leftLabel="Samotnik"
                    onChange={setSlider("bonds")}
                    question="Jak traktujesz relacje?"
                    rightLabel="Zależny"
                    value={sliders.bonds ?? 5}
                  />
                  <SliderBlock
                    label="KODEKS"
                    leftLabel="Praworządny"
                    onChange={setSlider("code")}
                    question="Jaką masz etykę?"
                    rightLabel="Chaotyczny"
                    value={sliders.code ?? 5}
                  />
                </Stack>
              </Collapse>
            </Stack>
          </Paper>

          {saveError ? (
            <Text c="red" size="sm">{saveError}</Text>
          ) : null}

          <Group justify="flex-end">
            <Button loading={isSaving} onClick={handleSave}>
              Zapisz konfigurację
            </Button>
          </Group>
        </Stack>
      </Grid.Col>

      {/* ── Panel podglądu ─────────────────────────────────────────────── */}
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Stack gap="md">
          <Group gap="sm" wrap="wrap">
            <Badge color="violet" size="xl" variant="filled">
              {generated.archetype_name}
            </Badge>
            <Badge size="sm" variant="light">
              {generated.base_type}
            </Badge>
          </Group>

          <Text fs="italic" size="lg">
            &bdquo;{generated.tagline}&rdquo;
          </Text>

          <Divider />

          <Grid gutter="sm">
            <Grid.Col span={6}>
              <Card padding="md" radius="md" shadow="xs" withBorder>
                <Text fw={700} mb={4} size="sm">Rdzeń: Pragnienie</Text>
                <Text size="sm">{generated.core_desire}</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card padding="md" radius="md" shadow="xs" withBorder>
                <Text fw={700} mb={4} size="sm">Rdzeń: Strach</Text>
                <Text size="sm">{generated.core_fear}</Text>
              </Card>
            </Grid.Col>
          </Grid>

          <Accordion variant="separated">
            <Accordion.Item value="wound">
              <Accordion.Control>Rana i przeszłość</Accordion.Control>
              <Accordion.Panel>
                <Text size="sm">{generated.wound_text}</Text>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="gift-shadow">
              <Accordion.Control>Dar i Cień</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <Text fw={600} size="sm">Dar</Text>
                  <Text size="sm">{generated.gift_text}</Text>
                  <Divider my={4} />
                  <Text fw={600} size="sm">Cień</Text>
                  <Text size="sm">{generated.shadow_text}</Text>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="arc">
              <Accordion.Control>Łuk narracyjny</Accordion.Control>
              <Accordion.Panel>
                <Text size="sm">{generated.narrative_arc}</Text>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="conflicts">
              <Accordion.Control>Konflikty wewnętrzne</Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing="xs">
                  {generated.conflicts.map((c, i) => (
                    <List.Item key={i}>{c}</List.Item>
                  ))}
                </List>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="hooks">
              <Accordion.Control>Haczyki fabularne</Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing="xs">
                  {generated.hooks.map((h, i) => (
                    <List.Item key={i}>{h}</List.Item>
                  ))}
                </List>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="inspirations">
              <Accordion.Control>Inspiracje</Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing="xs">
                  {generated.inspirations.map((ins, i) => (
                    <List.Item key={i}>{ins}</List.Item>
                  ))}
                </List>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
