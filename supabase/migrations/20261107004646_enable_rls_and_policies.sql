-- Migration 6 (Section 8.6): Row-Level Security, policies (Section 9.1), column grants and function grants.
-- Order: switch RLS on, revoke everything from the app roles, then grant back only what is needed.

alter table public.users enable row level security;
alter table public.readings enable row level security;
alter table public.checklist_items enable row level security;
alter table public.checklist_ticks enable row level security;
alter table public.topics enable row level security;
alter table public.safety_items enable row level security;
alter table public.family_tips enable row level security;
alter table public.resources enable row level security;
alter table public.login_attempts enable row level security;

revoke all on table
  public.users, public.readings, public.checklist_items, public.checklist_ticks,
  public.topics, public.safety_items, public.family_tips, public.resources, public.login_attempts
  from anon, authenticated;

-- ---------------------------------------------------------------- users (SEC1 to SEC3)
grant select on public.users to authenticated;
grant update (language) on public.users to authenticated;

create policy users_select_own on public.users
  for select to authenticated
  using (id = (select auth.uid()));

create policy users_update_own_language on public.users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------- readings (SEC4 to SEC7)
-- created_at and updated_at are not granted, so the daily limit (BR9) cannot be dodged.
grant select, delete on public.readings to authenticated;
grant insert (user_id, value, taken_at, reading_when, note) on public.readings to authenticated;
grant update (value, taken_at, reading_when, note) on public.readings to authenticated;

create policy readings_select_own on public.readings
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy readings_insert_own on public.readings
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy readings_update_own on public.readings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy readings_delete_own on public.readings
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- checklist_items (SEC8 to SEC11)
-- is_standard, standard_key and sort_order are not granted: only the database sets them.
grant select, delete on public.checklist_items to authenticated;
grant insert (user_id, name) on public.checklist_items to authenticated;
grant update (name) on public.checklist_items to authenticated;

create policy items_select on public.checklist_items
  for select to authenticated
  using (is_standard or user_id = (select auth.uid()));

create policy items_insert_own_custom on public.checklist_items
  for insert to authenticated
  with check (user_id = (select auth.uid()) and not is_standard);

create policy items_update_own_custom on public.checklist_items
  for update to authenticated
  using (user_id = (select auth.uid()) and not is_standard)
  with check (user_id = (select auth.uid()) and not is_standard);

create policy items_delete_own_custom on public.checklist_items
  for delete to authenticated
  using (user_id = (select auth.uid()) and not is_standard);

-- ---------------------------------------------------------------- checklist_ticks (SEC12 to SEC15)
-- No update grant or policy: a tick is created or deleted (SEC14). Today (SAST) only (SEC13, SEC15).
grant select, delete on public.checklist_ticks to authenticated;
grant insert (user_id, item_id, tick_date) on public.checklist_ticks to authenticated;

create policy ticks_select_own on public.checklist_ticks
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy ticks_insert_own_today on public.checklist_ticks
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and tick_date = (now() at time zone 'Africa/Johannesburg')::date
    and exists (
      select 1 from public.checklist_items i
       where i.id = item_id
         and (i.is_standard or i.user_id = (select auth.uid()))
    )
  );

create policy ticks_delete_own_today on public.checklist_ticks
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and tick_date = (now() at time zone 'Africa/Johannesburg')::date
  );

-- ---------------------------------------------------------------- content tables (SEC16 to SEC20)
-- Everyone reads published rows; reviewed_by is never readable by the app. No insert, update or
-- delete for anon or authenticated: content is managed by the admin in the dashboard (SEC20).
grant select (
  id, slug, title_en, title_zu, title_tn, summary_en, summary_zu, summary_tn, body_en, body_zu, body_tn,
  reading_minutes, sort_order, is_published, reviewed_at, review_due, zu_reviewed_at, tn_reviewed_at, updated_at
) on public.topics to anon, authenticated;

grant select (
  id, section, text_en, text_zu, text_tn, sort_order, is_published, reviewed_at, review_due, zu_reviewed_at, tn_reviewed_at
) on public.safety_items to anon, authenticated;

grant select (
  id, text_en, text_zu, text_tn, sort_order, is_published, reviewed_at, review_due, zu_reviewed_at, tn_reviewed_at
) on public.family_tips to anon, authenticated;

grant select (
  id, name, description_en, description_zu, description_tn, url, sort_order, is_published,
  reviewed_at, review_due, zu_reviewed_at, tn_reviewed_at
) on public.resources to anon, authenticated;

create policy topics_select_published on public.topics
  for select to anon, authenticated
  using (is_published);

create policy safety_select_published on public.safety_items
  for select to anon, authenticated
  using (is_published);

create policy tips_select_published on public.family_tips
  for select to anon, authenticated
  using (is_published);

create policy resources_select_published on public.resources
  for select to anon, authenticated
  using (is_published);

-- ---------------------------------------------------------------- login_attempts (SEC21)
-- No grant and no policy: reached only through the functions below.

-- ---------------------------------------------------------------- functions (Section 10, SEC22)
revoke execute on function
  public.handle_new_user(),
  public.set_updated_at(),
  public.readings_validate(),
  public.readings_daily_limit(),
  public.checklist_items_custom_limit(),
  public.checklist_items_protect_standard(),
  public.check_login_allowed(text),
  public.record_failed_login(text),
  public.clear_my_login_attempts(),
  public.delete_my_account()
  from public, anon, authenticated;

grant execute on function public.check_login_allowed(text) to anon, authenticated;
grant execute on function public.record_failed_login(text) to anon, authenticated;
grant execute on function public.clear_my_login_attempts() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
