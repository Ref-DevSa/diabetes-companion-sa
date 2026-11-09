import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyNotice } from '../../src/modals/PrivacyNotice';
import { PRIVACY_NOTICE_VERSION } from '../../src/lib/privacyNotice';

// PRD 8.2 M2, exact text (v0.5: the backup sentence changed for the Free plan, Section 18 question 40).
const sections: Array<[string, string]> = [
  [
    'What we collect',
    'Your email address, the glucose readings, notes and checklist items you save, your language choice, and the dates you agreed to this notice and confirmed you are 18 or older.',
  ],
  ['Why we collect it', 'To let you log in and keep your own diary and checklist. We do not sell your information or use it for adverts.'],
  [
    'Who can see it',
    "Only you. The app's administrator can see your information in the database only when strictly needed to fix a fault, and each time is recorded. Family members and caregivers cannot see your information in this version.",
  ],
  [
    'Where it is stored',
    'In a database run by Supabase in Frankfurt, Germany, which is outside South Africa. Sign-up emails are sent through Brevo.',
  ],
  [
    'How long we keep it',
    'Until you delete a reading or your account. The app keeps no backup copies, so deleted information is gone for good and cannot be brought back.',
  ],
  [
    'How to delete it',
    'Delete a reading in your Diary, or choose Delete account on your Profile screen to delete everything straight away. To ask for a copy of your information, email the contact below.',
  ],
  [
    'Health information',
    'Glucose readings are health information. By ticking "I agree to the Privacy Notice" you agree that we may store it for the reasons above.',
  ],
  ['Contact', 'Refilwe Segoe, Information Officer. Email address to be confirmed (see Section 13.3).'],
];

describe('M2 Privacy Notice', () => {
  afterEach(() => vi.restoreAllMocks());

  it('T-M2-1: shows every heading and text in PRD M2 (v0.5), in order', () => {
    render(<PrivacyNotice onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Privacy Notice' });
    const headings = within(dialog).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(sections.map(([heading]) => heading));
    for (const [, text] of sections) {
      expect(within(dialog).getByText(text)).toBeInTheDocument();
    }
  });

  it('T-M2-1: the notice version stored at sign-up is v0.5', () => {
    expect(PRIVACY_NOTICE_VERSION).toBe('v0.5');
  });

  it('T-M2-1: "Close" closes it; Escape closes it too', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PrivacyNotice onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('T-M2-1: works offline exactly as normal (the text is built in)', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    render(<PrivacyNotice onClose={vi.fn()} />);
    expect(screen.getByText(sections[0]?.[1] ?? '')).toBeInTheDocument();
  });

  it('T-M2-1: the body scrolls inside the modal', () => {
    render(<PrivacyNotice onClose={vi.fn()} />);
    expect(screen.getByTestId('privacy-notice-body')).toHaveClass('overflow-y-auto');
  });
});
