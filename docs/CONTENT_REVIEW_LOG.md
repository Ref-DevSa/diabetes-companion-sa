# Content review log

Who reviewed what and when (PRD BR19, BR21, BR22; IMPLEMENTATION_PLAN.md launch gates L1 and L2).

* **Health content** (Topics, Safety Guide items, family tips, Resources and the Flag limits in BR5) must be reviewed by a qualified healthcare professional before `is_published` is set to true. Record the review here **and** in the row's `reviewed_at`, `reviewed_by` and `review_due` (12 months later) columns.
* **Translations** (isiZulu, Setswana) must be reviewed by a qualified translator before the language is switched on in `src/i18n/languages.ts`. Write the "What" column as `translation:zu` or `translation:tn` and the outcome as `reviewed`; the unit test T-BR21-1 looks for that row.
* Never write a reviewer's personal contact details here; name and role are enough.

| Date (DD Mon YYYY) | What (content or `translation:<code>`) | Reviewer (name and role) | Outcome | Next review due |
|-|-|-|-|-|
