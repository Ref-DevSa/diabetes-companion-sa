-- SEC4 to SEC7: readings belong to their owner only.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'alice@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}'),
  ('b2222222-2222-4222-8222-222222222222', 'bob@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}');
insert into public.readings (id, user_id, value, reading_when) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a1111111-1111-4111-8111-111111111111', 6.8, 'fasting'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'b2222222-2222-4222-8222-222222222222', 9.4, 'after_meal'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b2222222-2222-4222-8222-222222222222', 3.6, 'bedtime');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

-- T-SEC-4a / 4b: read
select results_eq($$select id from public.readings$$, $$values ('aaaaaaaa-0000-4000-8000-000000000001'::uuid)$$, 'T-SEC-4a: the owner reads their own Readings only');
select is_empty($$select 1 from public.readings where user_id = 'b2222222-2222-4222-8222-222222222222'$$, 'T-SEC-4b: another User''s Readings are invisible');

-- T-SEC-5a / 5b: create
select lives_ok($$insert into public.readings (user_id, value, reading_when) values ('a1111111-1111-4111-8111-111111111111', 7.2, 'before_meal')$$, 'T-SEC-5a: the owner can add a Reading');
select throws_ok($$insert into public.readings (user_id, value, reading_when) values ('b2222222-2222-4222-8222-222222222222', 7.2, 'before_meal')$$, '42501', null, 'T-SEC-5b: a User cannot add a Reading for someone else');
select throws_ok($$insert into public.readings (user_id, value, reading_when, created_at) values ('a1111111-1111-4111-8111-111111111111', 7.2, 'other', now() - interval '2 days')$$, '42501', null, 'T-SEC-5b: a User cannot set created_at (the daily limit cannot be dodged)');
select throws_ok($$insert into public.readings (user_id, value, reading_when) values ('a1111111-1111-4111-8111-111111111111', 45, 'fasting')$$, '23514', null, 'T-SEC-5b: BR1 is checked again for the User');

-- T-SEC-6a / 6b: update
select lives_ok($$update public.readings set value = 5.2, note = 'After lunch' where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$, 'T-SEC-6a: the owner can edit their Reading');
select is((select value from public.readings where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 5.2, 'T-SEC-6a: the edit is saved');
update public.readings set value = 1.0 where id = 'bbbbbbbb-0000-4000-8000-000000000001';
select throws_ok($$update public.readings set user_id = 'b2222222-2222-4222-8222-222222222222' where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$, '42501', null, 'T-SEC-6b: user_id cannot be changed');

-- T-SEC-7a / 7b: delete
delete from public.readings where id = 'bbbbbbbb-0000-4000-8000-000000000002';
select lives_ok($$delete from public.readings where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$, 'T-SEC-7a: the owner can delete their Reading');
select is_empty($$select 1 from public.readings where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$, 'T-SEC-7a: the Reading is gone');
reset role;

select is((select value from public.readings where id = 'bbbbbbbb-0000-4000-8000-000000000001'), 9.4, 'T-SEC-6b: another User''s Reading was not changed');
select is((select count(*)::int from public.readings where id = 'bbbbbbbb-0000-4000-8000-000000000002'), 1, 'T-SEC-7b: another User''s Reading was not deleted');

-- Visitors have no access at all
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.readings$$, '42501', null, 'T-SEC-4b: a Visitor cannot read Readings');
select throws_ok($$insert into public.readings (user_id, value, reading_when) values ('a1111111-1111-4111-8111-111111111111', 6.0, 'other')$$, '42501', null, 'T-SEC-5b: a Visitor cannot add Readings');
select throws_ok($$update public.readings set value = 6.0$$, '42501', null, 'T-SEC-6b: a Visitor cannot edit Readings');
select throws_ok($$delete from public.readings$$, '42501', null, 'T-SEC-7b: a Visitor cannot delete Readings');
reset role;

select * from finish();
rollback;
