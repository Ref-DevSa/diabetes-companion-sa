-- SEC12 to SEC15: checklist_ticks.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'alice@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}'),
  ('b2222222-2222-4222-8222-222222222222', 'bob@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}');
insert into public.checklist_items (id, user_id, name) values
  ('f1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'Evening walk'),
  ('f2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222', 'Stretch');
insert into public.checklist_ticks (id, user_id, item_id, tick_date) values
  ('11111111-0000-4000-8000-000000000001', 'a1111111-1111-4111-8111-111111111111', (select id from public.checklist_items where standard_key = 'medication'), (now() at time zone 'Africa/Johannesburg')::date - 1),
  ('22222222-0000-4000-8000-000000000001', 'b2222222-2222-4222-8222-222222222222', 'f2222222-2222-4222-8222-222222222222', (now() at time zone 'Africa/Johannesburg')::date);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

-- T-SEC-12a / 12b: read
select results_eq($$select id from public.checklist_ticks$$, $$values ('11111111-0000-4000-8000-000000000001'::uuid)$$, 'T-SEC-12a: the owner reads their own ticks');
select is_empty($$select 1 from public.checklist_ticks where user_id = 'b2222222-2222-4222-8222-222222222222'$$, 'T-SEC-12b: another User''s ticks are invisible');

-- T-SEC-13a / 13b: create (own, readable Item, today only)
select lives_ok($$insert into public.checklist_ticks (user_id, item_id) values ('a1111111-1111-4111-8111-111111111111', (select id from public.checklist_items where standard_key = 'water'))$$, 'T-SEC-13a: the owner can tick a Standard Item today');
select lives_ok($$insert into public.checklist_ticks (user_id, item_id) values ('a1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111')$$, 'T-SEC-13a: the owner can tick their own Custom Item today');
select throws_ok($$insert into public.checklist_ticks (user_id, item_id) values ('a1111111-1111-4111-8111-111111111111', 'f2222222-2222-4222-8222-222222222222')$$, '42501', null, 'T-SEC-13b: a User cannot tick another User''s Item');
select throws_ok($$insert into public.checklist_ticks (user_id, item_id) values ('b2222222-2222-4222-8222-222222222222', (select id from public.checklist_items where standard_key = 'activity'))$$, '42501', null, 'T-SEC-13b: a User cannot tick for someone else');
select throws_ok(
  $$insert into public.checklist_ticks (user_id, item_id, tick_date) values ('a1111111-1111-4111-8111-111111111111', (select id from public.checklist_items where standard_key = 'activity'), (now() at time zone 'Africa/Johannesburg')::date - 1)$$,
  '42501', null, 'T-SEC-13b: a User cannot tick a past day');
select throws_ok(
  $$insert into public.checklist_ticks (user_id, item_id, tick_date) values ('a1111111-1111-4111-8111-111111111111', (select id from public.checklist_items where standard_key = 'activity'), (now() at time zone 'Africa/Johannesburg')::date + 1)$$,
  '42501', null, 'T-SEC-13b: a User cannot tick a future day');

-- T-SEC-14a / 14b: a tick is created or deleted, never updated
select throws_ok($$update public.checklist_ticks set tick_date = tick_date - 1$$, '42501', null, 'T-SEC-14b: ticks cannot be updated');
select lives_ok(
  $$delete from public.checklist_ticks where user_id = 'a1111111-1111-4111-8111-111111111111' and item_id = (select id from public.checklist_items where standard_key = 'water')$$,
  'T-SEC-14a / T-SEC-15a: the owner can untick today');
select is_empty(
  $$select 1 from public.checklist_ticks where item_id = (select id from public.checklist_items where standard_key = 'water')$$,
  'T-SEC-15a: today''s tick is removed');

-- T-SEC-15b: yesterday's ticks and other Users' ticks cannot be deleted
delete from public.checklist_ticks where id = '11111111-0000-4000-8000-000000000001';
delete from public.checklist_ticks where id = '22222222-0000-4000-8000-000000000001';
reset role;

select is((select count(*)::int from public.checklist_ticks where id = '11111111-0000-4000-8000-000000000001'), 1, 'T-SEC-15b: yesterday''s tick was not deleted');
select is((select count(*)::int from public.checklist_ticks where id = '22222222-0000-4000-8000-000000000001'), 1, 'T-SEC-15b: another User''s tick was not deleted');

-- Visitors have no access
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.checklist_ticks$$, '42501', null, 'T-SEC-12b: a Visitor cannot read ticks');
select throws_ok($$insert into public.checklist_ticks (user_id, item_id) values ('a1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111')$$, '42501', null, 'T-SEC-13b: a Visitor cannot tick');
select throws_ok($$delete from public.checklist_ticks$$, '42501', null, 'T-SEC-15b: a Visitor cannot delete ticks');
reset role;

select * from finish();
rollback;
