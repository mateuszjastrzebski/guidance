import { redirect } from "next/navigation";

type Planner3PageProps = {
  params: { id: string };
};

export default function Planner3Page({ params }: Planner3PageProps) {
  redirect(`/campaign/${params.id}/planner-2`);
}
