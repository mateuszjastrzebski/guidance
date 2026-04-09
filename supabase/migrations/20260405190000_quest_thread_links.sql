create table if not exists public.quest_thread_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  from_quest_id uuid not null references public.quests (id) on delete cascade,
  to_quest_id uuid not null references public.quests (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint quest_thread_links_distinct check (from_quest_id <> to_quest_id),
  constraint quest_thread_links_pair unique (from_quest_id, to_quest_id)
);

create index if not exists quest_thread_links_campaign_id_idx
  on public.quest_thread_links (campaign_id);

alter table public.quest_thread_links enable row level security;

create policy "quest_thread_links_select_member"
  on public.quest_thread_links
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "quest_thread_links_insert_gm"
  on public.quest_thread_links
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "quest_thread_links_update_gm"
  on public.quest_thread_links
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "quest_thread_links_delete_gm"
  on public.quest_thread_links
  for delete
  using (public.app_is_campaign_gm(campaign_id));
