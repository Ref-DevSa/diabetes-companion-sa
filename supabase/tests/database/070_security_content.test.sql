-- SEC16 to SEC20: the four content tables.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- An unpublished draft in each table (the seed rows are published)
insert into public.topics (slug, title_en, summary_en, body_en, reading_minutes, sort_order) values ('draft-topic', 'Draft topic', 'S', 'B', 3, 99);
insert into public.safety_items (section, text_en, sort_order) values ('low', 'Draft sign', 99);
insert into public.family_tips (text_en, sort_order) values ('Draft tip', 99);
insert into public.resources (name, description_en, url, sort_order) values ('Draft org', 'D', 'https://draft.example.org', 99);

-- Runs the same read checks for a Visitor (anon) and a User (authenticated)
create function pg_temp.content_reads(who text) returns setof text language plpgsql as $$
begin
  return next is((select count(*)::int from public.topics), 6, 'T-SEC-16a: ' || who || ' reads the 6 published Topics');
  return next is_empty($q$select 1 from public.topics where slug = 'draft-topic'$q$, 'T-SEC-16b: ' || who || ' cannot read an unpublished Topic');
  return next throws_ok($q$select reviewed_by from public.topics$q$, '42501', null, 'T-SEC-16b: ' || who || ' cannot read topics.reviewed_by');
  return next lives_ok($q$select id, slug, title_en, title_zu, title_tn, summary_en, body_en, reading_minutes, sort_order, reviewed_at from public.topics$q$, 'T-SEC-16a: ' || who || ' can read the public Topic columns');

  return next is((select count(*)::int from public.safety_items), 15, 'T-SEC-17a: ' || who || ' reads the 15 published Safety Guide items');
  return next is_empty($q$select 1 from public.safety_items where text_en = 'Draft sign'$q$, 'T-SEC-17b: ' || who || ' cannot read an unpublished Safety Guide item');
  return next throws_ok($q$select reviewed_by from public.safety_items$q$, '42501', null, 'T-SEC-17b: ' || who || ' cannot read safety_items.reviewed_by');

  return next is((select count(*)::int from public.family_tips), 5, 'T-SEC-18a: ' || who || ' reads the 5 published family tips');
  return next is_empty($q$select 1 from public.family_tips where text_en = 'Draft tip'$q$, 'T-SEC-18b: ' || who || ' cannot read an unpublished tip');
  return next throws_ok($q$select reviewed_by from public.family_tips$q$, '42501', null, 'T-SEC-18b: ' || who || ' cannot read family_tips.reviewed_by');

  return next is((select count(*)::int from public.resources), 3, 'T-SEC-19a: ' || who || ' reads the 3 published Resources');
  return next is_empty($q$select 1 from public.resources where name = 'Draft org'$q$, 'T-SEC-19b: ' || who || ' cannot read an unpublished Resource');
  return next throws_ok($q$select reviewed_by from public.resources$q$, '42501', null, 'T-SEC-19b: ' || who || ' cannot read resources.reviewed_by');

  -- T-SEC-20b: no create, update or delete
  return next throws_ok($q$insert into public.topics (slug, title_en, summary_en, body_en, reading_minutes, sort_order) values ('x', 'T', 'S', 'B', 3, 1)$q$, '42501', null, 'T-SEC-20b: ' || who || ' cannot add a Topic');
  return next throws_ok($q$update public.safety_items set text_en = 'Changed'$q$, '42501', null, 'T-SEC-20b: ' || who || ' cannot change a Safety Guide item');
  return next throws_ok($q$delete from public.family_tips$q$, '42501', null, 'T-SEC-20b: ' || who || ' cannot delete a family tip');
  return next throws_ok($q$update public.resources set url = 'https://evil.example.org'$q$, '42501', null, 'T-SEC-20b: ' || who || ' cannot change a Resource');
  return next throws_ok($q$update public.topics set is_published = true$q$, '42501', null, 'T-SEC-20b: ' || who || ' cannot publish a Topic');
end $$;
grant execute on function pg_temp.content_reads(text) to anon, authenticated;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select * from pg_temp.content_reads('a Visitor');
reset role;

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1111111-1111-4111-8111-111111111111', 'alice@example.co.za', '{"age_confirmed":"true","privacy_agreed":"true","privacy_notice_version":"v0.4"}');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select * from pg_temp.content_reads('a User');
reset role;

-- T-SEC-20a: the admin (database owner, as in the Supabase dashboard) can manage content
select lives_ok($$update public.topics set title_en = 'What is diabetes?' where slug = 'what-is-diabetes'$$, 'T-SEC-20a: the admin can change a Topic');
select lives_ok($$insert into public.family_tips (text_en, sort_order) values ('Admin tip', 100)$$, 'T-SEC-20a: the admin can add a tip');
select lives_ok($$delete from public.family_tips where text_en = 'Admin tip'$$, 'T-SEC-20a: the admin can delete a tip');

select * from finish();
rollback;
