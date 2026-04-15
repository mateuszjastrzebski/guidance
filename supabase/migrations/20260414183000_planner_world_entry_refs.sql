alter table public.planner_events
  add column if not exists world_entry_refs jsonb not null default '[]'::jsonb;
