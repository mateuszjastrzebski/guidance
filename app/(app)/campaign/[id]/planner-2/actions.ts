"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  loadPlannerGraphFromSupabase,
  type PlannerEventRecord,
  savePlannerGraphToSupabase
} from "@/lib/planner2-persistence";
import type { Planner2ReactFlowPilotPersisted } from "@/types/planner2-react-flow-pilot";

export type LoadPlannerGraphResult =
  | {
      ok: true;
      eventRecords: PlannerEventRecord[];
      migratedFromLocal: boolean;
      payload: Planner2ReactFlowPilotPersisted;
    }
  | { ok: false; error: string };

export async function loadPlannerGraph(
  campaignId: string,
  localFallback?: Planner2ReactFlowPilotPersisted | null
): Promise<LoadPlannerGraphResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const result = await loadPlannerGraphFromSupabase(supabase, campaignId, localFallback ?? null);
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Nie udało się wczytać planera."
    };
  }
}

export async function savePlannerGraph(
  campaignId: string,
  payload: Planner2ReactFlowPilotPersisted
): Promise<{ eventRecords?: PlannerEventRecord[]; ok: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const result = await savePlannerGraphToSupabase(supabase, campaignId, payload);
    return { ok: true, eventRecords: result.eventRecords };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Nie udało się zapisać planera."
    };
  }
}
