alter table public.characters
  add column if not exists portrait_url text;

alter table public.characters
  add column if not exists level integer;

comment on column public.characters.portrait_url is
  'Opcjonalny URL portretu postaci (np. Supabase Storage); null = placeholder w UI.';

comment on column public.characters.level is
  'Poziom postaci w systemie kampanii; null gdy nieustalony.';
