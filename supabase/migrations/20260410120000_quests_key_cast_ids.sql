alter table public.quests
  add column if not exists key_npc_ids uuid[] not null default '{}'::uuid[];

alter table public.quests
  add column if not exists key_character_ids uuid[] not null default '{}'::uuid[];

comment on column public.quests.key_npc_ids is
  'Kolejność = kolejność wyświetlania kluczowych NPC przypisanych do wątku (quest).';

comment on column public.quests.key_character_ids is
  'Id z public.characters — kluczowe postacie graczy w tym wątku; kolejność = kolejność na liście.';
