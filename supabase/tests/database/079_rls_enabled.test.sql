-- T-SEC-23: every table in public has Row-Level Security switched on.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select is_empty(
  $$select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity$$,
  'T-SEC-23: no table in public has RLS switched off');

select tables_are(
  'public',
  array['users', 'readings', 'checklist_items', 'checklist_ticks', 'topics', 'safety_items', 'family_tips', 'resources', 'login_attempts'],
  'T-SEC-23: public has exactly the 9 planned tables');

-- No function is executable by PUBLIC (Section 8.6: revoke from public, then grant by role)
select is_empty(
  $$select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('public', p.oid, 'execute')$$,
  'T-SEC-23: no public function can be executed by PUBLIC');

select * from finish();
rollback;
