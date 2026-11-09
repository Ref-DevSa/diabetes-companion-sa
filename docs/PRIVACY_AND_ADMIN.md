# Privacy and admin rules

Confirmed decisions of 03 Nov 2026 (IMPLEMENTATION_PLAN.md Section 9.2; PRD BR24, BR25 and 12.4).
This file is the working rule book for the admin. If it and the PRD ever disagree, the PRD wins: fix this file.

## Who can see readings

* Only the User. The admin can see a User's data in the Supabase dashboard only when it is strictly necessary to fix a fault.
* **No family or caregiver access in v1** (PRD non-goal 4).
* No selling of data and no advertising (BR24).

## Admin accounts

* v1 has exactly one admin: the Information Officer (Refilwe Segoe). The Supabase organisation has no other members.
* The admin's Supabase account uses a strong password and two-step sign-in (PRD 12.3; launch gate L10).
* Content work (Topics, Safety Guide, family tips, Resources) never needs personal data: the admin uses the Table Editor on the four content tables only (`topics`, `safety_items`, `family_tips`, `resources`).

## Admin access log

* Each time the admin opens a table that holds personal data (`users`, `readings`, `checklist_items`, `checklist_ticks`, `auth.users`), they add one row to `docs/ADMIN_ACCESS_LOG.md`: date, time, reason, table, what was done.
* No access without a reason. (This is a manual record in v1; there are no admin screens.)

## Deletion

* The User deletes one Reading (S8, M4), one Custom Item (S9) or everything (S11, M3, which calls `delete_my_account`).
* Deletion is immediate and permanent in the live database (BR20).

## Backups

* The hosted project (region Central EU, Frankfurt) is on the Supabase **Free plan**, which keeps **no backups** (Supabase documentation, checked 09 Nov 2026: daily backups are for the Pro, Team and Enterprise plans only).
* So deletion is final: a deleted Reading, Item or account cannot be restored by anyone. The Privacy Notice (M2, version v0.5) says so.
* If a copy is ever needed (for example before a risky change), the admin exports the data by hand with `npx supabase db dump --remote`, keeps it encrypted, and deletes it when no longer needed; each export is written in `ADMIN_ACCESS_LOG.md`.
* If the project later moves to a paid plan, the backup period changes and M2 must be updated first.
* **Backup period:** none (Free plan), confirmed at launch gate L6 on 09 Nov 2026.

## Retention

* Personal data is kept until the User deletes it or deletes the account.
* `login_attempts` rows are removed after 24 hours.
* No automatic deletion of inactive accounts in v1. The decision is reviewed 12 months after launch.

## Consent

* Sign-up needs both tick boxes: "I confirm I am 18 or older" and "I agree to the Privacy Notice" (BR18).
* The database stores the time of each and the Privacy Notice version (`users.age_confirmed_at`, `users.privacy_agreed_at`, `users.privacy_notice_version`) and refuses an account without them (`handle_new_user`).

## Access to your own data

* A User can ask for a copy of their data by emailing the Information Officer. **Contact email:** to be added at launch gate L5.
* The admin exports that User's rows from the dashboard and logs it in `docs/ADMIN_ACCESS_LOG.md`.
* There is no self-service export in v1.

## Region

* Supabase Central EU (Frankfurt), because Supabase has no South African region (re-check at project creation: PRD assumption A7).
* Data is stored outside South Africa; M2 says so in plain words.
* A legal or facilitator review of the POPIA position is still to be done (launch gates L4 and L9).
