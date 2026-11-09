// Fake content from PRD 8.4 and S6 for component tests (no network).
import type { FamilyTip, Resource, SafetyItem, Topic } from '../../src/data/content';

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

/** The three Resources from PRD 8.4. */
export const fakeResources: Resource[] = [
  {
    id: 'res-1',
    name: 'Diabetes South Africa',
    description: 'A non-profit that supports and speaks up for people with diabetes in South Africa',
    url: 'https://www.diabetessa.org.za',
  },
  {
    id: 'res-2',
    name: 'SEMDSA',
    description: 'The Society for Endocrinology, Metabolism and Diabetes of South Africa: guidelines and news',
    url: 'https://www.semdsa.org.za',
  },
  { id: 'res-3', name: 'National Department of Health', description: 'Public health services, clinic information and health campaigns', url: 'https://www.health.gov.za' },
];

/** The five family tips from PRD 8.4. */
export const fakeTips: FamilyTip[] = [
  'Learn the signs of low and high blood sugar so you can spot them early.',
  'Ask how you can help instead of taking over.',
  'Offer to go to clinic visits if they would like company.',
  'Plan meals together and keep healthy snacks at home.',
  'Know the emergency numbers: 112 from a cell phone and 10177 for an ambulance.',
].map((text, index) => ({ id: `tip-${index + 1}`, text }));
