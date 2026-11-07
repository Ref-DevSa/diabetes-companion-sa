-- Content tables: T-DB-5, T-DB-6, T-BR19-1, T-BR22-1.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- The local seed loads the PRD 8.4 reference content (Section 8.7); counted before this file adds rows
select results_eq(
  $$select (select count(*)::int from public.topics where is_published),
           (select count(*)::int from public.safety_items where is_published and section = 'low'),
           (select count(*)::int from public.safety_items where is_published and section = 'high'),
           (select count(*)::int from public.safety_items where is_published and section = 'urgent'),
           (select count(*)::int from public.family_tips where is_published),
           (select count(*)::int from public.resources where is_published)$$,
  $$values (6, 5, 5, 5, 5, 3)$$,
  'Seed: 6 Topics, 5 + 5 + 5 Safety Guide items, 5 family tips, 3 Resources');

-- T-DB-5 / T-BR22-1: nothing can be published without a recorded review
select throws_ok(
  $$insert into public.topics (slug, title_en, summary_en, body_en, reading_minutes, sort_order, is_published)
    values ('t-unreviewed', 'T', 'S', 'B', 3, 99, true)$$,
  '23514', null, 'T-DB-5: a published Topic without reviewed_at and reviewed_by is rejected');
select throws_ok(
  $$insert into public.topics (slug, title_en, summary_en, body_en, reading_minutes, sort_order, is_published, reviewed_at)
    values ('t-no-reviewer', 'T', 'S', 'B', 3, 99, true, current_date)$$,
  '23514', null, 'T-DB-5: a published Topic without reviewed_by is rejected');
select throws_ok(
  $$insert into public.topics (slug, title_en, summary_en, body_en, reading_minutes, sort_order, is_published, reviewed_at, reviewed_by)
    values ('t-blank-reviewer', 'T', 'S', 'B', 3, 99, true, current_date, '   ')$$,
  '23514', null, 'T-DB-5: a blank reviewer name is rejected');
select lives_ok(
  $$insert into public.topics (slug, title_en, summary_en, body_en, reading_minutes, sort_order, is_published, reviewed_at, reviewed_by)
    values ('t-reviewed', 'T', 'S', 'B', 3, 99, true, current_date, 'Dr Test, GP')$$,
  'T-DB-5: a reviewed Topic can be published');
select lives_ok(
  $$insert into public.topics (slug, title_en, summary_en, body_en, reading_minutes, sort_order)
    values ('t-draft', 'T', 'S', 'B', 3, 99)$$,
  'T-DB-5: an unpublished draft needs no review');

select throws_ok(
  $$insert into public.topics (slug, title_en, summary_en, body_en, title_zu, reading_minutes, sort_order)
    values ('t-zu', 'T', 'S', 'B', 'Isihloko', 3, 99)$$,
  '23514', null, 'T-DB-5: isiZulu text without zu_reviewed_at is rejected');
select lives_ok(
  $$insert into public.topics (slug, title_en, summary_en, body_en, title_zu, zu_reviewed_at, reading_minutes, sort_order)
    values ('t-zu-ok', 'T', 'S', 'B', 'Isihloko', current_date, 3, 99)$$,
  'T-DB-5: isiZulu text with zu_reviewed_at is accepted');
select throws_ok(
  $$insert into public.safety_items (section, text_en, text_tn, sort_order) values ('low', 'Sign', 'Sesupo', 99)$$,
  '23514', null, 'T-DB-5: Setswana text without tn_reviewed_at is rejected (safety_items)');
select throws_ok(
  $$insert into public.family_tips (text_en, sort_order, is_published) values ('Tip', 99, true)$$,
  '23514', null, 'T-DB-5: an unreviewed family tip cannot be published');
select throws_ok(
  $$insert into public.resources (name, description_en, url, sort_order, is_published) values ('Org', 'Desc', 'https://example.org', 99, true)$$,
  '23514', null, 'T-DB-5: an unreviewed Resource cannot be published');
select throws_ok(
  $$update public.safety_items set reviewed_at = null where is_published$$,
  '23514', null, 'T-DB-5: removing the review from a published row is rejected');

-- T-DB-6: Resource links must use https
select throws_ok(
  $$insert into public.resources (name, description_en, url, sort_order) values ('Plain', 'Desc', 'http://example.org', 99)$$,
  '23514', null, 'T-DB-6: a Resource url not starting with https:// is rejected');
select lives_ok(
  $$insert into public.resources (name, description_en, url, sort_order) values ('Secure', 'Desc', 'https://example.org', 99)$$,
  'T-DB-6: an https:// Resource url is accepted');

-- Other limits from Section 8.1
select throws_ok(
  $$insert into public.topics (slug, title_en, summary_en, body_en, reading_minutes, sort_order) values ('t-long', 'T', 'S', 'B', 16, 99)$$,
  '23514', null, 'T-DB-5: reading_minutes above 15 is rejected');
select throws_ok(
  $$insert into public.safety_items (section, text_en, sort_order) values ('other', 'X', 99)$$,
  '23514', null, 'T-DB-5: a Safety Guide section must be low, high or urgent');

-- T-BR22-1: every published row in the seed has a recorded review date and reviewer
select is_empty(
  $$select 'topics' from public.topics where is_published and (reviewed_at is null or reviewed_by is null)
    union all select 'safety_items' from public.safety_items where is_published and (reviewed_at is null or reviewed_by is null)
    union all select 'family_tips' from public.family_tips where is_published and (reviewed_at is null or reviewed_by is null)
    union all select 'resources' from public.resources where is_published and (reviewed_at is null or reviewed_by is null)$$,
  'T-BR22-1: every published row has reviewed_at and reviewed_by');

-- T-BR19-1: content cannot be changed by anon or authenticated
set local role anon;
select throws_ok($$insert into public.topics (slug, title_en, summary_en, body_en, reading_minutes, sort_order) values ('anon', 'T', 'S', 'B', 3, 1)$$, '42501', null, 'T-BR19-1: anon cannot add a Topic');
select throws_ok($$update public.topics set title_en = 'Changed'$$, '42501', null, 'T-BR19-1: anon cannot change Topics');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select throws_ok($$insert into public.resources (name, description_en, url, sort_order) values ('Mine', 'D', 'https://x.org', 1)$$, '42501', null, 'T-BR19-1: a User cannot add a Resource');
select throws_ok($$update public.safety_items set text_en = 'Changed'$$, '42501', null, 'T-BR19-1: a User cannot change Safety Guide items');
select throws_ok($$delete from public.family_tips$$, '42501', null, 'T-BR19-1: a User cannot delete family tips');
reset role;

select * from finish();
rollback;
