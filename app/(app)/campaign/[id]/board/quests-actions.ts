"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type CreateQuestForBoardResult =
  | { ok: true; id: string; name: string }
  | { ok: false; error: string };

export type ListQuestsForBoardResult =
  | { ok: true; quests: Array<{ id: string; name: string }> }
  | { ok: false; error: string };

export async function listQuestsForBoard(campaignId: string): Promise<ListQuestsForBoardResult> {
  if (!isUuid(campaignId)) {
    return { ok: false, error: "Nieprawidłowa kampania." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Musisz być zalogowany." };
  }

  const { data, error } = await supabase
    .from("quests")
    .select("id, name")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nie udało się pobrać wątków." };
  }

  return { ok: true, quests: data };
}

export async function createQuestForBoard(
  campaignId: string,
  name?: string,
  description?: string | null
): Promise<CreateQuestForBoardResult> {
  if (!isUuid(campaignId)) {
    return { ok: false, error: "Nieprawidłowa kampania." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Musisz być zalogowany." };
  }

  const title = (name ?? "").trim() || "Nowy wątek";
  const desc = (description ?? "").trim() || null;

  const { data, error } = await supabase
    .from("quests")
    .insert({
      campaign_id: campaignId,
      name: title,
      description: desc
    })
    .select("id, name")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nie udało się utworzyć wątku." };
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "quest_created",
    properties: {
      campaign_id: campaignId,
      quest_id: data.id,
      quest_name: data.name,
    },
  });
  await posthog.shutdown();

  return { ok: true, id: data.id, name: data.name };
}

export type LinkQuestsResult = { ok: true } | { ok: false; error: string };

export async function linkQuests(
  campaignId: string,
  fromQuestId: string,
  toQuestId: string
): Promise<LinkQuestsResult> {
  if (!isUuid(campaignId) || !isUuid(fromQuestId) || !isUuid(toQuestId)) {
    return { ok: false, error: "Nieprawidłowe identyfikatory." };
  }
  if (fromQuestId === toQuestId) {
    return { ok: false, error: "Ten sam wątek." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Musisz być zalogowany." };
  }

  const { data: quests, error: qErr } = await supabase
    .from("quests")
    .select("id")
    .eq("campaign_id", campaignId)
    .in("id", [fromQuestId, toQuestId]);

  if (qErr || !quests || quests.length !== 2) {
    return { ok: false, error: "Wątki muszą należeć do tej kampanii." };
  }

  const { error } = await supabase.from("quest_thread_links").insert({
    campaign_id: campaignId,
    from_quest_id: fromQuestId,
    to_quest_id: toQuestId,
    created_by: user.id
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "quests_linked",
    properties: {
      campaign_id: campaignId,
      from_quest_id: fromQuestId,
      to_quest_id: toQuestId,
    },
  });
  await posthog.shutdown();

  return { ok: true };
}

export type GetQuestForBoardResult =
  | { ok: true; name: string; description: string | null }
  | { ok: false; error: string };

export async function getQuestForBoard(
  campaignId: string,
  questId: string
): Promise<GetQuestForBoardResult> {
  if (!isUuid(campaignId) || !isUuid(questId)) {
    return { ok: false, error: "Nieprawidłowe identyfikatory." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Musisz być zalogowany." };
  }

  const { data, error } = await supabase
    .from("quests")
    .select("name, description")
    .eq("id", questId)
    .eq("campaign_id", campaignId)
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nie znaleziono wątku." };
  }

  return { ok: true, name: data.name, description: data.description };
}

export type UpdateQuestForBoardResult = { ok: true } | { ok: false; error: string };

export async function updateQuestForBoard(
  campaignId: string,
  questId: string,
  fields: { name: string; description: string | null }
): Promise<UpdateQuestForBoardResult> {
  if (!isUuid(campaignId) || !isUuid(questId)) {
    return { ok: false, error: "Nieprawidłowe identyfikatory." };
  }

  const title = fields.name.trim();
  if (!title) {
    return { ok: false, error: "Nazwa nie może być pusta." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Musisz być zalogowany." };
  }

  const desc = (fields.description ?? "").trim() || null;

  const { error } = await supabase
    .from("quests")
    .update({ name: title, description: desc })
    .eq("id", questId)
    .eq("campaign_id", campaignId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user.id,
    event: "quest_updated",
    properties: {
      campaign_id: campaignId,
      quest_id: questId,
      quest_name: title,
    },
  });
  await posthog.shutdown();

  return { ok: true };
}
