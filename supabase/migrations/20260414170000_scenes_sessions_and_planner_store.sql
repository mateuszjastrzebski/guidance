create table if not exists public.planner_graph_state (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  nodes_json jsonb not null default '[]'::jsonb,
  edges_json jsonb not null default '[]'::jsonb,
  lane_orders_json jsonb not null default '{"byCharacter":{},"byThread":{}}'::jsonb,
  layouts_json jsonb not null default '{}'::jsonb,
  version integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.planner_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  planner_node_id text not null,
  title text not null default '',
  co text not null default '',
  dlaczego text not null default '',
  thread_id uuid references public.quests(id) on delete set null,
  thread_label text,
  thread_color text,
  character_ids uuid[] not null default '{}',
  npc_ids uuid[] not null default '{}',
  location_ids uuid[] not null default '{}',
  sort_position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, planner_node_id)
);

alter table public.scenes
  add column if not exists source_type text,
  add column if not exists source_event_id uuid references public.planner_events(id) on delete set null,
  add column if not exists source_event_node_id text,
  add column if not exists sync_with_source boolean not null default false,
  add column if not exists outline_sections jsonb not null default '[]'::jsonb,
  add column if not exists source_event_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists thread_id uuid references public.quests(id) on delete set null,
  add column if not exists thread_label text,
  add column if not exists thread_color text,
  add column if not exists character_ids uuid[] not null default '{}',
  add column if not exists npc_ids uuid[] not null default '{}',
  add column if not exists location_ids uuid[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();

alter table public.scenes
  alter column description set default '';

update public.scenes
set outline_sections = jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid()::text, 'title', 'Wstęp', 'body', '', 'order', 0),
  jsonb_build_object('id', gen_random_uuid()::text, 'title', 'Rozwinięcie', 'body', coalesce(description, ''), 'order', 1),
  jsonb_build_object('id', gen_random_uuid()::text, 'title', 'Zakończenie', 'body', '', 'order', 2)
)
where jsonb_typeof(outline_sections) is distinct from 'array'
   or jsonb_array_length(outline_sections) = 0;

create table if not exists public.scene_session_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  scene_id uuid not null references public.scenes(id) on delete cascade,
  session_number integer not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scene_id, session_number)
);

create index if not exists planner_events_campaign_id_idx
  on public.planner_events(campaign_id);

create index if not exists planner_events_thread_id_idx
  on public.planner_events(thread_id);

create index if not exists planner_events_updated_at_idx
  on public.planner_events(updated_at desc);

create index if not exists scenes_source_event_id_idx
  on public.scenes(source_event_id);

create index if not exists scenes_thread_id_idx
  on public.scenes(thread_id);

create index if not exists scenes_updated_at_idx
  on public.scenes(updated_at desc);

create index if not exists scene_session_links_campaign_session_idx
  on public.scene_session_links(campaign_id, session_number, position);

create index if not exists scene_session_links_scene_id_idx
  on public.scene_session_links(scene_id);

alter table public.planner_graph_state enable row level security;
alter table public.planner_events enable row level security;
alter table public.scene_session_links enable row level security;

create policy "planner_graph_state_select_member"
  on public.planner_graph_state
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "planner_graph_state_insert_gm"
  on public.planner_graph_state
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "planner_graph_state_update_gm"
  on public.planner_graph_state
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "planner_graph_state_delete_gm"
  on public.planner_graph_state
  for delete
  using (public.app_is_campaign_gm(campaign_id));

create policy "planner_events_select_member"
  on public.planner_events
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "planner_events_insert_gm"
  on public.planner_events
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "planner_events_update_gm"
  on public.planner_events
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "planner_events_delete_gm"
  on public.planner_events
  for delete
  using (public.app_is_campaign_gm(campaign_id));

create policy "scene_session_links_select_member"
  on public.scene_session_links
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "scene_session_links_insert_gm"
  on public.scene_session_links
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "scene_session_links_update_gm"
  on public.scene_session_links
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "scene_session_links_delete_gm"
  on public.scene_session_links
  for delete
  using (public.app_is_campaign_gm(campaign_id));

drop trigger if exists set_updated_at_planner_graph_state on public.planner_graph_state;
create trigger set_updated_at_planner_graph_state
  before update on public.planner_graph_state
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_planner_events on public.planner_events;
create trigger set_updated_at_planner_events
  before update on public.planner_events
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_scenes on public.scenes;
create trigger set_updated_at_scenes
  before update on public.scenes
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_scene_session_links on public.scene_session_links;
create trigger set_updated_at_scene_session_links
  before update on public.scene_session_links
  for each row execute function public.set_updated_at();
