"use server";

import { MOCK_DEMO_PLAYER_CHARACTERS } from "@/lib/mocks/demo-campaign-roster";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type ListCharactersForBoardResult =
  | { ok: true; characters: Array<{ id: string; name: string }> }
  | { ok: false; error: string };

export async function listCharactersForBoard(campaignId: string): Promise<ListCharactersForBoardResult> {
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
    .from("characters")
    .select("id, name")
    .eq("campaign_id", campaignId)
    .order("name", { ascending: true });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nie udało się pobrać postaci." };
  }

  const fromDb = data.map((row) => ({ id: row.id, name: row.name }));
  const fromDemo = MOCK_DEMO_PLAYER_CHARACTERS.map((c) => ({ id: c.id, name: c.name }));
  const characters = [...fromDb, ...fromDemo].sort((a, b) => a.name.localeCompare(b.name, "pl"));

  return { ok: true, characters };
}
