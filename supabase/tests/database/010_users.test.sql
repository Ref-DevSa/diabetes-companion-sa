-- T-DB-1, T-BR18-2: the sign-up trigger creates the profile only with both consent flags.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- T-DB-1: a sign-up with both consent flags and the notice version creates the profile row
select lives_ok(
  $$insert into auth.users (id, email, raw_user_meta_data) values
    ('a1111111-1111-4111-8111-111111111111', 'alice@example.co.za',
     '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}')$$,
  'T-DB-1: sign-up with both consent flags succeeds'
);

select results_eq(
  $$select email, language, privacy_notice_version,
           age_confirmed_at is not null, privacy_agreed_at is not null
      from public.users where id = 'a1111111-1111-4111-8111-111111111111'$$,
  $$values ('alice@example.co.za'::text, 'en'::text, 'v0.4'::text, true, true)$$,
  'T-DB-1: the users row has the email, English, the notice version and both consent times'
);

-- Metadata sent as JSON booleans is also accepted (supabase-js may send true, not "true")
select lives_ok(
  $$insert into auth.users (id, email, raw_user_meta_data) values
    ('b2222222-2222-4222-8222-222222222222', 'bob@example.co.za',
     '{"age_confirmed":true,"privacy_agreed":true,"privacy_notice_version":"v0.4"}')$$,
  'T-DB-1: consent flags sent as JSON true are accepted'
);

-- T-BR18-2 / T-DB-1 deny cases
select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data) values
    (gen_random_uuid(), 'no-age@example.co.za', '{"privacy_agreed":"true","privacy_notice_version":"v0.4"}')$$,
  'P0001', 'consent_required',
  'T-BR18-2: an account without age confirmation is refused'
);

select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data) values
    (gen_random_uuid(), 'age-false@example.co.za', '{"age_confirmed":"false","privacy_agreed":"true","privacy_notice_version":"v0.4"}')$$,
  'P0001', 'consent_required',
  'T-BR18-2: age_confirmed must be true'
);

select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data) values
    (gen_random_uuid(), 'no-privacy@example.co.za', '{"age_confirmed":"true","privacy_notice_version":"v0.4"}')$$,
  'P0001', 'consent_required',
  'T-DB-1: an account without privacy agreement is refused'
);

select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data) values
    (gen_random_uuid(), 'no-version@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true"}')$$,
  'P0001', 'consent_required',
  'T-DB-1: an account without the Privacy Notice version is refused'
);

select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data) values
    (gen_random_uuid(), 'no-meta@example.co.za', null)$$,
  'P0001', 'consent_required',
  'T-DB-1: an account with no sign-up metadata is refused'
);

select is(
  (select count(*)::int from auth.users where email like 'no-%' or email like 'age-false%'),
  0,
  'T-BR18-2: no Auth account remains after a refused sign-up'
);

-- users.language accepts only en, zu, tn
select throws_ok(
  $$update public.users set language = 'fr' where id = 'a1111111-1111-4111-8111-111111111111'$$,
  '23514', null,
  'T-DB-1: language must be en, zu or tn'
);

select * from finish();
rollback;
