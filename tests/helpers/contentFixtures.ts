// Fake content from PRD 8.4 and S6 for component tests (no network).
import type { SafetyItem, Topic } from '../../src/data/content';

const titles: Array<[string, string, string, number]> = [
  ['what-is-diabetes', 'What is diabetes?', 'The basics in plain words', 3],
  ['type-2-diabetes-basics', 'Type 2 diabetes basics', 'What it is and how it is managed', 4],
  ['eating-well', 'Eating well', 'Simple ideas for everyday meals', 4],
  ['moving-more', 'Moving more', 'Gentle ways to be active', 3],
  ['check-ups-and-complications', 'Check-ups and complications', 'Why clinic visits matter', 4],
  ['supporting-someone-with-diabetes', 'Supporting someone with diabetes', 'How family and friends can help', 3],
];

export const fakeTopics: Topic[] = titles.map(([slug, title, summary, readingMinutes], index) => ({
  id: `topic-${index + 1}`,
  slug,
  title,
  summary,
  body: `Body text for ${title}`,
  readingMinutes,
  reviewedAt: '2026-10-27',
}));

const lists: Array<[SafetyItem['section'], string[]]> = [
  ['low', ['Shaking or feeling jittery', 'Sweating', 'Sudden hunger', 'Feeling dizzy or confused', 'A fast heartbeat']],
  ['high', ['Feeling very thirsty', 'Passing urine more often', 'Blurred eyesight', 'Feeling very tired', 'Feeling sick (nausea)']],
  [
    'urgent',
    [
      'The person is unconscious or cannot be woken',
      'They are very confused or cannot speak clearly',
      'They have a fit (seizure)',
      'They breathe fast and deeply, or keep vomiting',
      'You are not sure. It is always safer to call',
    ],
  ],
];

export const fakeSafetyItems: SafetyItem[] = lists.flatMap(([section, texts]) =>
  texts.map((text, index) => ({
    id: `${section}-${index + 1}`,
    section,
    text,
    reviewedAt: section === 'urgent' && index === 0 ? '2026-11-03' : '2026-10-27',
  })),
);
