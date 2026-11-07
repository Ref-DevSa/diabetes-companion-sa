-- Migration 2 (Section 8.6): readings, indexes and triggers. The Flag (BR5) is never stored.

create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  -- BR1: plain numeric so PostgreSQL never rounds; 6.85 is rejected, not stored as 6.9
  value numeric not null check (value = round(value, 1) and value between 1.0 and 40.0),
  taken_at timestamptz not null default now(),
  reading_when text not null check (reading_when in ('fasting', 'before_meal', 'after_meal', 'bedtime', 'other')),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.readings.created_at is 'When the Reading was saved; the daily limit (BR9) counts by this, in SAST.';

create index readings_user_taken_at_idx on public.readings (user_id, taken_at desc);
create index readings_user_created_at_idx on public.readings (user_id, created_at);

-- Keeps updated_at current on readings and topics.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- BR2: not more than 5 minutes in the future (clock difference); not more than 30 days back
-- (checked on insert, and on update only when taken_at changes).
create function public.readings_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.taken_at > now() + interval '5 minutes' then
    raise exception using message = 'reading_future';
  end if;
  if (tg_op = 'INSERT' or new.taken_at is distinct from old.taken_at)
     and new.taken_at < now() - interval '30 days' then
    raise exception using message = 'reading_too_old';
  end if;
  return new;
end;
$$;

-- BR9: at most 30 Readings saved per SAST day, counted by the day saved (created_at).
-- The advisory lock stops two saves at the same moment from both getting the 30th place.
create function public.readings_daily_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  day_start timestamptz := date_trunc('day', now() at time zone 'Africa/Johannesburg') at time zone 'Africa/Johannesburg';
  saved_today integer;
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  select count(*) into saved_today
    from public.readings
   where user_id = new.user_id
     and created_at >= day_start
     and created_at < day_start + interval '1 day';
  if saved_today >= 30 then
    raise exception using message = 'daily_limit';
  end if;
  return new;
end;
$$;

create trigger readings_validate
  before insert or update on public.readings
  for each row execute function public.readings_validate();

create trigger readings_daily_limit
  before insert on public.readings
  for each row execute function public.readings_daily_limit();

create trigger set_updated_at
  before update on public.readings
  for each row execute function public.set_updated_at();
