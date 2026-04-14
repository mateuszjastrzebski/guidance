-- entity_links: generic bidirectional relation table between campaign entities.
-- Stored in canonical order: entity_a_type < entity_b_type (alphabetically),
-- or if same type, entity_a_id <= entity_b_id (UUID string comparison).
-- This prevents duplicate rows for the same pair regardless of insertion order.
create table public.entity_links (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns(id) on delete cascade,
  entity_a_type  text not null check (entity_a_type in ('character', 'location', 'npc', 'quest')),
  entity_a_id    uuid not null,
  entity_b_type  text not null check (entity_b_type in ('character', 'location', 'npc', 'quest')),
  entity_b_id    uuid not null,
  created_at     timestamptz not null default now(),
  -- enforce canonical ordering
  check (
    entity_a_type < entity_b_type
    or (entity_a_type = entity_b_type and entity_a_id < entity_b_id)
  ),
  unique (campaign_id, entity_a_type, entity_a_id, entity_b_type, entity_b_id)
);

alter table public.entity_links enable row level security;

create policy "entity_links_select_member" on public.entity_links
  for select using (public.app_is_campaign_member(campaign_id));

create policy "entity_links_insert_gm" on public.entity_links
  for insert with check (public.app_is_campaign_gm(campaign_id));

create policy "entity_links_delete_gm" on public.entity_links
  for delete using (public.app_is_campaign_gm(campaign_id));
