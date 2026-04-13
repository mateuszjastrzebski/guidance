create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  name text not null,
  description text,
  hidden_notes text,
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;

create policy "locations_select_member"
  on public.locations
  for select
  using (public.app_is_campaign_member(campaign_id));

create policy "locations_insert_gm"
  on public.locations
  for insert
  with check (public.app_is_campaign_gm(campaign_id));

create policy "locations_update_gm"
  on public.locations
  for update
  using (public.app_is_campaign_gm(campaign_id))
  with check (public.app_is_campaign_gm(campaign_id));

create policy "locations_delete_gm"
  on public.locations
  for delete
  using (public.app_is_campaign_gm(campaign_id));

-- Przykładowe lokacje dla kampanii, które jeszcze nie mają żadnego wpisu w locations (idempotentnie).
insert into public.locations (campaign_id, name, description)
select c.id, s.name, s.description
from public.campaigns c
cross join lateral (
  values
    (
      'Gospoda „Złoty Róg"'::text,
      'Popularna karczma w centrum miasta; hub plotek i spotkań.'::text
    ),
    (
      'Dolny Rynek'::text,
      'Tętniący życiem plac handlowy; kuźnie, straganty i gildyjne sklepy.'::text
    ),
    (
      'Świątynia Świtu'::text,
      'Kamienne sanktuarium na wzgórzu; centrum kultu i rytuałów.'::text
    ),
    (
      'Podziemne kanały'::text,
      'Labirynt tuneli pod miastem; siedziba przestępczego półświatka.'::text
    ),
    (
      'Port Wschodni'::text,
      'Hałaśliwy port rybacki i handlowy; bramy na morskie szlaki.'::text
    )
) as s(name, description)
where not exists (select 1 from public.locations l where l.campaign_id = c.id);
