-- Atomowe utworzenie fabuły + pierwszego członka (MG) jako bieżący użytkownik.
-- SECURITY DEFINER: INSERT-y wykonuje właściciel funkcji (omija RLS na tabelach),
-- przy czym created_by i user_id są wymuszane na auth.uid() z JWT wywołującego.

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

  return v_id;
end;
$$;

comment on function public.create_fabula_bootstrap(text, text, public.fabula_kind) is
  'Tworzy wiersz campaigns + campaign_members (MG) dla auth.uid(); wywołanie wyłącznie z zaufanym JWT.';

revoke all on function public.create_fabula_bootstrap(text, text, public.fabula_kind) from public;
grant execute on function public.create_fabula_bootstrap(text, text, public.fabula_kind) to authenticated;
