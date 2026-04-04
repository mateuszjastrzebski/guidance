"use client";

import {
  Button,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput
} from "@mantine/core";
import Link from "next/link";
import { useFormState } from "react-dom";
import { useState } from "react";

import { createFabula, type CreateFabulaState } from "@/app/(app)/campaigns/actions";
import { type FabulaKind, type GameSystem, GAME_SYSTEM_OPTIONS } from "@/lib/fabula";

export function CreateFabulaForm() {
  const [state, formAction] = useFormState(createFabula, null as CreateFabulaState);
  const [fabulaKind, setFabulaKind] = useState<FabulaKind>("campaign");
  const [system, setSystem] = useState<GameSystem>("dnd5e");

  return (
    <form action={formAction}>
      <Stack gap="md">
        {state?.error ? (
          <Text c="red" size="sm">
            {state.error}
          </Text>
        ) : null}
        <TextInput
          required
          label="Nazwa fabuły"
          name="name"
          placeholder="np. Klątwa Straconych Bagien"
        />
        <input name="system" type="hidden" value={system} />
        <Select
          required
          data={GAME_SYSTEM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          label="System"
          value={system}
          onChange={(v) => setSystem((v ?? "dnd5e") as GameSystem)}
        />
        <input name="fabula_kind" type="hidden" value={fabulaKind} />
        <div>
          <Text fw={500} mb={6} size="sm">
            Typ fabuły
          </Text>
          <SegmentedControl
            fullWidth
            data={[
              { label: "Kampania", value: "campaign" },
              { label: "Jednostrzal", value: "oneshot" }
            ]}
            value={fabulaKind}
            onChange={(v) => setFabulaKind(v as FabulaKind)}
          />
        </div>
        <Button type="submit">Utwórz fabułę</Button>
        <Button color="gray" component={Link} href="/dashboard" variant="subtle">
          Anuluj
        </Button>
      </Stack>
    </form>
  );
}
