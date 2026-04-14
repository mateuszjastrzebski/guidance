import type { SupabaseClient } from "@supabase/supabase-js";

export type WorldTemplateKey = "npc" | "location" | "organization";

export type WorldFieldType = "text" | "textarea" | "number";

export type WorldFieldDefinition = {
  key: string;
  label: string;
  type: WorldFieldType;
  placeholder?: string;
};

export type WorldTemplateDefinition = {
  templateKey: WorldTemplateKey;
  singularName: string;
  pluralName: string;
  defaultSlug: string;
  icon: string;
  description: string;
  supportsLevel: boolean;
  fields: WorldFieldDefinition[];
};

export type WorldCollection = {
  id: string;
  campaign_id: string;
  template_key: string;
  singular_name: string;
  plural_name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_system: boolean;
  slug_locked: boolean;
  created_at: string;
  updated_at: string;
};

export type WorldEntry = {
  id: string;
  campaign_id: string;
  collection_id: string;
  name: string;
  summary: string | null;
  portrait_url: string | null;
  level: number | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WorldNavCollection = Pick<
  WorldCollection,
  "id" | "slug" | "plural_name" | "icon" | "sort_order"
>;

export const WORLD_TEMPLATE_DEFINITIONS: Record<WorldTemplateKey, WorldTemplateDefinition> = {
  npc: {
    templateKey: "npc",
    singularName: "NPC",
    pluralName: "NPC",
    defaultSlug: "npcs",
    icon: "users",
    description: "Postacie niezależne kampanii.",
    supportsLevel: true,
    fields: [
      {
        key: "role",
        label: "Rola",
        type: "text",
        placeholder: "np. Karczmarz, wróżka, herszt bandy"
      },
      {
        key: "motivation",
        label: "Motywacja",
        type: "textarea",
        placeholder: "Co naprawdę chce osiągnąć?"
      }
    ]
  },
  location: {
    templateKey: "location",
    singularName: "Miejsce",
    pluralName: "Miejsca",
    defaultSlug: "miejsca",
    icon: "map-pin",
    description: "Lokacje i obszary świata.",
    supportsLevel: false,
    fields: [
      {
        key: "region",
        label: "Region",
        type: "text",
        placeholder: "np. Północna Marchia"
      },
      {
        key: "atmosphere",
        label: "Atmosfera",
        type: "textarea",
        placeholder: "Jakie wrażenie robi to miejsce?"
      }
    ]
  },
  organization: {
    templateKey: "organization",
    singularName: "Organizacja",
    pluralName: "Organizacje",
    defaultSlug: "organizacje",
    icon: "building-bank",
    description: "Frakcje, gildie, zakony i inne grupy wpływu.",
    supportsLevel: false,
    fields: [
      {
        key: "scope",
        label: "Zasięg",
        type: "text",
        placeholder: "np. lokalny, królewski, międzykontynentalny"
      },
      {
        key: "goal",
        label: "Cel",
        type: "textarea",
        placeholder: "Jaką agendę ma organizacja?"
      }
    ]
  }
};

export function getWorldTemplateDefinition(templateKey: string): WorldTemplateDefinition | null {
  if (templateKey in WORLD_TEMPLATE_DEFINITIONS) {
    return WORLD_TEMPLATE_DEFINITIONS[templateKey as WorldTemplateKey];
  }
  return null;
}

export function slugifyWorldName(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "kolekcja";
}

export async function fetchCampaignWorldCollections(
  supabase: SupabaseClient,
  campaignId: string
): Promise<WorldCollection[]> {
  const { data } = await supabase
    .from("world_collections")
    .select(
      "id, campaign_id, template_key, singular_name, plural_name, slug, icon, description, sort_order, is_system, slug_locked, created_at, updated_at"
    )
    .eq("campaign_id", campaignId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (data as WorldCollection[] | null) ?? [];
}

export async function fetchCampaignWorldEntries(
  supabase: SupabaseClient,
  campaignId: string
): Promise<Array<WorldEntry & { world_collections?: { plural_name: string; slug: string } | null }>> {
  const { data } = await supabase
    .from("world_entries")
    .select(
      "id, campaign_id, collection_id, name, summary, portrait_url, level, data, created_at, updated_at, world_collections(plural_name, slug)"
    )
    .eq("campaign_id", campaignId)
    .order("name", { ascending: true });

  return (
    data as Array<WorldEntry & { world_collections?: { plural_name: string; slug: string } | null }> | null
  ) ?? [];
}
