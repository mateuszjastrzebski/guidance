import { redirect } from "next/navigation";

type CampaignDashboardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignDashboardPage({ params }: CampaignDashboardPageProps) {
  const { id } = await params;
  redirect(`/campaign/${id}/planner-2`);
}
