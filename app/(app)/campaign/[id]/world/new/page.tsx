import { notFound } from "next/navigation";

import { WorldTemplatePickerPage } from "@/components/campaign/world-template-picker-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type WorldTemplatePickerRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function WorldTemplatePickerRoute({
  params
}: WorldTemplatePickerRouteProps) {
  const { id: campaignId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const [{ data: member }, { data: collections }] = await Promise.all([
    supabase
      .from("campaign_members")
      .select("role")
      .eq("campaign_id", campaignId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("world_collections")
      .select("id, slug, plural_name, template_key")
      .eq("campaign_id", campaignId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
  ]);

  return (
    <WorldTemplatePickerPage
      campaignId={campaignId}
      canManage={member?.role === "gm"}
      existingCollections={(collections ?? []).map((collection) => ({
        id: collection.id,
        slug: collection.slug,
        pluralName: collection.plural_name,
        templateKey: collection.template_key
      }))}
    />
  );
}
