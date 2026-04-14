import type { SupabaseClient } from "@supabase/supabase-js";

export type EntityType = "character" | "quest" | "world_entry";

export type RawEntityLink = {
  id: string;
  entity_a_type: string;
  entity_a_id: string;
  entity_b_type: string;
  entity_b_id: string;
};

export type LinkedItem = {
  linkId: string;
  id: string;
  name: string;
  href?: string;
  meta?: string;
  summary?: string | null;
};

export type LinkedItemDescriptor = Omit<LinkedItem, "linkId">;

export async function fetchCampaignEntityLinks(
  supabase: SupabaseClient,
  campaignId: string
): Promise<RawEntityLink[]> {
  const { data } = await supabase
    .from("entity_links")
    .select("id, entity_a_type, entity_a_id, entity_b_type, entity_b_id")
    .eq("campaign_id", campaignId);
  return (data as RawEntityLink[] | null) ?? [];
}

/** Returns all items of `targetType` linked to the entity identified by `currentType`/`currentId`. */
export function getLinkedItems(
  links: RawEntityLink[],
  currentType: EntityType,
  currentId: string,
  targetType: EntityType,
  itemMap: Map<string, LinkedItemDescriptor>
): LinkedItem[] {
  return links
    .filter((l) => {
      if (currentType === targetType) {
        // Same-type links: both sides are the same type, one must be currentId.
        return (
          l.entity_a_type === currentType &&
          l.entity_b_type === currentType &&
          (l.entity_a_id === currentId || l.entity_b_id === currentId)
        );
      }
      // Different-type links: canonical ordering guarantees the lower type is entity_a.
      return (
        (l.entity_a_type === currentType &&
          l.entity_a_id === currentId &&
          l.entity_b_type === targetType) ||
        (l.entity_b_type === currentType &&
          l.entity_b_id === currentId &&
          l.entity_a_type === targetType)
      );
    })
    .map((l) => {
      // Identify the target ID (the side that is NOT the current entity).
      const targetId =
        currentType === targetType
          ? l.entity_a_id === currentId
            ? l.entity_b_id
            : l.entity_a_id
          : l.entity_a_type === targetType
            ? l.entity_a_id
            : l.entity_b_id;
      const item = itemMap.get(targetId);
      return {
        linkId: l.id,
        id: targetId,
        name: item?.name ?? "",
        href: item?.href,
        meta: item?.meta,
        summary: item?.summary
      };
    })
    .filter((item) => item.name !== "");
}
