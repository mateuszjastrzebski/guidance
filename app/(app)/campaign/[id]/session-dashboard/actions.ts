"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createSessionCapture(
  campaignId: string
): Promise<{ error?: string; sessionNumber?: number }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nie zalogowany." };
  }

  const { data: latestSession, error: latestError } = await supabase
    .from("session_captures")
    .select("session_number")
    .eq("campaign_id", campaignId)
    .order("session_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return { error: latestError.message };
  }

  const nextSessionNumber = (latestSession?.session_number ?? 0) + 1;
  const insertPayload = {
    campaign_id: campaignId,
    session_number: nextSessionNumber
  };

  const { error: insertError } = await supabase.from("session_captures").insert(insertPayload);

  if (insertError) {
    return { error: insertError.message };
  }

  const { error: titleError } = await supabase
    .from("session_captures")
    .update({ title: `Sesja ${nextSessionNumber}` })
    .eq("campaign_id", campaignId)
    .eq("session_number", nextSessionNumber);

  if (titleError && !isMissingTitleColumnError(titleError.message)) {
    return { error: titleError.message };
  }

  revalidatePath(`/campaign/${campaignId}/session-dashboard`);
  return { sessionNumber: nextSessionNumber };
}

export async function updateSessionCaptureTitle(
  campaignId: string,
  sessionNumber: number,
  title: string
): Promise<{ error?: string }> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { error: "Tytuł sesji nie może być pusty." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("session_captures")
    .update({ title: trimmedTitle })
    .eq("campaign_id", campaignId)
    .eq("session_number", sessionNumber);

  if (error) {
    if (isMissingTitleColumnError(error.message)) {
      return { error: "Zastosuj najnowszą migrację bazy, aby zapisywać tytuły sesji." };
    }
    return { error: error.message };
  }

  revalidatePath(`/campaign/${campaignId}/session-dashboard`);
  return {};
}

function isMissingTitleColumnError(message: string) {
  return message.includes("title") && message.includes("session_captures");
}
