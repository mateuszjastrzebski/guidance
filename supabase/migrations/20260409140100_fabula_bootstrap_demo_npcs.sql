-- Nowe fabuły od razu dostają ten sam zestaw przykładowych NPC co seed w poprzedniej migracji.

create or replace function public.create_fabula_bootstrap(
  p_name text,
  p_system text,
  p_fabula_kind public.fabula_kind
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if length(trim(p_name)) = 0 then
    raise exception 'invalid name' using errcode = '23514';
  end if;

  if length(trim(p_system)) = 0 then
    raise exception 'invalid system' using errcode = '23514';
  end if;

  insert into public.campaigns (name, system, created_by, fabula_kind)
  values (trim(p_name), trim(p_system), v_uid, p_fabula_kind)
  returning id into v_id;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (v_id, v_uid, 'gm');

  insert into public.npcs (campaign_id, name, description, portrait_url, level)
  select
    v_id,
    s.name,
    s.description,
    s.portrait_url,
    s.level
  from (
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
  ) as s(name, description, portrait_url, level);

  return v_id;
end;
$$;
