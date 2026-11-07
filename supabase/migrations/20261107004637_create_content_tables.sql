-- Migration 4 (Section 8.6): topics, safety_items, family_tips, resources.
-- content_review_ok (BR21, BR22): nothing is published without a recorded review, and no
-- isiZulu or Setswana text is stored without its translation review date.

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 60),
  title_en text not null check (char_length(title_en) <= 100),
  title_zu text check (char_length(title_zu) <= 100),
  title_tn text check (char_length(title_tn) <= 100),
  summary_en text not null check (char_length(summary_en) <= 160),
  summary_zu text check (char_length(summary_zu) <= 160),
  summary_tn text check (char_length(summary_tn) <= 160),
  body_en text not null check (char_length(body_en) <= 5000),
  body_zu text check (char_length(body_zu) <= 5000),
  body_tn text check (char_length(body_tn) <= 5000),
  reading_minutes integer not null check (reading_minutes between 1 and 15),
  sort_order integer not null,
  is_published boolean not null default false,
  reviewed_at date,
  reviewed_by text,
  review_due date,
  zu_reviewed_at date,
  tn_reviewed_at date,
  updated_at timestamptz not null default now(),
  constraint topics_content_review_ok check (
    (not is_published or (reviewed_at is not null and reviewed_by is not null and btrim(reviewed_by) <> ''))
    and ((title_zu is null and summary_zu is null and body_zu is null) or zu_reviewed_at is not null)
    and ((title_tn is null and summary_tn is null and body_tn is null) or tn_reviewed_at is not null)
  )
);

create table public.safety_items (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('low', 'high', 'urgent')),
  text_en text not null check (char_length(text_en) <= 200),
  text_zu text check (char_length(text_zu) <= 200),
  text_tn text check (char_length(text_tn) <= 200),
  sort_order integer not null,
  is_published boolean not null default false,
  reviewed_at date,
  reviewed_by text,
  review_due date,
  zu_reviewed_at date,
  tn_reviewed_at date,
  constraint safety_items_content_review_ok check (
    (not is_published or (reviewed_at is not null and reviewed_by is not null and btrim(reviewed_by) <> ''))
    and (text_zu is null or zu_reviewed_at is not null)
    and (text_tn is null or tn_reviewed_at is not null)
  )
);

create table public.family_tips (
  id uuid primary key default gen_random_uuid(),
  text_en text not null check (char_length(text_en) <= 200),
  text_zu text check (char_length(text_zu) <= 200),
  text_tn text check (char_length(text_tn) <= 200),
  sort_order integer not null,
  is_published boolean not null default false,
  reviewed_at date,
  reviewed_by text,
  review_due date,
  zu_reviewed_at date,
  tn_reviewed_at date,
  constraint family_tips_content_review_ok check (
    (not is_published or (reviewed_at is not null and reviewed_by is not null and btrim(reviewed_by) <> ''))
    and (text_zu is null or zu_reviewed_at is not null)
    and (text_tn is null or tn_reviewed_at is not null)
  )
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  description_en text not null check (char_length(description_en) <= 200),
  description_zu text check (char_length(description_zu) <= 200),
  description_tn text check (char_length(description_tn) <= 200),
  url text not null check (url ~ '^https://' and char_length(url) <= 300),
  sort_order integer not null,
  is_published boolean not null default false,
  reviewed_at date,
  reviewed_by text,
  review_due date,
  zu_reviewed_at date,
  tn_reviewed_at date,
  constraint resources_content_review_ok check (
    (not is_published or (reviewed_at is not null and reviewed_by is not null and btrim(reviewed_by) <> ''))
    and (description_zu is null or zu_reviewed_at is not null)
    and (description_tn is null or tn_reviewed_at is not null)
  )
);

create index topics_published_sort_idx on public.topics (is_published, sort_order);
create index safety_items_published_section_sort_idx on public.safety_items (is_published, section, sort_order);
create index family_tips_published_sort_idx on public.family_tips (is_published, sort_order);
create index resources_published_sort_idx on public.resources (is_published, sort_order);

create trigger set_updated_at
  before update on public.topics
  for each row execute function public.set_updated_at();
