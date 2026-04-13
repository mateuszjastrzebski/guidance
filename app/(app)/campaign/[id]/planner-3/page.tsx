import { redirect } from "next/navigation";

type Planner3PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Planner3Page({ params }: Planner3PageProps) {
  const { id } = await params;
  redirect(`/campaign/${id}/planner-2`);
}
