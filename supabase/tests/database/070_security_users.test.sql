-- SEC1 to SEC3: the users table.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- T-SEC-3a: the sign-up trigger creates the row
insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'alice@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}'),
  ('b2222222-2222-4222-8222-222222222222', 'bob@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}');
select is((select count(*)::int from public.users where id in ('a1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222')), 2, 'T-SEC-3a: the sign-up trigger creates the users rows');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

-- T-SEC-1a / 1b: a User reads only their own row
select results_eq($$select email from public.users$$, $$values ('alice@example.co.za'::text)$$, 'T-SEC-1a: a User reads their own row (and only it)');
select is_empty($$select 1 from public.users where id = 'b2222222-2222-4222-8222-222222222222'$$, 'T-SEC-1b: a User cannot read another User''s row');

-- T-SEC-2a / 2b: a User changes only their own language
select lives_ok($$update public.users set language = 'zu' where id = 'a1111111-1111-4111-8111-111111111111'$$, 'T-SEC-2a: a User can change their language');
select is((select language from public.users where id = 'a1111111-1111-4111-8111-111111111111'), 'zu', 'T-SEC-2a: the language is saved');
update public.users set language = 'tn' where id = 'b2222222-2222-4222-8222-222222222222';
select throws_ok($$update public.users set email = 'evil@example.co.za'$$, '42501', null, 'T-SEC-2b: a User cannot change their email');
select throws_ok($$update public.users set age_confirmed_at = now(), privacy_agreed_at = now()$$, '42501', null, 'T-SEC-2b: a User cannot change consent dates');
select throws_ok($$update public.users set privacy_notice_version = 'v9'$$, '42501', null, 'T-SEC-2b: a User cannot change the notice version');

-- T-SEC-3b: no direct insert or delete
select throws_ok($$insert into public.users (id, email, privacy_notice_version) values (gen_random_uuid(), 'x@example.co.za', 'v0.4')$$, '42501', null, 'T-SEC-3b: a User cannot insert a users row');
select throws_ok($$delete from public.users where id = 'a1111111-1111-4111-8111-111111111111'$$, '42501', null, 'T-SEC-3b: a User cannot delete a users row directly');
reset role;

select is((select language from public.users where id = 'b2222222-2222-4222-8222-222222222222'), 'en', 'T-SEC-2b: another User''s language is unchanged');

-- T-SEC-1b: a Visitor reads nothing
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.users$$, '42501', null, 'T-SEC-1b: a Visitor cannot read users');
select throws_ok($$update public.users set language = 'zu'$$, '42501', null, 'T-SEC-2b: a Visitor cannot change users');
reset role;

select * from finish();
rollback;
