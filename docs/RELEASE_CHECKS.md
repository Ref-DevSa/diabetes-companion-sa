# Release checks run by the human (Phase 9)

## T-REL-5: Row-Level Security on the hosted project

Run this **read-only** query in the hosted project: Supabase dashboard → SQL Editor → New query → paste → Run.
It changes nothing.

```sql
-- Every table in the public schema must show rls_enabled = true. Expect 9 rows, all true.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;
```

**Pass when:** 9 rows (`checklist_items`, `checklist_ticks`, `family_tips`, `login_attempts`, `readings`, `resources`, `safety_items`, `topics`, `users`) and every `rls_enabled` is `true`.

Then check that a Visitor (no login) gets no Readings. In a terminal (Git Bash), with the hosted values from Supabase → Project Settings → API (the **publishable** key only, never the secret key):

```bash
curl -s "https://YOUR-PROJECT.supabase.co/rest/v1/readings?select=id" -H "apikey: YOUR-PUBLISHABLE-KEY"
```

**Pass when:** the answer is `[]` (no rows), or an error saying permission denied. Anything with an `id` in it is a fail: stop and tell the agent.

Write the date and the result in the Phase 9 row of IMPLEMENTATION_PLAN.md Section 17 (the agent does this when you report back).

## T-REL-2 and T-REL-3: the live app

1. In `.env` set `LIVE_BASE_URL` to the live https address, and `LIVE_TEST_EMAIL` to a real inbox you can open now (use a new address, or one that has no account yet).
2. Run `npm run test:live`.
3. When the test prints "Open the inbox of …", open that email (check it is **not** in spam: risk R3) and tap **Confirm your email**. The test then logs in, saves a Reading, logs out and deletes the account by itself.
