-- SEC8 to SEC11: checklist_items.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'alice@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}'),
  ('b2222222-2222-4222-8222-222222222222', 'bob@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}');
insert into public.checklist_items (id, user_id, name) values
  ('f1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'Evening walk'),
  ('f2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222', 'Stretch');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

-- T-SEC-8a / 8b: read
select is((select count(*)::int from public.checklist_items where is_standard), 4, 'T-SEC-8a: a User sees the four Standard Items');
select results_eq($$select name from public.checklist_items where not is_standard$$, $$values ('Evening walk'::text)$$, 'T-SEC-8a: a User sees their own Custom Items');
select is_empty($$select 1 from public.checklist_items where id = 'f2222222-2222-4222-8222-222222222222'$$, 'T-SEC-8b: another User''s Custom Items are invisible');

-- T-SEC-9a / 9b: create
select lives_ok($$insert into public.checklist_items (user_id, name) values ('a1111111-1111-4111-8111-111111111111', 'Morning stretch')$$, 'T-SEC-9a: the owner can add a Custom Item');
select throws_ok($$insert into public.checklist_items (user_id, name) values ('b2222222-2222-4222-8222-222222222222', 'For Bob')$$, '42501', null, 'T-SEC-9b: a User cannot add an Item for someone else');
select throws_ok($$insert into public.checklist_items (user_id, name, is_standard, standard_key) values (null, 'Fake standard', true, 'water')$$, '42501', null, 'T-SEC-9b: a User cannot add a Standard Item');
select throws_ok($$insert into public.checklist_items (user_id, name, sort_order) values ('a1111111-1111-4111-8111-111111111111', 'Jump the queue', 1)$$, '42501', null, 'T-SEC-9b: a User cannot choose the sort order');

-- T-SEC-10a / 10b: update
select lives_ok($$update public.checklist_items set name = 'Evening walk 20 min' where id = 'f1111111-1111-4111-8111-111111111111'$$, 'T-SEC-10a: the owner can rename their Custom Item');
select is((select name from public.checklist_items where id = 'f1111111-1111-4111-8111-111111111111'), 'Evening walk 20 min', 'T-SEC-10a: the new name is saved');
update public.checklist_items set name = 'Hacked' where id = 'f2222222-2222-4222-8222-222222222222';
update public.checklist_items set name = 'Hacked' where standard_key = 'water';
select throws_ok($$update public.checklist_items set is_standard = true where id = 'f1111111-1111-4111-8111-111111111111'$$, '42501', null, 'T-SEC-10b: a User cannot turn a Custom Item into a Standard Item');
select throws_ok($$update public.checklist_items set user_id = 'b2222222-2222-4222-8222-222222222222' where id = 'f1111111-1111-4111-8111-111111111111'$$, '42501', null, 'T-SEC-10b: a User cannot give an Item to someone else');

-- T-SEC-11a / 11b: delete
delete from public.checklist_items where id = 'f2222222-2222-4222-8222-222222222222';
delete from public.checklist_items where standard_key = 'medication';
select lives_ok($$delete from public.checklist_items where id = 'f1111111-1111-4111-8111-111111111111'$$, 'T-SEC-11a: the owner can delete their Custom Item');
select is_empty($$select 1 from public.checklist_items where id = 'f1111111-1111-4111-8111-111111111111'$$, 'T-SEC-11a: the Item is gone');
reset role;

select is((select name from public.checklist_items where id = 'f2222222-2222-4222-8222-222222222222'), 'Stretch', 'T-SEC-10b: another User''s Item was not renamed');
select is((select name from public.checklist_items where standard_key = 'water'), 'Drink water', 'T-SEC-10b: a Standard Item was not renamed');
select is((select count(*)::int from public.checklist_items where id = 'f2222222-2222-4222-8222-222222222222'), 1, 'T-SEC-11b: another User''s Item was not deleted');
select is((select count(*)::int from public.checklist_items where is_standard), 4, 'T-SEC-11b: no Standard Item was deleted');

-- Visitors see no Items (SEC8) and cannot change any
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.checklist_items$$, '42501', null, 'T-SEC-8b: a Visitor sees no Items');
select throws_ok($$insert into public.checklist_items (user_id, name) values ('a1111111-1111-4111-8111-111111111111', 'X')$$, '42501', null, 'T-SEC-9b: a Visitor cannot add Items');
select throws_ok($$update public.checklist_items set name = 'X'$$, '42501', null, 'T-SEC-10b: a Visitor cannot rename Items');
select throws_ok($$delete from public.checklist_items$$, '42501', null, 'T-SEC-11b: a Visitor cannot delete Items');
reset role;

select * from finish();
rollback;
