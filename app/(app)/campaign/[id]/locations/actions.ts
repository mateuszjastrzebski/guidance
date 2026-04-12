"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type CreateLocationResult = { error?: string };

export async function createLocation(formData: FormData): Promise<CreateLocationResult> {
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!isUuid(campaignId)) {
    return { error: "Nieprawidłowa kampania." };
  }

  if (!name) {
    return { error: "Podaj nazwę lokacji." };
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
    return { error: "Tylko MG może dodać lokację." };
  }

  const { error: insertErr } = await supabase.from("locations").insert({
    campaign_id: campaignId,
    name,
    description,
    hidden_notes: null
  });

  if (insertErr) {
    return { error: insertErr.message ?? "Nie udało się utworzyć lokacji." };
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "location_created",
    properties: {
      campaign_id: campaignId,
      location_name: name,
    },
  });
  await posthog.shutdown();

  revalidatePath(`/campaign/${campaignId}`, "layout");
  return {};
}

export type UpdateLocationResult = { error?: string };

export async function updateLocation(
  locationId: string,
  campaignId: string,
  patch: { name?: string; description?: string | null; hidden_notes?: string | null }
): Promise<UpdateLocationResult> {
  if (!isUuid(locationId)) return { error: "Nieprawidłowe ID lokacji." };
  if (!isUuid(campaignId)) return { error: "Nieprawidłowa kampania." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { error: "Musisz być zalogowany." };

  const { error } = await supabase
    .from("locations")
    .update(patch)
    .eq("id", locationId)
    .eq("campaign_id", campaignId);

  if (error) return { error: error.message };

  revalidatePath(`/campaign/${campaignId}`, "layout");
  return {};
}
