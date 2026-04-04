"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  type FabulaKind,
  type GameSystem,
  isFabulaKind
} from "@/lib/fabula";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SYSTEMS: GameSystem[] = ["dnd5e", "coc", "other"];

function isGameSystem(value: string): value is GameSystem {
  return SYSTEMS.includes(value as GameSystem);
}

export type CreateFabulaState = { error?: string } | null;

export async function createFabula(
  _prev: CreateFabulaState,
  formData: FormData
): Promise<CreateFabulaState> {
  const supabase = createSupabaseServerClient();
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

  const { data: campaign, error: cErr } = await supabase
    .from("campaigns")
    .insert({
      name,
      system,
      created_by: user.id,
      fabula_kind
    })
    .select("id")
    .single();

  if (cErr || !campaign) {
    return { error: cErr?.message ?? "Nie udało się utworzyć fabuły." };
  }

  const { error: mErr } = await supabase.from("campaign_members").insert({
    campaign_id: campaign.id,
    user_id: user.id,
    role: "gm"
  });

  if (mErr) {
    return { error: mErr.message };
  }

  revalidatePath("/dashboard");
  redirect(`/campaign/${campaign.id}/settings`);
}
