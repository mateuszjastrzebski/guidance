import { redirect } from "next/navigation";

import {
  ThreadsRosterPage,
  type ThreadKeyCastMember,
  type ThreadListItem
} from "@/components/campaign/threads-roster-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { plannerAccentColorFromThreadId } from "@/types/planner2-react-flow-pilot";

function asUuidArray(v: unknown): string[] {
  if (!Array.isArray(v)) {
    return [];
  }
  return v.filter((x): x is string => typeof x === "string");
}

type ThreadsRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ThreadsRoute({ params }: ThreadsRouteProps) {
  const { id: campaignId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberRow } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isGm = memberRow?.role === "gm";

  const { data: questRows, error } = await supabase
    .from("quests")
    .select("id, name, description, status, key_npc_ids, key_character_ids")
    .eq("campaign_id", campaignId)
    .order("name", { ascending: true });

  if (error) {
    return (
      <ThreadsRosterPage
        campaignId={campaignId}
        canAddThread={isGm}
        emptyMessage=""
        errorMessage={`Nie udało się wczytać wątków: ${error.message}`}
        threads={[]}
      />
    );
  }

  const npcIdSet = new Set<string>();
  const characterIdSet = new Set<string>();
  for (const r of questRows ?? []) {
    for (const id of asUuidArray(r.key_npc_ids)) {
      npcIdSet.add(id);
    }
    for (const id of asUuidArray(r.key_character_ids)) {
      characterIdSet.add(id);
    }
  }

  const npcMap = new Map<string, { name: string; portrait_url: string | null }>();
  if (npcIdSet.size > 0) {
    const { data: npcRows, error: npcErr } = await supabase
      .from("npcs")
      .select("id, name, portrait_url")
      .eq("campaign_id", campaignId)
      .in("id", [...npcIdSet]);
    if (!npcErr && npcRows) {
      for (const n of npcRows) {
        npcMap.set(n.id, { name: n.name, portrait_url: n.portrait_url });
      }
    }
  }

  const characterMap = new Map<string, { name: string; portrait_url: string | null }>();
  if (characterIdSet.size > 0) {
    const { data: charRows, error: charErr } = await supabase
      .from("characters")
      .select("id, name, portrait_url")
      .eq("campaign_id", campaignId)
      .in("id", [...characterIdSet]);
    if (!charErr && charRows) {
      for (const c of charRows) {
        characterMap.set(c.id, { name: c.name, portrait_url: c.portrait_url });
      }
    }
  }

  const threads: ThreadListItem[] = (questRows ?? []).map((r) => {
    const keyCast: ThreadKeyCastMember[] = [];
    for (const id of asUuidArray(r.key_npc_ids)) {
      const row = npcMap.get(id);
      if (row) {
        keyCast.push({
          id,
          kind: "npc",
          name: row.name,
          portrait_url: row.portrait_url
        });
      }
    }
    for (const id of asUuidArray(r.key_character_ids)) {
      const row = characterMap.get(id);
      if (row) {
        keyCast.push({
          id,
          kind: "player",
          name: row.name,
          portrait_url: row.portrait_url
        });
      }
    }
    return {
      accentColor: plannerAccentColorFromThreadId(r.id),
      description: r.description,
      id: r.id,
      keyCast,
      name: r.name,
      status: r.status
    };
  });

  const emptyMessage = isGm
    ? "Brak wątków w tej kampanii. Dodaj pierwszy albo utwórz go z planera (tablica)."
    : "Nie ma jeszcze wątków widocznych w tej kampanii.";

  return (
    <ThreadsRosterPage
      campaignId={campaignId}
      canAddThread={isGm}
      emptyMessage={emptyMessage}
      threads={threads}
    />
  );
}
