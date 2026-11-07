-- Login attempts: T-DB-3 (24-hour clean-up) and T-BR25-1 (15-minute window, 5 tries).
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- T-DB-3: record_failed_login removes rows older than 24 hours
insert into public.login_attempts (email, attempted_at) values
  ('old@example.co.za', now() - interval '25 hours'),
  ('old@example.co.za', now() - interval '24 hours 1 minute'),
  ('recent@example.co.za', now() - interval '23 hours');
select lives_ok($$select public.record_failed_login('someone@example.co.za')$$, 'T-DB-3: record_failed_login runs');
select is((select count(*)::int from public.login_attempts where email = 'old@example.co.za'), 0, 'T-DB-3: rows older than 24 hours are deleted');
select is((select count(*)::int from public.login_attempts where email = 'recent@example.co.za'), 1, 'T-DB-3: rows from the last 24 hours are kept');
select is((select count(*)::int from public.login_attempts where email = 'someone@example.co.za'), 1, 'T-DB-3: the new failure is recorded');

-- The email is stored lower-cased and trimmed, so "Thabo@..." and "thabo@..." count together
select public.record_failed_login('  Mixed.Case@Example.co.za ');
select is((select count(*)::int from public.login_attempts where email = 'mixed.case@example.co.za'), 1, 'T-BR25-1: the email is lower-cased and trimmed');

-- T-BR25-1: false at 5 recent failures, true at 4; older than 15 minutes does not count
select is(public.check_login_allowed('fresh@example.co.za'), true, 'T-BR25-1: no failures: allowed');
select public.record_failed_login('fresh@example.co.za') from generate_series(1, 4);
select is(public.check_login_allowed('fresh@example.co.za'), true, 'T-BR25-1: 4 recent failures: still allowed');
select public.record_failed_login('fresh@example.co.za');
select is(public.check_login_allowed('fresh@example.co.za'), false, 'T-BR25-1: 5 recent failures: not allowed');
select is(public.check_login_allowed(' FRESH@example.co.za'), false, 'T-BR25-1: the check ignores capitals and spaces');

insert into public.login_attempts (email, attempted_at)
  select 'waited@example.co.za', now() - interval '16 minutes' from generate_series(1, 5);
select is(public.check_login_allowed('waited@example.co.za'), true, 'T-BR25-1: failures older than 15 minutes do not count');

select throws_ok($$insert into public.login_attempts (email) values ('Not.Lower@example.co.za')$$, '23514', null, 'T-BR25-1: stored emails must be lower-case and trimmed');

select * from finish();
rollback;
