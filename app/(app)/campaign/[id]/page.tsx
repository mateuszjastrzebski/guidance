import { redirect } from "next/navigation";

type CampaignRootPageProps = {
  params: { id: string };
};

export default function CampaignRootPage({ params }: CampaignRootPageProps) {
  redirect(`/campaign/${params.id}/settings`);
}
