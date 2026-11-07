-- SEC21 (login_attempts) and SEC22 (delete_my_account, clear_my_login_attempts).
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'alice@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}'),
  ('b2222222-2222-4222-8222-222222222222', 'bob@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}');
insert into public.readings (user_id, value, reading_when) values ('b2222222-2222-4222-8222-222222222222', 6.8, 'fasting');
insert into public.login_attempts (email) values ('alice@example.co.za'), ('alice@example.co.za'), ('bob@example.co.za');

-- T-SEC-21a / 21b: a Visitor reaches login_attempts only through the functions
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select lives_ok($$select public.record_failed_login('visitor@example.co.za')$$, 'T-SEC-21a: a Visitor can record a failed log-in');
select is(public.check_login_allowed('visitor@example.co.za'), true, 'T-SEC-21a: a Visitor can check if log-in is allowed');
select throws_ok($$select * from public.login_attempts$$, '42501', null, 'T-SEC-21b: a Visitor cannot read login_attempts');
select throws_ok($$insert into public.login_attempts (email) values ('x@example.co.za')$$, '42501', null, 'T-SEC-21b: a Visitor cannot insert into login_attempts');
select throws_ok($$update public.login_attempts set attempted_at = now() - interval '1 day'$$, '42501', null, 'T-SEC-21b: a Visitor cannot update login_attempts');
select throws_ok($$delete from public.login_attempts$$, '42501', null, 'T-SEC-21b: a Visitor cannot delete login_attempts (cannot reset a counter)');
-- T-SEC-22b: the account functions refuse a Visitor
select throws_ok($$select public.delete_my_account()$$, '42501', null, 'T-SEC-22b: a Visitor cannot call delete_my_account');
select throws_ok($$select public.clear_my_login_attempts()$$, '42501', null, 'T-SEC-22b: a Visitor cannot call clear_my_login_attempts');
reset role;

-- A User has no direct access either
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select throws_ok($$select * from public.login_attempts$$, '42501', null, 'T-SEC-21b: a User cannot read login_attempts');
select throws_ok($$delete from public.login_attempts$$, '42501', null, 'T-SEC-21b: a User cannot delete login_attempts directly');
select is(public.check_login_allowed('alice@example.co.za'), true, 'T-SEC-21a: a User can call check_login_allowed');

-- T-SEC-22a: clear_my_login_attempts clears only the caller's email
select lives_ok($$select public.clear_my_login_attempts()$$, 'T-SEC-22a: a User can clear their own failed log-ins');
reset role;
select is((select count(*)::int from public.login_attempts where email = 'alice@example.co.za'), 0, 'T-SEC-22a: the caller''s rows are cleared');
select is((select count(*)::int from public.login_attempts where email = 'bob@example.co.za'), 1, 'T-SEC-22a: other emails are untouched');

-- T-SEC-22a: delete_my_account deletes only the caller
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select lives_ok($$select public.delete_my_account()$$, 'T-SEC-22a: a User can delete their own account');
reset role;
select is((select count(*)::int from auth.users where id = 'a1111111-1111-4111-8111-111111111111'), 0, 'T-SEC-22a: the caller''s account is deleted');
select is((select count(*)::int from auth.users where id = 'b2222222-2222-4222-8222-222222222222'), 1, 'T-SEC-22a: another User''s account remains');
select is((select count(*)::int from public.readings where user_id = 'b2222222-2222-4222-8222-222222222222'), 1, 'T-SEC-22a: another User''s Readings remain');

-- T-SEC-22b: with no logged-in User the function refuses (defence in depth)
select set_config('request.jwt.claims', '', true);
select throws_ok($$select public.delete_my_account()$$, 'P0001', 'not_authenticated', 'T-SEC-22b: delete_my_account needs a logged-in User');

-- T-SEC-22b: the functions take no user id, so a caller cannot name someone else
select is(
  (select pronargs::int from pg_proc where oid = 'public.delete_my_account()'::regprocedure),
  0, 'T-SEC-22b: delete_my_account takes no arguments');
select is(
  (select pronargs::int from pg_proc where oid = 'public.clear_my_login_attempts()'::regprocedure),
  0, 'T-SEC-22b: clear_my_login_attempts takes no arguments');

select * from finish();
rollback;
