import { redirect } from "next/navigation";

/** Fabuły są pod `/campaign/[id]` — sam `/campaign` nie ma widoku; unikamy 404 (prefetch / bookmark / stary link). */
export default function CampaignIndexPage() {
  redirect("/dashboard");
}
