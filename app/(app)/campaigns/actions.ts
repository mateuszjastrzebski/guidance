"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  type FabulaKind,
  type GameSystem,
  isFabulaKind
} from "@/lib/fabula";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

const SYSTEMS: GameSystem[] = ["dnd5e", "coc", "other"];

function isGameSystem(value: string): value is GameSystem {
  return SYSTEMS.includes(value as GameSystem);
}

export type CreateFabulaState = { error?: string } | null;

export async function createFabula(
  _prev: CreateFabulaState,
  formData: FormData
): Promise<CreateFabulaState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Musisz być zalogowany." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const system = String(formData.get("system") ?? "");
  const fabula_kind_raw = String(formData.get("fabula_kind") ?? "");

  if (!name) {
    return { error: "Podaj nazwę fabuły." };
  }

  if (!isGameSystem(system)) {
    return { error: "Wybierz poprawny system." };
  }

  if (!isFabulaKind(fabula_kind_raw)) {
    return { error: "Wybierz typ fabuły." };
  }

  const fabula_kind: FabulaKind = fabula_kind_raw;

  // RPC `create_fabula_bootstrap`: SECURITY DEFINER — INSERT do `campaigns` i `campaign_members` w jednej transakcji,
  // z `created_by` / `user_id` wymuszonymi na `auth.uid()`. To nie zastępuje RLS przy zwykłych SELECT-ach z klienta.
  const { data: campaignId, error: cErr } = await supabase.rpc(
    "create_fabula_bootstrap",
    {
      p_name: name,
      p_system: system,
      p_fabula_kind: fabula_kind
    }
  );

  if (cErr || !campaignId) {
    return { error: cErr?.message ?? "Nie udało się utworzyć fabuły." };
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "campaign_created",
    properties: {
      campaign_id: campaignId,
      campaign_name: name,
      system,
      fabula_kind,
    },
  });
  await posthog.shutdown();

  revalidatePath("/dashboard");
  redirect(`/campaign/${campaignId}`);
}
