-- Migration 3 (Section 8.6): checklist_items and checklist_ticks, the four Standard Items, triggers.

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  is_standard boolean not null default false,
  standard_key text unique check (standard_key in ('medication', 'glucose_check', 'water', 'activity')),
  name text not null check (char_length(btrim(name)) between 1 and 60 and char_length(name) <= 60),
  sort_order integer not null check (sort_order >= 1),
  created_at timestamptz not null default now(),
  -- A Standard Item has no owner and a key; a Custom Item has an owner and no key (BR10, BR11).
  constraint checklist_items_kind_check check (
    (is_standard and user_id is null and standard_key is not null)
    or (not is_standard and user_id is not null and standard_key is null)
  )
);

-- BR11: a Custom Item name is unique for its owner, ignoring capitals and outer spaces.
create unique index checklist_items_user_name_uq
  on public.checklist_items (user_id, lower(btrim(name)))
  where not is_standard;
create index checklist_items_user_sort_idx on public.checklist_items (user_id, sort_order);

-- BR10: the four Standard Items, in the PRD order, with fixed ids. Names are translated in the app by standard_key.
insert into public.checklist_items (id, user_id, is_standard, standard_key, name, sort_order) values
  ('00000000-0000-4000-8000-000000000001', null, true, 'medication', 'Take my medication as prescribed', 1),
  ('00000000-0000-4000-8000-000000000002', null, true, 'glucose_check', 'Check my glucose if my care plan says so', 2),
  ('00000000-0000-4000-8000-000000000003', null, true, 'water', 'Drink water', 3),
  ('00000000-0000-4000-8000-000000000004', null, true, 'activity', 'Do suitable physical activity', 4);

-- BR11: at most 6 Custom Items per User; a new one goes after all the others.
create function public.checklist_items_custom_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  custom_count integer;
  last_order integer;
begin
  if new.is_standard then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('checklist_items:' || new.user_id::text));
  select count(*), max(sort_order) into custom_count, last_order
    from public.checklist_items
   where user_id = new.user_id and not is_standard;
  if custom_count >= 6 then
    raise exception using message = 'custom_item_limit';
  end if;
  new.sort_order := greatest(coalesce(last_order, 0), 4) + 1;
  return new;
end;
$$;

-- BR10: Standard Items cannot be renamed or deleted by anyone using the app (or the dashboard by mistake).
create function public.checklist_items_protect_standard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_standard then
    raise exception using message = 'standard_item_locked';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger checklist_items_custom_limit
  before insert on public.checklist_items
  for each row execute function public.checklist_items_custom_limit();

create trigger checklist_items_protect_standard
  before update or delete on public.checklist_items
  for each row execute function public.checklist_items_protect_standard();

-- BR12: one row means one Item was ticked on one SAST day.
create table public.checklist_ticks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  item_id uuid not null references public.checklist_items (id) on delete cascade,
  tick_date date not null default (now() at time zone 'Africa/Johannesburg')::date,
  created_at timestamptz not null default now(),
  constraint checklist_ticks_user_item_day_uq unique (user_id, item_id, tick_date)
);

create index checklist_ticks_user_date_idx on public.checklist_ticks (user_id, tick_date);
create index checklist_ticks_item_idx on public.checklist_ticks (item_id);
