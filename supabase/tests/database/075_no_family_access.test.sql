-- T-BR24-2: no policy gives one User (or a Visitor) access to another User's data.
-- Lists every policy in public and fails on any one that is not in Section 9.1.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select results_eq(
  $$select tablename::text collate "default", policyname::text collate "default", cmd::text collate "default", array_to_string(roles, ',') collate "default"
      from pg_policies where schemaname = 'public'
     order by tablename, policyname$$,
  $$values
    ('checklist_items', 'items_delete_own_custom', 'DELETE', 'authenticated'),
    ('checklist_items', 'items_insert_own_custom', 'INSERT', 'authenticated'),
    ('checklist_items', 'items_select', 'SELECT', 'authenticated'),
    ('checklist_items', 'items_update_own_custom', 'UPDATE', 'authenticated'),
    ('checklist_ticks', 'ticks_delete_own_today', 'DELETE', 'authenticated'),
    ('checklist_ticks', 'ticks_insert_own_today', 'INSERT', 'authenticated'),
    ('checklist_ticks', 'ticks_select_own', 'SELECT', 'authenticated'),
    ('family_tips', 'tips_select_published', 'SELECT', 'anon,authenticated'),
    ('readings', 'readings_delete_own', 'DELETE', 'authenticated'),
    ('readings', 'readings_insert_own', 'INSERT', 'authenticated'),
    ('readings', 'readings_select_own', 'SELECT', 'authenticated'),
    ('readings', 'readings_update_own', 'UPDATE', 'authenticated'),
    ('resources', 'resources_select_published', 'SELECT', 'anon,authenticated'),
    ('safety_items', 'safety_select_published', 'SELECT', 'anon,authenticated'),
    ('topics', 'topics_select_published', 'SELECT', 'anon,authenticated'),
    ('users', 'users_select_own', 'SELECT', 'authenticated'),
    ('users', 'users_update_own_language', 'UPDATE', 'authenticated')$$,
  'T-BR24-2: the only policies are the ones in Section 9.1'
);

select is_empty(
  $$select policyname from pg_policies
     where schemaname = 'public'
       and tablename in ('users', 'readings', 'checklist_ticks')
       and coalesce(qual, '') || coalesce(with_check, '') not like '%auth.uid()%'$$,
  'T-BR24-2: every policy on personal data is tied to the logged-in User (auth.uid())'
);

select is_empty(
  $$select policyname from pg_policies
     where schemaname = 'public'
       and tablename in ('users', 'readings', 'checklist_items', 'checklist_ticks')
       and 'anon' = any (roles)$$,
  'T-BR24-2: no policy on personal data applies to Visitors'
);

select is_empty(
  $$select policyname from pg_policies where schemaname = 'public' and permissive = 'PERMISSIVE' and qual = 'true'$$,
  'T-BR24-2: no policy lets everyone see every row'
);

select * from finish();
rollback;
