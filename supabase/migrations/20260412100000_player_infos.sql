-- player_infos: GM-authored notes that can be selectively revealed to players
create table public.player_infos (
  id               uuid primary key default gen_random_uuid(),
  campaign_id      uuid not null references public.campaigns(id) on delete cascade,
  content          text not null default '',
  -- Entity linkage (at most one)
  npc_id           uuid references public.npcs(id) on delete cascade,
  location_id      uuid references public.locations(id) on delete cascade,
  quest_id         uuid references public.quests(id) on delete cascade,
  planner_event_id text,                   -- React Flow node ID
  sort_order       integer not null default 0,
  created_by       uuid not null references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- player_info_reveals: tracks per-character visibility
create table public.player_info_reveals (
  id           uuid primary key default gen_random_uuid(),
  info_id      uuid not null references public.player_infos(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  revealed_at  timestamptz not null default now(),
  revealed_by  uuid not null references auth.users(id),
  unique(info_id, character_id)
);

-- RLS
alter table public.player_infos enable row level security;
alter table public.player_info_reveals enable row level security;

-- player_infos: GM full access
create policy "gm_all_player_infos" on public.player_infos
  for all using (public.app_is_campaign_gm(campaign_id));

-- player_infos: player reads only infos revealed to their character
create policy "player_read_revealed_infos" on public.player_infos
  for select using (
    exists (
      select 1
      from public.player_info_reveals pir
      join public.characters c on c.id = pir.character_id
      where pir.info_id = player_infos.id
        and c.player_id = auth.uid()
        and c.campaign_id = player_infos.campaign_id
    )
  );

-- player_info_reveals: GM full access
create policy "gm_all_reveals" on public.player_info_reveals
  for all using (
    exists (
      select 1 from public.player_infos pi
      where pi.id = player_info_reveals.info_id
        and public.app_is_campaign_gm(pi.campaign_id)
    )
  );

-- player_info_reveals: player reads reveals for their own character
create policy "player_read_own_reveals" on public.player_info_reveals
  for select using (
    exists (
      select 1 from public.characters c
      where c.id = player_info_reveals.character_id
        and c.player_id = auth.uid()
    )
  );
