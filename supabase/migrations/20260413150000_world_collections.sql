create table public.world_collections (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  template_key text not null,
  singular_name text not null,
  plural_name text not null,
  slug text not null,
  icon text,
  description text,
  sort_order integer not null default 0,
  is_system boolean not null default false,
  slug_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, slug)
);

create table public.world_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  collection_id uuid not null references public.world_collections(id) on delete cascade,
  name text not null,
  summary text,
  portrait_url text,
  level integer,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (level is null or level > 0)
);

alter table public.world_collections enable row level security;
alter table public.world_entries enable row level security;

create policy "world_collections_select_member"
  on public.world_collections
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "world_collections_insert_gm"
  on public.world_collections
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "world_collections_update_gm"
  on public.world_collections
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "world_collections_delete_gm"
  on public.world_collections
  for delete
  using (public.app_is_campaign_gm(campaign_id));

create policy "world_entries_select_member"
  on public.world_entries
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "world_entries_insert_gm"
  on public.world_entries
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "world_entries_update_gm"
  on public.world_entries
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "world_entries_delete_gm"
  on public.world_entries
  for delete
  using (public.app_is_campaign_gm(campaign_id));

do $$
begin
  if not exists (
    select 1
    from pg_proc
    where proname = 'set_updated_at'
      and pg_function_is_visible(oid)
  ) then
    create function public.set_updated_at()
    returns trigger language plpgsql as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end
$$;

drop trigger if exists world_collections_updated_at on public.world_collections;
create trigger world_collections_updated_at
  before update on public.world_collections
  for each row execute function public.set_updated_at();

drop trigger if exists world_entries_updated_at on public.world_entries;
create trigger world_entries_updated_at
  before update on public.world_entries
  for each row execute function public.set_updated_at();

insert into public.world_collections (
  campaign_id,
  template_key,
  singular_name,
  plural_name,
  slug,
  icon,
  description,
  sort_order,
  is_system,
  slug_locked
)
select
  c.id,
  'npc',
  'NPC',
  'NPC',
  'npcs',
  'users',
  'Postacie niezależne kampanii.',
  100,
  true,
  false
from public.campaigns c
where not exists (
  select 1
  from public.world_collections wc
  where wc.campaign_id = c.id
    and wc.template_key = 'npc'
);

insert into public.world_collections (
  campaign_id,
  template_key,
  singular_name,
  plural_name,
  slug,
  icon,
  description,
  sort_order,
  is_system,
  slug_locked
)
select
  c.id,
  'location',
  'Miejsce',
  'Miejsca',
  'miejsca',
  'map-pin',
  'Lokacje i obszary świata.',
  200,
  true,
  false
from public.campaigns c
where not exists (
  select 1
  from public.world_collections wc
  where wc.campaign_id = c.id
    and wc.template_key = 'location'
);

insert into public.world_entries (
  id,
  campaign_id,
  collection_id,
  name,
  summary,
  portrait_url,
  level,
  data,
  created_at,
  updated_at
)
select
  n.id,
  n.campaign_id,
  wc.id,
  n.name,
  n.description,
  n.portrait_url,
  n.level,
  jsonb_strip_nulls(
    jsonb_build_object(
      'legacyType', 'npc',
      'hiddenNotes', n.hidden_notes
    )
  ),
  n.created_at,
  n.created_at
from public.npcs n
join public.world_collections wc
  on wc.campaign_id = n.campaign_id
 and wc.template_key = 'npc'
where not exists (
  select 1
  from public.world_entries we
  where we.id = n.id
);

insert into public.world_entries (
  id,
  campaign_id,
  collection_id,
  name,
  summary,
  portrait_url,
  level,
  data,
  created_at,
  updated_at
)
select
  l.id,
  l.campaign_id,
  wc.id,
  l.name,
  l.description,
  null,
  null,
  jsonb_strip_nulls(
    jsonb_build_object(
      'legacyType', 'location',
      'hiddenNotes', l.hidden_notes
    )
  ),
  l.created_at,
  l.created_at
from public.locations l
join public.world_collections wc
  on wc.campaign_id = l.campaign_id
 and wc.template_key = 'location'
where not exists (
  select 1
  from public.world_entries we
  where we.id = l.id
);

alter table public.entity_links
  drop constraint if exists entity_links_entity_a_type_check,
  drop constraint if exists entity_links_entity_b_type_check,
  drop constraint if exists entity_links_check;

update public.entity_links
set entity_a_type = 'world_entry'
where entity_a_type in ('npc', 'location');

update public.entity_links
set entity_b_type = 'world_entry'
where entity_b_type in ('npc', 'location');

delete from public.entity_links
where id in (
  select doomed.id
  from (
    select
      id,
      row_number() over (
        partition by campaign_id, entity_a_type, entity_a_id, entity_b_type, entity_b_id
        order by created_at, id
      ) as rn
    from public.entity_links
  ) doomed
  where doomed.rn > 1
);

-- After npc/location -> world_entry, pairs may violate canonical order (same type, a_id must < b_id).
update public.entity_links el
set
  entity_a_type = s.new_a_type,
  entity_a_id = s.new_a_id,
  entity_b_type = s.new_b_type,
  entity_b_id = s.new_b_id
from (
  select
    id,
    entity_b_type as new_a_type,
    entity_b_id as new_a_id,
    entity_a_type as new_b_type,
    entity_a_id as new_b_id
  from public.entity_links
  where not (
    entity_a_type < entity_b_type
    or (entity_a_type = entity_b_type and entity_a_id < entity_b_id)
  )
) s
where el.id = s.id;

alter table public.entity_links
  add constraint entity_links_entity_a_type_check
    check (entity_a_type in ('character', 'quest', 'world_entry')),
  add constraint entity_links_entity_b_type_check
    check (entity_b_type in ('character', 'quest', 'world_entry')),
  add constraint entity_links_check
    check (
      entity_a_type < entity_b_type
      or (entity_a_type = entity_b_type and entity_a_id < entity_b_id)
    );

alter table public.entity_notes
  drop constraint if exists entity_notes_owner_type_check,
  drop constraint if exists entity_notes_context_type_check;

update public.entity_notes
set owner_type = 'world_entry'
where owner_type in ('npc', 'location');

update public.entity_notes
set context_type = 'world_entry'
where context_type in ('npc', 'location');

alter table public.entity_notes
  add constraint entity_notes_owner_type_check
    check (owner_type in ('character', 'quest', 'world_entry')),
  add constraint entity_notes_context_type_check
    check (context_type in ('character', 'quest', 'world_entry'));

alter table public.player_infos
  add column if not exists world_entry_id uuid references public.world_entries(id) on delete cascade;

update public.player_infos
set world_entry_id = coalesce(npc_id, location_id)
where world_entry_id is null
  and (npc_id is not null or location_id is not null);

create index if not exists player_infos_world_entry_id_idx
  on public.player_infos (world_entry_id);
