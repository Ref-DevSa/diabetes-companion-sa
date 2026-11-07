-- Checklist Items and ticks: T-DB-7, T-DB-8, T-BR10-2, T-BR11-3, T-BR12-3.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'alice@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}'),
  ('b2222222-2222-4222-8222-222222222222', 'bob@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}');

-- T-DB-7: the four Standard Items, in the PRD order and names
select results_eq(
  $$select standard_key, name, sort_order, user_id is null from public.checklist_items where is_standard order by sort_order$$,
  $$values ('medication'::text, 'Take my medication as prescribed'::text, 1, true),
           ('glucose_check', 'Check my glucose if my care plan says so', 2, true),
           ('water', 'Drink water', 3, true),
           ('activity', 'Do suitable physical activity', 4, true)$$,
  'T-DB-7: four Standard Items with keys medication, glucose_check, water, activity'
);

-- T-DB-8: Standard and Custom Items cannot be mixed up
select throws_ok(
  $$insert into public.checklist_items (user_id, is_standard, standard_key, name, sort_order) values ('a1111111-1111-4111-8111-111111111111', true, null, 'Mine', 9)$$,
  '23514', null, 'T-DB-8: a Standard Item with an owner is rejected');
select throws_ok(
  $$insert into public.checklist_items (user_id, is_standard, standard_key, name) values ('a1111111-1111-4111-8111-111111111111', false, 'water', 'Water again')$$,
  '23514', null, 'T-DB-8: a Custom Item with a standard key is rejected');

-- T-BR10-2: Standard Items cannot be renamed or deleted, even by the database owner
select throws_ok($$update public.checklist_items set name = 'Something else' where standard_key = 'water'$$, 'P0001', 'standard_item_locked', 'T-BR10-2: renaming a Standard Item fails');
select throws_ok($$delete from public.checklist_items where standard_key = 'water'$$, 'P0001', 'standard_item_locked', 'T-BR10-2: deleting a Standard Item fails');

-- T-BR11-3: up to 6 Custom Items, names 1 to 60 characters, unique per User ignoring capitals
select lives_ok(
  $$insert into public.checklist_items (user_id, name)
    select 'a1111111-1111-4111-8111-111111111111', 'Item ' || n from generate_series(1, 6) as n$$,
  'T-BR11-3: six Custom Items are accepted');
select results_eq(
  $$select sort_order from public.checklist_items where user_id = 'a1111111-1111-4111-8111-111111111111' order by sort_order$$,
  $$values (5), (6), (7), (8), (9), (10)$$,
  'T-BR11-3: Custom Items come after the Standard Items, in the order added');
select throws_ok(
  $$insert into public.checklist_items (user_id, name) values ('a1111111-1111-4111-8111-111111111111', 'Item 7')$$,
  'P0001', 'custom_item_limit', 'T-BR11-3: the 7th Custom Item is rejected');

select lives_ok($$insert into public.checklist_items (user_id, name) values ('b2222222-2222-4222-8222-222222222222', 'Evening walk')$$, 'T-BR11-3: "Evening walk" is accepted');
select throws_ok($$insert into public.checklist_items (user_id, name) values ('b2222222-2222-4222-8222-222222222222', 'evening walk')$$, '23505', null, 'T-BR11-3: "evening walk" for the same User is rejected');
select throws_ok($$insert into public.checklist_items (user_id, name) values ('b2222222-2222-4222-8222-222222222222', '  Evening Walk ')$$, '23505', null, 'T-BR11-3: spaces and capitals do not make a new name');
delete from public.checklist_items where user_id = 'a1111111-1111-4111-8111-111111111111' and name = 'Item 6';
select lives_ok($$insert into public.checklist_items (user_id, name) values ('a1111111-1111-4111-8111-111111111111', 'Evening walk')$$, 'T-BR11-3: two different Users may use the same name');
select throws_ok($$insert into public.checklist_items (user_id, name) values ('b2222222-2222-4222-8222-222222222222', repeat('x', 61))$$, '23514', null, 'T-BR11-3: a 61-character name is rejected');
select lives_ok($$insert into public.checklist_items (user_id, name) values ('b2222222-2222-4222-8222-222222222222', repeat('x', 60))$$, 'T-BR11-3: a 60-character name is accepted');
select throws_ok($$insert into public.checklist_items (user_id, name) values ('b2222222-2222-4222-8222-222222222222', '   ')$$, '23514', null, 'T-BR11-3: a blank name is rejected');

-- T-BR12-3: ticks belong to today in SAST; one per User, Item and day
insert into public.checklist_ticks (user_id, item_id)
  values ('b2222222-2222-4222-8222-222222222222', (select id from public.checklist_items where standard_key = 'water'));
select is(
  (select tick_date from public.checklist_ticks where user_id = 'b2222222-2222-4222-8222-222222222222'),
  (now() at time zone 'Africa/Johannesburg')::date,
  'T-BR12-3: tick_date defaults to today in SAST');
select throws_ok(
  $$insert into public.checklist_ticks (user_id, item_id) values ('b2222222-2222-4222-8222-222222222222', (select id from public.checklist_items where standard_key = 'water'))$$,
  '23505', null, 'T-BR12-3: the same Item, User and day twice is rejected');
select lives_ok(
  $$insert into public.checklist_ticks (user_id, item_id, tick_date) values ('b2222222-2222-4222-8222-222222222222', (select id from public.checklist_items where standard_key = 'water'), (now() at time zone 'Africa/Johannesburg')::date - 1)$$,
  'T-BR12-3: the same Item on another day is a separate tick');

select * from finish();
rollback;
