"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getWorldTemplateDefinition,
  slugifyWorldName,
  type WorldCollection,
  type WorldFieldDefinition,
  type WorldTemplateKey
} from "@/lib/world";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

async function requireGmMembership(campaignId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Musisz być zalogowany." as const, supabase: null };
  }

  const { data: member, error } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !member) {
    return { error: "Nie jesteś członkiem tej kampanii." as const, supabase: null };
  }

  if (member.role !== "gm") {
    return { error: "Tylko MG może edytować świat." as const, supabase: null };
  }

  return { error: null, supabase };
}

export type CreateWorldCollectionResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function createWorldCollectionFromTemplate(
  campaignId: string,
  templateKey: WorldTemplateKey
): Promise<CreateWorldCollectionResult> {
  if (!isUuid(campaignId)) return { ok: false, error: "Nieprawidłowa kampania." };

  const template = getWorldTemplateDefinition(templateKey);
  if (!template) return { ok: false, error: "Nieznany szablon." };

  const gm = await requireGmMembership(campaignId);
  if (gm.error || !gm.supabase) return { ok: false, error: gm.error };
  const supabase = gm.supabase;

  const { data: existing } = await supabase
    .from("world_collections")
    .select("slug")
    .eq("campaign_id", campaignId)
    .eq("template_key", templateKey)
    .eq("is_system", true)
    .maybeSingle();

  if (existing?.slug) {
    return { ok: true, slug: existing.slug };
  }

  const baseSlug = slugifyWorldName(template.defaultSlug || template.pluralName);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { data: taken } = await supabase
      .from("world_collections")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("slug", slug)
      .maybeSingle();

    if (!taken) break;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const { data: lastCollection } = await supabase
    .from("world_collections")
    .select("sort_order")
    .eq("campaign_id", campaignId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("world_collections").insert({
    campaign_id: campaignId,
    template_key: template.templateKey,
    singular_name: template.singularName,
    plural_name: template.pluralName,
    slug,
    icon: template.icon,
    description: template.description,
    sort_order: (lastCollection?.sort_order ?? 0) + 100,
    is_system: false,
    slug_locked: false
  });

  if (error) {
    return { ok: false, error: error.message ?? "Nie udało się utworzyć kolekcji." };
  }

  revalidatePath(`/campaign/${campaignId}`, "layout");
  return { ok: true, slug };
}

export type UpdateWorldCollectionResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function updateWorldCollectionSettings(
  campaignId: string,
  collectionId: string,
  input: {
    singularName: string;
    pluralName: string;
    slug: string;
    icon: string;
    description: string;
    slugLocked: boolean;
  }
): Promise<UpdateWorldCollectionResult> {
  if (!isUuid(campaignId) || !isUuid(collectionId)) {
    return { ok: false, error: "Nieprawidłowe dane kolekcji." };
  }

  const gm = await requireGmMembership(campaignId);
  if (gm.error || !gm.supabase) return { ok: false, error: gm.error };
  const supabase = gm.supabase;

  const { data: current, error: currentError } = await supabase
    .from("world_collections")
    .select("id, slug")
    .eq("id", collectionId)
    .eq("campaign_id", campaignId)
    .single();

  if (currentError || !current) {
    return { ok: false, error: "Nie znaleziono kolekcji." };
  }

  const nextSlug = slugifyWorldName(input.slug || input.pluralName);
  const { data: collision } = await supabase
    .from("world_collections")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("slug", nextSlug)
    .neq("id", collectionId)
    .maybeSingle();

  if (collision) {
    return { ok: false, error: "Taki adres kolekcji już istnieje." };
  }

  const { error } = await supabase
    .from("world_collections")
    .update({
      singular_name: input.singularName.trim(),
      plural_name: input.pluralName.trim(),
      slug: nextSlug,
      icon: input.icon.trim() || null,
      description: input.description.trim() || null,
      slug_locked: input.slugLocked
    })
    .eq("id", collectionId)
    .eq("campaign_id", campaignId);

  if (error) {
    return { ok: false, error: error.message ?? "Nie udało się zapisać kolekcji." };
  }

  revalidatePath(`/campaign/${campaignId}`, "layout");
  revalidatePath(`/campaign/${campaignId}/world/${current.slug}`);
  revalidatePath(`/campaign/${campaignId}/world/${nextSlug}`);
  return { ok: true, slug: nextSlug };
}

function extractFieldPayload(
  fields: WorldFieldDefinition[],
  values: Record<string, string>
): Record<string, string | number> {
  const payload: Record<string, string | number> = {};

  for (const field of fields) {
    const raw = values[field.key]?.trim();
    if (!raw) continue;
    payload[field.key] = field.type === "number" ? Number(raw) : raw;
  }

  return payload;
}

export type CreateWorldEntryResult =
  | { ok: true; entryId: string }
  | { ok: false; error: string };

export async function createWorldEntry(
  campaignId: string,
  collection: WorldCollection,
  values: Record<string, string>
): Promise<CreateWorldEntryResult> {
  if (!isUuid(campaignId) || !isUuid(collection.id)) {
    return { ok: false, error: "Nieprawidłowe dane wpisu." };
  }

  const gm = await requireGmMembership(campaignId);
  if (gm.error || !gm.supabase) return { ok: false, error: gm.error };
  const supabase = gm.supabase;
  const template = getWorldTemplateDefinition(collection.template_key);
  if (!template) return { ok: false, error: "Nieznany szablon kolekcji." };

  const name = values.name?.trim();
  if (!name) return { ok: false, error: `Podaj nazwę: ${collection.singular_name}.` };

  const summary = values.summary?.trim() || null;
  const portraitUrl = values.portrait_url?.trim() || null;
  const levelRaw = values.level?.trim() || "";
  let level: number | null = null;

  if (template.supportsLevel && levelRaw) {
    const parsed = Number(levelRaw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { ok: false, error: "Poziom musi być dodatnią liczbą całkowitą." };
    }
    level = parsed;
  }

  const { data, error } = await supabase
    .from("world_entries")
    .insert({
      campaign_id: campaignId,
      collection_id: collection.id,
      name,
      summary,
      portrait_url: portraitUrl,
      level,
      data: extractFieldPayload(template.fields, values)
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nie udało się utworzyć wpisu." };
  }

  revalidatePath(`/campaign/${campaignId}`, "layout");
  revalidatePath(`/campaign/${campaignId}/world/${collection.slug}`);
  return { ok: true, entryId: data.id };
}

export type UpdateWorldEntryResult = { ok: true } | { ok: false; error: string };

export async function updateWorldEntry(
  campaignId: string,
  entryId: string,
  collection: WorldCollection,
  values: Record<string, string>
): Promise<UpdateWorldEntryResult> {
  if (!isUuid(campaignId) || !isUuid(entryId)) {
    return { ok: false, error: "Nieprawidłowe dane wpisu." };
  }

  const gm = await requireGmMembership(campaignId);
  if (gm.error || !gm.supabase) return { ok: false, error: gm.error };
  const supabase = gm.supabase;
  const template = getWorldTemplateDefinition(collection.template_key);
  if (!template) return { ok: false, error: "Nieznany szablon kolekcji." };

  const name = values.name?.trim();
  if (!name) return { ok: false, error: `Podaj nazwę: ${collection.singular_name}.` };

  const summary = values.summary?.trim() || null;
  const portraitUrl = values.portrait_url?.trim() || null;
  const levelRaw = values.level?.trim() || "";
  let level: number | null = null;

  if (template.supportsLevel && levelRaw) {
    const parsed = Number(levelRaw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { ok: false, error: "Poziom musi być dodatnią liczbą całkowitą." };
    }
    level = parsed;
  }

  const { error } = await supabase
    .from("world_entries")
    .update({
      name,
      summary,
      portrait_url: portraitUrl,
      level,
      data: extractFieldPayload(template.fields, values)
    })
    .eq("id", entryId)
    .eq("campaign_id", campaignId)
    .eq("collection_id", collection.id);

  if (error) {
    return { ok: false, error: error.message ?? "Nie udało się zapisać wpisu." };
  }

  revalidatePath(`/campaign/${campaignId}`, "layout");
  revalidatePath(`/campaign/${campaignId}/world/${collection.slug}`);
  revalidatePath(`/campaign/${campaignId}/world/${collection.slug}/${entryId}`);
  return { ok: true };
}
