import { redirect } from "next/navigation";

import { ScenesRosterPage } from "@/components/campaign/scenes-roster-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSceneRow } from "@/lib/scenes";

type ScenesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ScenesPage({ params }: ScenesPageProps) {
  const { id: campaignId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: sceneRows }, { data: plannerEventRows }] = await Promise.all([
    supabase
      .from("scenes")
      .select(
        "id, campaign_id, name, status, outline_sections, source_type, source_event_id, source_event_node_id, source_event_snapshot, sync_with_source, thread_id, thread_label, thread_color, character_ids, npc_ids, location_ids, created_at, updated_at, scene_session_links(session_number)"
      )
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("planner_events")
      .select("id, title, thread_label")
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: false })
  ]);

  const scenes = (sceneRows ?? []).map((row) =>
    mapSceneRow(
      row,
      (row.scene_session_links ?? []).map((link: { session_number: number }) => link.session_number)
    )
  );

  return (
    <ScenesRosterPage
      campaignId={campaignId}
      plannerEvents={(plannerEventRows ?? []).map((row) => ({
        value: row.id,
        label: row.thread_label?.trim() ? `${row.title || "Bez tytułu"} • ${row.thread_label}` : row.title || "Bez tytułu"
      }))}
      scenes={scenes}
    />
  );
}
