-- LOCAL DEVELOPMENT AND TEST DATA ONLY (IMPLEMENTATION_PLAN.md Section 8.7).
-- Loaded by `npm run db:reset`. NEVER run this on the hosted project: the review stamps below are
-- fake ("TEST DATA (not reviewed)") so screens can be built and tested. Real content is entered and
-- reviewed by a qualified person under launch gates L1 and L2.
-- The four Standard Items come from migration 3 (they are needed in every database).
-- Test accounts and their sample data are created by scripts/seed-users.mjs.

-- Topics (PRD 8.4). Bodies are placeholders (design correction D7).
insert into public.topics (slug, title_en, summary_en, body_en, reading_minutes, sort_order, is_published, reviewed_at, reviewed_by, review_due) values
  ('what-is-diabetes', 'What is diabetes?', 'The basics in plain words',
   'DRAFT: NOT REVIEWED. This is placeholder text for development. The real Topic will be added after a qualified healthcare professional has reviewed it.',
   3, 1, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('type-2-diabetes-basics', 'Type 2 diabetes basics', 'What it is and how it is managed',
   'DRAFT: NOT REVIEWED. This is placeholder text for development. The real Topic will be added after a qualified healthcare professional has reviewed it.',
   4, 2, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('eating-well', 'Eating well', 'Simple ideas for everyday meals',
   'DRAFT: NOT REVIEWED. This is placeholder text for development. The real Topic will be added after a qualified healthcare professional has reviewed it.',
   4, 3, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('moving-more', 'Moving more', 'Gentle ways to be active',
   'DRAFT: NOT REVIEWED. This is placeholder text for development. The real Topic will be added after a qualified healthcare professional has reviewed it.',
   3, 4, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('check-ups-and-complications', 'Check-ups and complications', 'Why clinic visits matter',
   'DRAFT: NOT REVIEWED. This is placeholder text for development. The real Topic will be added after a qualified healthcare professional has reviewed it.',
   4, 5, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('supporting-someone-with-diabetes', 'Supporting someone with diabetes', 'How family and friends can help',
   'DRAFT: NOT REVIEWED. This is placeholder text for development. The real Topic will be added after a qualified healthcare professional has reviewed it.',
   3, 6, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months');

-- Safety Guide lists (PRD 8.2, S6). The emergency box is built into the app, not stored here (BR19).
insert into public.safety_items (section, text_en, sort_order, is_published, reviewed_at, reviewed_by, review_due) values
  ('low', 'Shaking or feeling jittery', 1, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('low', 'Sweating', 2, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('low', 'Sudden hunger', 3, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('low', 'Feeling dizzy or confused', 4, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('low', 'A fast heartbeat', 5, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('high', 'Feeling very thirsty', 1, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('high', 'Passing urine more often', 2, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('high', 'Blurred eyesight', 3, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('high', 'Feeling very tired', 4, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('high', 'Feeling sick (nausea)', 5, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('urgent', 'The person is unconscious or cannot be woken', 1, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('urgent', 'They are very confused or cannot speak clearly', 2, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('urgent', 'They have a fit (seizure)', 3, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('urgent', 'They breathe fast and deeply, or keep vomiting', 4, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('urgent', 'You are not sure. It is always safer to call', 5, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months');

-- Family tips (PRD 8.4)
insert into public.family_tips (text_en, sort_order, is_published, reviewed_at, reviewed_by, review_due) values
  ('Learn the signs of low and high blood sugar so you can spot them early.', 1, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('Ask how you can help instead of taking over.', 2, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('Offer to go to clinic visits if they would like company.', 3, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('Plan meals together and keep healthy snacks at home.', 4, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('Know the emergency numbers: 112 from a cell phone and 10177 for an ambulance.', 5, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months');

-- Resources (PRD 8.4). Links still to be opened and checked before launch (assumption A9, gate L8).
insert into public.resources (name, description_en, url, sort_order, is_published, reviewed_at, reviewed_by, review_due) values
  ('Diabetes South Africa', 'A non-profit that supports and speaks up for people with diabetes in South Africa', 'https://www.diabetessa.org.za', 1, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('SEMDSA', 'The Society for Endocrinology, Metabolism and Diabetes of South Africa: guidelines and news', 'https://www.semdsa.org.za', 2, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months'),
  ('National Department of Health', 'Public health services, clinic information and health campaigns', 'https://www.health.gov.za', 3, true, current_date, 'TEST DATA (not reviewed)', current_date + interval '12 months');
