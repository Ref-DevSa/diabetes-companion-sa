# Launch gates

Copied from IMPLEMENTATION_PLAN.md Section 18.2. These do not block building (Phases 1 to 8); they block Phase 9 and the release.
Tick each one (`[x]`) only when it is done, and write the date and evidence. The release test T-REL-1 fails until all ten are ticked.

| Done | # | Gate | Owner | Done when | Date and evidence |
|-|-|-|-|-|-|
| [ ] | L1 | Medical review of all health content, Flag limits (BR5) and the Safety Guide | A qualified healthcare professional (name to be added by the human) | Name, role and date recorded in `CONTENT_REVIEW_LOG.md`; `reviewed_at` / `reviewed_by` / `review_due` set on every published row | |
| [ ] | L2 | Human translation and review for each language switched on | Qualified translators | `zu_reviewed_at` / `tn_reviewed_at` set; `languages.ts` flag set; log entry | |
| [ ] | L3 | GitHub repository name, and the concept document link | Refilwe | Added to PRD Document details and the plan's Section 0 | |
| [ ] | L4 | Legal review of the Privacy Notice and the transfer of health data to Frankfurt under POPIA | Facilitator or a legal adviser | Written outcome saved in `docs/`, M2 updated | |
| [ ] | L5 | Information Officer contact email | Refilwe | Added to M2 and the PRD (Open question Q6) | |
| [ ] | L6 | Hosted Supabase project created in Frankfurt; backup period checked | Refilwe | Region confirmed; days written in M2 and `PRIVACY_AND_ADMIN.md` | 09 Nov 2026: project `hlzfnfrxawujgofitgfc`, region Central EU (Frankfurt); no African region offered. 6 migrations pushed (`db push --remote`); RLS on all 9 tables (T-REL-5 query). Free plan: no backups; M2 v0.5 and `PRIVACY_AND_ADMIN.md` updated (question 40). Waiting for the human to tick. |
| [ ] | L7 | Brevo account and SMTP connected; real email delivered to inbox | Refilwe | T-REL-3 passes | |
| [ ] | L8 | Every Resource link opened and correct (A9) | Refilwe | Ticked | |
| [ ] | L9 | Facilitator accepts Frankfurt as the data region (Q9) | Facilitator | Recorded | |
| [ ] | L10 | Admin Supabase account has a strong password and two-step sign-in | Refilwe | Ticked | |
