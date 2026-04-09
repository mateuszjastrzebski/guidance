import { redirect } from "next/navigation";

type CampaignInviteRedirectPageProps = {
  params: { id: string };
};

export default function CampaignInviteRedirectPage({ params }: CampaignInviteRedirectPageProps) {
  redirect(`/campaign/${params.id}/settings/invitations`);
}
