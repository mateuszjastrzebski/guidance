import { redirect } from "next/navigation";

type CampaignInviteRedirectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignInviteRedirectPage({
  params
}: CampaignInviteRedirectPageProps) {
  const { id } = await params;
  redirect(`/campaign/${id}/settings/invitations`);
}
