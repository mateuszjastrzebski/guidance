alter table public.npcs
  add column if not exists portrait_url text;

alter table public.npcs
  add column if not exists level integer;

comment on column public.npcs.portrait_url is
  'Opcjonalny URL portretu NPC; null = placeholder w UI.';

comment on column public.npcs.level is
  'Opcjonalny poziom / CR / tier do podglądu w liście; null gdy nie dotyczy.';

-- Przykładowe NPC tylko dla kampanii, które jeszcze nie mają żadnego wpisu w npcs (idempotentnie).
insert into public.npcs (campaign_id, name, description, portrait_url, level)
select c.id, s.name, s.description, s.portrait_url, s.level
from public.campaigns c
cross join lateral (
  values
    (
      'Magda Kowal'::text,
      'Karczmarka „Złotego Roga”; zna plotki z całego miasta.'::text,
      null::text,
      null::integer
    ),
    (
      'Borin Żelazny'::text,
      'Kuźnik i zbrojmistrz z Dolnego Rynku; nieufny wobec obcych.'::text,
      null::text,
      4::integer
    ),
    (
      'Arcykapłan Marek'::text,
      'Starszy duchowny świątyni Świtu; szuka pomocników przy rytuale.'::text,
      null::text,
      8::integer
    ),
    (
      'Szczurzy Król'::text,
      'Tajemniczy informator podziemia; spotkania tylko po nocy.'::text,
      null::text,
      null::integer
    ),
    (
      'Kapitan Sera Voss'::text,
      'Gwardzistka portowa; pilnuje przyjaznych statków i listów przewozowych.'::text,
      null::text,
      6::integer
    )
) as s(name, description, portrait_url, level)
where not exists (select 1 from public.npcs n where n.campaign_id = c.id);
