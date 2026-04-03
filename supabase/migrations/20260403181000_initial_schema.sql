create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'campaign_role') then
    create type public.campaign_role as enum ('gm', 'player', 'observer');
  end if;

  if not exists (select 1 from pg_type where typname = 'scene_status') then
    create type public.scene_status as enum ('prepared', 'improvised', 'completed', 'suspended');
  end if;

  if not exists (select 1 from pg_type where typname = 'quest_status') then
    create type public.quest_status as enum ('active', 'completed', 'suspended');
  end if;

  if not exists (select 1 from pg_type where typname = 'transcript_status') then
    create type public.transcript_status as enum ('none', 'uploading', 'processing', 'done', 'error');
  end if;
end $$;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  system text not null check (char_length(system) > 0),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_members (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.campaign_role not null,
  character_name text,
  character_id uuid,
  created_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  player_id uuid references auth.users (id) on delete set null,
  name text not null,
  description text,
  notes_gm text,
  created_at timestamptz not null default now()
);

create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  name text not null,
  description text,
  status public.scene_status not null default 'prepared',
  linked_from_scene_id uuid references public.scenes (id) on delete set null,
  session_number integer,
  created_at timestamptz not null default now()
);

create table if not exists public.npcs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  name text not null,
  description text,
  hidden_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  name text not null,
  description text,
  status public.quest_status not null default 'active',
  linked_scene_ids uuid[] not null default '{}',
  linked_knowledge_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.npc_interactions (
  id uuid primary key default gen_random_uuid(),
  npc_id uuid not null references public.npcs (id) on delete cascade,
  scene_id uuid not null references public.scenes (id) on delete cascade,
  session_number integer,
  present_character_ids uuid[] not null default '{}',
  revealed_content text,
  hidden_content text,
  gm_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_nodes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  scene_id uuid references public.scenes (id) on delete set null,
  npc_id uuid references public.npcs (id) on delete set null,
  quest_id uuid references public.quests (id) on delete set null,
  content text not null,
  summary text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id) on delete restrict
);

