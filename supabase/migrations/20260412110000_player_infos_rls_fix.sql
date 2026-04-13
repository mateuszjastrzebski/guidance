-- Fix: circular RLS between player_infos and player_info_reveals.
-- The gm_all_reveals policy was querying player_infos, which in turn
-- queries player_info_reveals → infinite recursion.
-- Solution: security definer helper that reads player_infos bypassing RLS.

create or replace function public.app_player_info_campaign_id(target_info_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select campaign_id from public.player_infos where id = target_info_id limit 1;
$$;

-- Recreate the problematic policy using the helper
drop policy if exists "gm_all_reveals" on public.player_info_reveals;

create policy "gm_all_reveals" on public.player_info_reveals
  for all using (
    public.app_is_campaign_gm(
      public.app_player_info_campaign_id(info_id)
    )
  );
