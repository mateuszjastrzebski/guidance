-- entity_notes: GM notes attached to an entity, optionally created in the context of another entity.
-- owner = the entity this note is about (e.g. NPC "Jorren")
-- context = the entity from which the note was added (e.g. Quest "The Dark Omen")
-- This lets the same NPC accumulate notes from many quests/locations, each traceable to its origin.
create table public.entity_notes (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns(id) on delete cascade,
  content      text not null,
  owner_type   text not null check (owner_type in ('character', 'location', 'npc', 'quest')),
  owner_id     uuid not null,
  context_type text check (context_type in ('character', 'location', 'npc', 'quest')),
  context_id   uuid,
  created_by   uuid not null references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.entity_notes enable row level security;

-- GM has full access
create policy "entity_notes_gm_all" on public.entity_notes
  for all using (public.app_is_campaign_gm(campaign_id));

-- Auto-update updated_at on content changes
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entity_notes_updated_at
  before update on public.entity_notes
  for each row execute function public.set_updated_at();
