-- Migration 5 (Section 8.6): login_attempts and the four account functions.
-- All functions are security definer with an empty search_path and fully qualified names.

-- Failed log-in tries only (PRD v0.4); used for the 15-minute wait after 5 wrong tries (PRD Section 5).
create table public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(btrim(email)) and char_length(email) <= 254),
  attempted_at timestamptz not null default now()
);

create index login_attempts_email_attempted_at_idx on public.login_attempts (email, attempted_at);

-- OP3: false when the email has 5 or more failures in the last 15 minutes.
-- Unknown emails behave exactly like known ones.
create function public.check_login_allowed(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) < 5
    from public.login_attempts
   where email = lower(btrim(p_email))
     and attempted_at > now() - interval '15 minutes';
$$;

-- OP4: records one failure; it can only add failures, never reset a counter.
-- Also removes rows older than 24 hours (BR25), so no scheduled job is needed.
create function public.record_failed_login(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_email text := lower(btrim(coalesce(p_email, '')));
begin
  delete from public.login_attempts where attempted_at < now() - interval '24 hours';
  if char_length(clean_email) between 1 and 254 then
    insert into public.login_attempts (email) values (clean_email);
  end if;
end;
$$;

-- OP4: after a successful log-in, clears the caller's own failures (never anyone else's).
create function public.clear_my_login_attempts()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.login_attempts
   where email = (select lower(u.email) from auth.users u where u.id = auth.uid());
end;
$$;

-- OP10 / BR20: deletes the caller's account; cascades remove the profile, Readings,
-- Custom Items and ticks in the same transaction. Takes no user id, so it acts on the caller only.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  caller_email text;
begin
  if caller is null then
    raise exception using message = 'not_authenticated';
  end if;
  select lower(u.email) into caller_email from auth.users u where u.id = caller;
  delete from public.login_attempts where email = caller_email;
  delete from auth.users where id = caller;
end;
$$;
