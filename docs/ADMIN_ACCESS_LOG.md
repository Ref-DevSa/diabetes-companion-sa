# Admin access log

One row each time the admin opens a table that holds a User's personal data (`users`, `readings`, `checklist_items`, `checklist_ticks`, `auth.users`) in the Supabase dashboard. See `docs/PRIVACY_AND_ADMIN.md`.

Rules: no access without a reason; write the row on the same day; never copy personal data (emails, readings, notes) into this file.

| Date (DD Mon YYYY) | Time (SAST) | Reason | Table(s) | What was done |
|-|-|-|-|-|
