do $$
begin
  if not exists (select 1 from pg_type where typname = 'fabula_kind') then
    create type public.fabula_kind as enum ('campaign', 'oneshot');
  end if;
end $$;

alter table public.campaigns
  add column if not exists fabula_kind public.fabula_kind not null default 'campaign';

alter table public.campaigns
  add column if not exists cover_image_url text;

comment on column public.campaigns.fabula_kind is 'Kampania wielosesyjna vs jednostrzal — ta sama tabela, różny produkt w czasie.';
comment on column public.campaigns.cover_image_url is 'Opcjonalny URL okładki (np. Supabase Storage); null = placeholder w UI.';

-- Twórca kampanii może dodać pierwszego członka (siebie) jako MG bez istniejącego wiersza w campaign_members.
create policy "campaign_members_insert_creator_bootstrap"
  on public.campaign_members
  for insert
  with check (
    auth.uid() = user_id
    and role = 'gm'
    and exists (
      select 1
      from public.campaigns c
      where c.id = campaign_id
        and c.created_by = auth.uid()
    )
  );
