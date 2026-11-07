-- Delete behaviour: T-DB-4 (cascades) and T-BR20-2 (delete_my_account leaves nothing).
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'alice@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}'),
  ('b2222222-2222-4222-8222-222222222222', 'bob@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}');

-- Data for both Users: a Reading, a Custom Item, a tick on it and a tick on a Standard Item
insert into public.readings (user_id, value, reading_when)
  values ('a1111111-1111-4111-8111-111111111111', 6.8, 'fasting'), ('b2222222-2222-4222-8222-222222222222', 7.2, 'before_meal');
insert into public.checklist_items (id, user_id, name) values
  ('f1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'Evening walk'),
  ('f2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222', 'Evening walk'),
  ('f3333333-3333-4333-8333-333333333333', 'b2222222-2222-4222-8222-222222222222', 'Stretch');
insert into public.checklist_ticks (user_id, item_id) values
  ('a1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111'),
  ('a1111111-1111-4111-8111-111111111111', (select id from public.checklist_items where standard_key = 'water')),
  ('b2222222-2222-4222-8222-222222222222', 'f2222222-2222-4222-8222-222222222222'),
  ('b2222222-2222-4222-8222-222222222222', 'f3333333-3333-4333-8333-333333333333');
insert into public.login_attempts (email) values ('alice@example.co.za'), ('bob@example.co.za');

-- T-DB-4: deleting a Custom Item deletes its ticks
delete from public.checklist_items where id = 'f3333333-3333-4333-8333-333333333333';
select is((select count(*)::int from public.checklist_ticks where item_id = 'f3333333-3333-4333-8333-333333333333'), 0, 'T-DB-4: deleting a Custom Item deletes its ticks');
select is((select count(*)::int from public.checklist_ticks where user_id = 'b2222222-2222-4222-8222-222222222222'), 1, 'T-DB-4: the other ticks stay');

-- T-DB-4: deleting the Auth account deletes the profile, Readings, Custom Items and ticks
delete from auth.users where id = 'b2222222-2222-4222-8222-222222222222';
select is((select count(*)::int from public.users where id = 'b2222222-2222-4222-8222-222222222222'), 0, 'T-DB-4: the profile is deleted');
select is((select count(*)::int from public.readings where user_id = 'b2222222-2222-4222-8222-222222222222'), 0, 'T-DB-4: the Readings are deleted');
select is((select count(*)::int from public.checklist_items where user_id = 'b2222222-2222-4222-8222-222222222222'), 0, 'T-DB-4: the Custom Items are deleted');
select is((select count(*)::int from public.checklist_ticks where user_id = 'b2222222-2222-4222-8222-222222222222'), 0, 'T-DB-4: the ticks are deleted');
select is((select count(*)::int from public.checklist_items where is_standard), 4, 'T-DB-4: the Standard Items are untouched');

-- T-BR20-2: delete_my_account() as the User leaves no row for them anywhere
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select lives_ok($$select public.delete_my_account()$$, 'T-BR20-2: delete_my_account runs for the logged-in User');
reset role;

select is((select count(*)::int from auth.users where id = 'a1111111-1111-4111-8111-111111111111'), 0, 'T-BR20-2: the Auth account is gone');
select is((select count(*)::int from public.users where id = 'a1111111-1111-4111-8111-111111111111'), 0, 'T-BR20-2: the profile is gone');
select is((select count(*)::int from public.readings where user_id = 'a1111111-1111-4111-8111-111111111111'), 0, 'T-BR20-2: the Readings are gone');
select is((select count(*)::int from public.checklist_items where user_id = 'a1111111-1111-4111-8111-111111111111'), 0, 'T-BR20-2: the Custom Items are gone');
select is((select count(*)::int from public.checklist_ticks where user_id = 'a1111111-1111-4111-8111-111111111111'), 0, 'T-BR20-2: the ticks are gone');
select is((select count(*)::int from public.login_attempts where email = 'alice@example.co.za'), 0, 'T-BR20-2: the login attempts for the email are gone');
select is((select count(*)::int from public.login_attempts where email = 'bob@example.co.za'), 1, 'T-BR20-2: other emails are untouched');

select * from finish();
rollback;
