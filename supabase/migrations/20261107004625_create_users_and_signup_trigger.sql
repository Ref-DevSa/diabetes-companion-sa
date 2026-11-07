-- Migration 1 (IMPLEMENTATION_PLAN.md Section 8.6): users table and the sign-up trigger.
-- Email and password live in Supabase Auth (auth.users); this is the profile row.

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique check (length(email) between 3 and 254),
  language text not null default 'en' check (language in ('en', 'zu', 'tn')),
  age_confirmed_at timestamptz not null default now(),
  privacy_agreed_at timestamptz not null default now(),
  privacy_notice_version text not null check (length(privacy_notice_version) between 1 and 20),
  created_at timestamptz not null default now()
);

comment on table public.users is 'One row per person with an account (PRD 10.1). Created only by handle_new_user; removed by delete_my_account.';

-- BR18 and the consent record (Section 9.2): an account needs both tick boxes and the Privacy Notice version.
-- Metadata is sent by the app at sign-up as age_confirmed, privacy_agreed and privacy_notice_version.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  notice_version text := btrim(coalesce(meta ->> 'privacy_notice_version', ''));
begin
  if coalesce(meta ->> 'age_confirmed', '') <> 'true'
     or coalesce(meta ->> 'privacy_agreed', '') <> 'true'
     or notice_version = ''
     or length(notice_version) > 20 then
    raise exception using message = 'consent_required';
  end if;

  insert into public.users (id, email, privacy_notice_version)
  values (new.id, lower(new.email), notice_version);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
