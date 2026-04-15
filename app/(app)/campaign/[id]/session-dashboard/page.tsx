import { Container } from "@mantine/core";

import { SessionDashboardShell } from "@/components/campaign/session-dashboard-shell";
import { mapSceneRow } from "@/lib/scenes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SessionDashboardPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ mode?: string; session?: string }>;
};

export default async function SessionDashboardPage({
  params,
  searchParams
}: SessionDashboardPageProps) {
  const { id: campaignId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createSupabaseServerClient();
  const [
    { data: sessionRowsWithTitle, error: sessionRowsWithTitleError },
    { data: sceneRows },
    { data: characterRows },
    { data: questRows },
    { data: worldRows },
    { data: plannerEventRows }
  ] = await Promise.all([
    supabase
      .from("session_captures")
      .select("session_number, created_at, title")
      .eq("campaign_id", campaignId)
      .order("session_number", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("scenes")
      .select(
        "id, campaign_id, name, status, outline_sections, source_type, source_event_id, source_event_node_id, source_event_snapshot, sync_with_source, thread_id, thread_label, thread_color, character_ids, npc_ids, location_ids, created_at, updated_at, scene_session_links(session_number)"
      )
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: false }),
    supabase.from("characters").select("id, name").eq("campaign_id", campaignId).order("name"),
    supabase
      .from("quests")
      .select("id, name, key_character_ids, key_npc_ids")
      .eq("campaign_id", campaignId)
      .order("name"),
    supabase
      .from("world_entries")
      .select("id, name, world_collections!inner(template_key, singular_name)")
      .eq("campaign_id", campaignId)
      .order("name"),
    supabase
      .from("planner_events")
      .select("id, title, thread_label")
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: false })
  ]);

  const sessionRows =
    sessionRowsWithTitleError && isMissingTitleColumnError(sessionRowsWithTitleError.message)
      ? (
          await supabase
            .from("session_captures")
            .select("session_number, created_at")
            .eq("campaign_id", campaignId)
            .order("session_number", { ascending: false })
            .order("created_at", { ascending: false })
        ).data?.map((row) => ({ ...row, title: null })) ?? []
      : (sessionRowsWithTitle ?? []);

  const sessionMap = new Map<number, { created_at: string | null; title: string | null }>();
  for (const row of sessionRows) {
    if (!sessionMap.has(row.session_number)) {
      sessionMap.set(row.session_number, {
        created_at: row.created_at,
        title: row.title
      });
    }
  }

  const sessions = Array.from(sessionMap.entries()).map(([number, row]) => ({
    number,
    label: row.title?.trim() || `Sesja ${number}`,
    subtitle: formatSessionSubtitle(row.created_at)
  }));

  const mode = resolvedSearchParams?.mode === "combat" ? "combat" : "exploration";
  const requestedSession = Number(resolvedSearchParams?.session);
  const initialSessionNumber =
    Number.isFinite(requestedSession) && sessions.some((session) => session.number === requestedSession)
      ? requestedSession
      : sessions[0]?.number ?? null;

  return (
    <Container pb="xl" pt="md" size="xl">
      <SessionDashboardShell
        campaignId={campaignId}
        characters={(characterRows ?? []).map((row) => ({ id: row.id, name: row.name }))}
        initialMode={mode}
        initialSessionNumber={initialSessionNumber}
        plannerEvents={(plannerEventRows ?? []).map((row) => ({
          id: row.id,
          label: row.thread_label?.trim()
            ? `${row.title || "Bez tytułu"} • ${row.thread_label}`
            : row.title || "Bez tytułu"
        }))}
        quests={(questRows ?? []).map((row) => ({
          id: row.id,
          key_character_ids: row.key_character_ids ?? [],
          key_npc_ids: row.key_npc_ids ?? [],
          name: row.name
        }))}
        scenes={(sceneRows ?? []).map((row) =>
          mapSceneRow(
            row,
            (row.scene_session_links ?? []).map((link: { session_number: number }) => link.session_number)
          )
        )}
        sessions={sessions}
        worldEntries={(worldRows ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          templateKey:
            firstWorldCollectionMeta(
              row.world_collections as { template_key?: string } | { template_key?: string }[] | null
            )?.template_key ?? "world"
        }))}
      />
    </Container>
  );
}

function formatSessionSubtitle(rawValue: string | null) {
  if (!rawValue) {
    return "Bez daty";
  }

  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) {
    return "Bez daty";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function isMissingTitleColumnError(message: string) {
  return message.includes("title") && message.includes("session_captures");
}

function firstWorldCollectionMeta(
  value: { template_key?: string } | { template_key?: string }[] | null
) {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
