"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type CreateNpcResult = { error?: string };

export async function createNpc(formData: FormData): Promise<CreateNpcResult> {
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const levelRaw = String(formData.get("level") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!isUuid(campaignId)) {
    return { error: "Nieprawidłowa kampania." };
  }

  if (!name) {
    return { error: "Podaj nazwę NPC." };
  }

  let level: number | null = null;
  if (levelRaw) {
    const n = Number(levelRaw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      return { error: "Poziom musi być dodatnią liczbą całkowitą." };
    }
    level = n;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Musisz być zalogowany." };
  }

  const { data: member, error: memberErr } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr || !member) {
    return { error: "Nie jesteś członkiem tej kampanii." };
  }

  if (member.role !== "gm") {
    return { error: "Tylko MG może dodać NPC." };
  }

  const { error: insertErr } = await supabase.from("npcs").insert({
    campaign_id: campaignId,
    name,
    description,
    level,
    portrait_url: null,
    hidden_notes: null
  });

  if (insertErr) {
    return { error: insertErr.message ?? "Nie udało się utworzyć NPC." };
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "npc_created",
    properties: {
      campaign_id: campaignId,
      npc_name: name,
      level,
    },
  });
  await posthog.shutdown();

  revalidatePath(`/campaign/${campaignId}`, "layout");
  return {};
}
