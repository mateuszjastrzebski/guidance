alter table public.session_captures
  add column if not exists title text;

update public.session_captures
set title = concat('Sesja ', session_number)
where title is null or btrim(title) = '';

alter table public.session_captures
  alter column title set not null;

alter table public.session_captures
  alter column title set default '';
