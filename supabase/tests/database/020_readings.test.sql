-- Readings: BR1 to BR4, BR9 and updated_at (T-DB-2). Runs as the database owner; permission tests are in 070_*.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'alice@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}'),
  ('c3333333-3333-4333-8333-333333333333', 'carol@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}'),
  ('d4444444-4444-4444-8444-444444444444', 'dave@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}');

-- T-BR1-3: value 1.0 to 40.0, one decimal, never rounded
select throws_ok($$insert into public.readings (user_id, value, reading_when) values ('a1111111-1111-4111-8111-111111111111', 0.9, 'fasting')$$, '23514', null, 'T-BR1-3: 0.9 is rejected');
select throws_ok($$insert into public.readings (user_id, value, reading_when) values ('a1111111-1111-4111-8111-111111111111', 40.1, 'fasting')$$, '23514', null, 'T-BR1-3: 40.1 is rejected');
select throws_ok($$insert into public.readings (user_id, value, reading_when) values ('a1111111-1111-4111-8111-111111111111', 6.85, 'fasting')$$, '23514', null, 'T-BR1-3: 6.85 is rejected, not rounded');
select lives_ok($$insert into public.readings (user_id, value, reading_when) values ('a1111111-1111-4111-8111-111111111111', 1.0, 'fasting')$$, 'T-BR1-3: 1.0 is accepted');
select lives_ok($$insert into public.readings (user_id, value, reading_when) values ('a1111111-1111-4111-8111-111111111111', 40.0, 'fasting')$$, 'T-BR1-3: 40.0 is accepted');
select lives_ok($$insert into public.readings (user_id, value, reading_when) values ('a1111111-1111-4111-8111-111111111111', 6.8, 'fasting')$$, 'T-BR1-3: 6.8 is accepted');
select is((select value::text from public.readings where user_id = 'a1111111-1111-4111-8111-111111111111' and value = 6.8), '6.8', 'T-BR1-3: 6.8 is stored exactly');

-- T-BR2-3: not more than 5 minutes in the future, not more than 30 days back
select throws_ok($$insert into public.readings (user_id, value, reading_when, taken_at) values ('a1111111-1111-4111-8111-111111111111', 6.0, 'other', now() + interval '6 minutes')$$, 'P0001', 'reading_future', 'T-BR2-3: 6 minutes ahead is rejected');
select lives_ok($$insert into public.readings (user_id, value, reading_when, taken_at) values ('a1111111-1111-4111-8111-111111111111', 6.0, 'other', now() + interval '4 minutes')$$, 'T-BR2-3: 4 minutes ahead is accepted (clock difference)');
select throws_ok($$insert into public.readings (user_id, value, reading_when, taken_at) values ('a1111111-1111-4111-8111-111111111111', 6.0, 'other', now() - interval '30 days 1 minute')$$, 'P0001', 'reading_too_old', 'T-BR2-3: 30 days and 1 minute ago is rejected');
select lives_ok($$insert into public.readings (user_id, value, reading_when, taken_at) values ('a1111111-1111-4111-8111-111111111111', 6.0, 'other', now() - interval '29 days 23 hours')$$, 'T-BR2-3: 29 days 23 hours ago is accepted');
select throws_ok($$update public.readings set taken_at = now() + interval '1 hour' where user_id = 'a1111111-1111-4111-8111-111111111111' and value = 6.8$$, 'P0001', 'reading_future', 'T-BR2-3: an edit cannot move a Reading into the future');
select throws_ok($$update public.readings set taken_at = now() - interval '31 days' where user_id = 'a1111111-1111-4111-8111-111111111111' and value = 6.8$$, 'P0001', 'reading_too_old', 'T-BR2-3: an edit cannot move a Reading more than 30 days back');

-- T-BR3-2: When is required and one of the five values
select throws_ok($$insert into public.readings (user_id, value) values ('a1111111-1111-4111-8111-111111111111', 6.0)$$, '23502', null, 'T-BR3-2: a missing When is rejected');
select throws_ok($$insert into public.readings (user_id, value, reading_when) values ('a1111111-1111-4111-8111-111111111111', 6.0, 'lunch')$$, '23514', null, 'T-BR3-2: an invalid When is rejected');
select lives_ok(
  $$insert into public.readings (user_id, value, reading_when)
    select 'a1111111-1111-4111-8111-111111111111', 6.0, w from unnest(array['fasting','before_meal','after_meal','bedtime','other']) as w$$,
  'T-BR3-2: the five When values are accepted'
);

-- T-BR4-2: note up to 200 characters
select lives_ok($$insert into public.readings (user_id, value, reading_when, note) values ('a1111111-1111-4111-8111-111111111111', 6.0, 'other', repeat('a', 200))$$, 'T-BR4-2: a 200-character note is accepted');
select throws_ok($$insert into public.readings (user_id, value, reading_when, note) values ('a1111111-1111-4111-8111-111111111111', 6.0, 'other', repeat('a', 201))$$, '23514', null, 'T-BR4-2: a 201-character note is rejected');

-- T-DB-2: updated_at changes on update
insert into public.readings (id, user_id, value, reading_when, updated_at)
  values ('e5555555-5555-4555-8555-555555555555', 'a1111111-1111-4111-8111-111111111111', 7.0, 'bedtime', now() - interval '1 hour');
update public.readings set value = 7.1 where id = 'e5555555-5555-4555-8555-555555555555';
select is((select updated_at from public.readings where id = 'e5555555-5555-4555-8555-555555555555'), now(), 'T-DB-2: updated_at is set on update');

-- T-BR9-3: at most 30 Readings saved per SAST day
insert into public.readings (user_id, value, reading_when)
  select 'c3333333-3333-4333-8333-333333333333', 5.0, 'other' from generate_series(1, 30);
select throws_ok($$insert into public.readings (user_id, value, reading_when) values ('c3333333-3333-4333-8333-333333333333', 5.0, 'other')$$, 'P0001', 'daily_limit', 'T-BR9-3: the 31st Reading saved today is rejected');
delete from public.readings where id = (select id from public.readings where user_id = 'c3333333-3333-4333-8333-333333333333' limit 1);
select lives_ok($$insert into public.readings (user_id, value, reading_when) values ('c3333333-3333-4333-8333-333333333333', 5.0, 'other')$$, 'T-BR9-3: deleting one frees one place');

-- 30 saved on the previous SAST day do not count today; the date field does not matter, only the day saved
insert into public.readings (user_id, value, reading_when, created_at)
  select 'd4444444-4444-4444-8444-444444444444', 5.0, 'other', now() - interval '1 day' from generate_series(1, 30);
select lives_ok($$insert into public.readings (user_id, value, reading_when) values ('d4444444-4444-4444-8444-444444444444', 5.0, 'other')$$, 'T-BR9-3: a Reading saved on another SAST day is accepted');

select * from finish();
rollback;