create table if not exists public.knowledge_unlocks (
  id uuid primary key default gen_random_uuid(),
  knowledge_node_id uuid not null references public.knowledge_nodes (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  session_number integer,
  unlocked_by uuid not null references auth.users (id) on delete restrict,
  unique (knowledge_node_id, character_id)
);

create table if not exists public.session_captures (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  session_number integer not null,
  raw_text text,
  processed boolean not null default false,
  audio_url text,
  transcript_status public.transcript_status not null default 'none',
  created_at timestamptz not null default now()
);

create table if not exists public.session_transcripts (
  id uuid primary key default gen_random_uuid(),
  session_capture_id uuid not null references public.session_captures (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  session_number integer not null,
  full_text text,
  segments jsonb not null default '[]'::jsonb,
  ai_summary text,
  suggested_nodes jsonb not null default '[]'::jsonb,
  ai_plot_hooks jsonb not null default '[]'::jsonb,
  whisper_model text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.campaign_members
  add constraint campaign_members_character_id_fkey
  foreign key (character_id) references public.characters (id) on delete set null;

create or replace function public.app_is_campaign_member(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.campaign_members cm
    where cm.campaign_id = target_campaign_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.app_is_campaign_gm(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.campaign_members cm
    where cm.campaign_id = target_campaign_id
      and cm.user_id = auth.uid()
      and cm.role = 'gm'
  );
$$;

create or replace function public.app_is_character_owner(target_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.characters c
    where c.id = target_character_id
      and c.player_id = auth.uid()
  );
$$;

comment on table public.characters is
  'Tabela bazowa zawiera notes_gm. Widoki gracza powinny korzystać z osobnej bezpiecznej projekcji lub RPC.';

comment on table public.npc_interactions is
  'Player-facing access do revealed_content powinien przejść przez widok lub RPC filtrujące ukryte pola.';

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.characters enable row level security;
alter table public.scenes enable row level security;
alter table public.npcs enable row level security;
alter table public.quests enable row level security;
alter table public.npc_interactions enable row level security;
alter table public.knowledge_nodes enable row level security;
alter table public.knowledge_unlocks enable row level security;
alter table public.session_captures enable row level security;
alter table public.session_transcripts enable row level security;

create policy "campaigns_select_member"
  on public.campaigns
  for select
  using (public.app_is_campaign_member(id));

create policy "campaigns_insert_creator"
  on public.campaigns
  for insert
  with check (auth.uid() = created_by);

create policy "campaigns_update_gm"
  on public.campaigns
  for update
  using (public.app_is_campaign_gm(id))
  with check (public.app_is_campaign_gm(id));

create policy "campaigns_delete_gm"
  on public.campaigns
  for delete
  using (public.app_is_campaign_gm(id));

create policy "campaign_members_select_member"
  on public.campaign_members
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "campaign_members_insert_gm"
  on public.campaign_members
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "campaign_members_update_gm"
  on public.campaign_members
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "campaign_members_delete_gm"
  on public.campaign_members
  for delete
  using (public.app_is_campaign_gm(campaign_id));

create policy "characters_select_owner_or_gm"
  on public.characters
  for select
  using (public.app_is_campaign_gm(campaign_id) or player_id = auth.uid());

create policy "characters_insert_gm"
  on public.characters
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "characters_update_owner_or_gm"
  on public.characters
  for update
  using (public.app_is_campaign_gm(campaign_id) or player_id = auth.uid())
  with check (public.app_is_campaign_gm(campaign_id) or player_id = auth.uid());

create policy "characters_delete_gm"
  on public.characters
  for delete
  using (public.app_is_campaign_gm(campaign_id));

create policy "scenes_select_member"
  on public.scenes
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "scenes_insert_gm"
  on public.scenes
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "scenes_update_gm"
  on public.scenes
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "scenes_delete_gm"
  on public.scenes
  for delete
  using (public.app_is_campaign_gm(campaign_id));

create policy "npcs_select_member"
  on public.npcs
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "npcs_insert_gm"
  on public.npcs
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "npcs_update_gm"
  on public.npcs
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "npcs_delete_gm"
  on public.npcs
  for delete
  using (public.app_is_campaign_gm(campaign_id));

create policy "quests_select_member"
  on public.quests
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "quests_insert_gm"
  on public.quests
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "quests_update_gm"
  on public.quests
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "quests_delete_gm"
  on public.quests
  for delete
  using (public.app_is_campaign_gm(campaign_id));

create policy "npc_interactions_select_gm"
  on public.npc_interactions
  for select
  using (
    exists (
      select 1
      from public.scenes s
      where s.id = scene_id
        and public.app_is_campaign_gm(s.campaign_id)
    )
  );

create policy "npc_interactions_insert_gm"
  on public.npc_interactions
  for insert
  with check (
    exists (
      select 1
      from public.scenes s
      where s.id = scene_id
        and public.app_is_campaign_gm(s.campaign_id)
    )
  );

create policy "npc_interactions_update_gm"
  on public.npc_interactions
  for update
  using (
    exists (
      select 1
      from public.scenes s
      where s.id = scene_id
        and public.app_is_campaign_gm(s.campaign_id)
    )
  )
  with check (
    exists (
      select 1
      from public.scenes s
      where s.id = scene_id
        and public.app_is_campaign_gm(s.campaign_id)
    )
  );

create policy "npc_interactions_delete_gm"
  on public.npc_interactions
  for delete
  using (
    exists (
      select 1
      from public.scenes s
      where s.id = scene_id
        and public.app_is_campaign_gm(s.campaign_id)
    )
  );

create policy "knowledge_nodes_select_gm"
  on public.knowledge_nodes
  for select
  using (public.app_is_campaign_gm(campaign_id));

create policy "knowledge_nodes_insert_gm"
  on public.knowledge_nodes
  for insert
  with check (public.app_is_campaign_gm(campaign_id) and auth.uid() = created_by);

create policy "knowledge_nodes_update_gm"
  on public.knowledge_nodes
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "knowledge_nodes_delete_gm"
  on public.knowledge_nodes
  for delete
  using (public.app_is_campaign_gm(campaign_id));

create policy "knowledge_unlocks_select_owner_or_gm"
  on public.knowledge_unlocks
  for select
  using (
    public.app_is_character_owner(character_id)
    or exists (
      select 1
      from public.knowledge_nodes kn
      where kn.id = knowledge_node_id
        and public.app_is_campaign_gm(kn.campaign_id)
    )
  );

create policy "knowledge_unlocks_insert_gm"
  on public.knowledge_unlocks
  for insert
  with check (
    auth.uid() = unlocked_by
    and exists (
      select 1
      from public.knowledge_nodes kn
      where kn.id = knowledge_node_id
        and public.app_is_campaign_gm(kn.campaign_id)
    )
  );

create policy "knowledge_unlocks_update_gm"
  on public.knowledge_unlocks
  for update
  using (
    exists (
      select 1
      from public.knowledge_nodes kn
      where kn.id = knowledge_node_id
        and public.app_is_campaign_gm(kn.campaign_id)
    )
  )
  with check (
    exists (
      select 1
      from public.knowledge_nodes kn
      where kn.id = knowledge_node_id
        and public.app_is_campaign_gm(kn.campaign_id)
    )
  );

create policy "knowledge_unlocks_delete_gm"
  on public.knowledge_unlocks
  for delete
  using (
    exists (
      select 1
      from public.knowledge_nodes kn
      where kn.id = knowledge_node_id
        and public.app_is_campaign_gm(kn.campaign_id)
    )
  );

create policy "session_captures_select_gm"
  on public.session_captures
  for select
  using (public.app_is_campaign_gm(campaign_id));

create policy "session_captures_insert_gm"
  on public.session_captures
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "session_captures_update_gm"
  on public.session_captures
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "session_captures_delete_gm"
  on public.session_captures
  for delete
  using (public.app_is_campaign_gm(campaign_id));

create policy "session_transcripts_select_gm"
  on public.session_transcripts
  for select
  using (public.app_is_campaign_gm(campaign_id));

create policy "session_transcripts_insert_gm"
  on public.session_transcripts
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "session_transcripts_update_gm"
  on public.session_transcripts
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "session_transcripts_delete_gm"
  on public.session_transcripts
  for delete
  using (public.app_is_campaign_gm(campaign_id));

insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;
