import { Container } from "@mantine/core";

import { SessionDashboardShell } from "@/components/campaign/session-dashboard-shell";
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
  const { data: sessionRowsWithTitle, error: sessionRowsWithTitleError } = await supabase
    .from("session_captures")
    .select("session_number, created_at, title")
    .eq("campaign_id", campaignId)
    .order("session_number", { ascending: false })
    .order("created_at", { ascending: false });

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
        initialMode={mode}
        initialSessionNumber={initialSessionNumber}
        sessions={sessions}
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
