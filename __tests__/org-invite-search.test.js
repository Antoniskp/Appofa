/**
 * Tests for organization invite search UX and universal polls/suggestions reuse.
 *
 * Covers:
 * 1. The organization page uses PersonSearch for the invite flow (not a raw number input)
 * 2. The invite flow correctly handles real users, claimed persons, and non-invitable persons
 * 3. The polls tab uses PollCard instead of bespoke cards
 * 4. The suggestions tab uses SuggestionCard instead of bespoke cards
 * 5. New translation keys are present in both en.json and el.json
 */

const fs = require('fs');
const path = require('path');

const ORG_PAGE_PATH = path.join(__dirname, '../app/organizations/[slug]/page.js');
const EN_JSON_PATH = path.join(__dirname, '../messages/en.json');
const EL_JSON_PATH = path.join(__dirname, '../messages/el.json');

describe('Organization invite search UX', () => {
  let src;

  beforeAll(() => {
    src = fs.readFileSync(ORG_PAGE_PATH, 'utf8');
  });

  test('imports PersonSearch component', () => {
    expect(src).toContain("import PersonSearch from '@/components/dream-team/PersonSearch'");
  });

  test('does not use a numeric input for invite (old UX removed)', () => {
    // The old pattern was <input type="number" ... inviteUserId
    expect(src).not.toContain('type="number"');
    expect(src).not.toContain('inviteUserId');
  });

  test('uses PersonSearch for the invite UI', () => {
    expect(src).toContain('<PersonSearch');
    expect(src).toContain('onSelect={handleInviteSelect}');
  });

  test('handleInviteSelect checks entityType and claimStatus', () => {
    expect(src).toContain('entityType');
    expect(src).toContain('claimStatus');
    expect(src).toContain('invite_not_a_user');
  });

  test('invite button is disabled when no user is selected', () => {
    expect(src).toContain('disabled={actionLoading || !inviteSelectedUser}');
  });

  test('handleInvite uses inviteSelectedUser.id instead of raw integer', () => {
    expect(src).toContain('inviteSelectedUser.id');
  });

  test('invite search state replaces old inviteUserId state', () => {
    expect(src).toContain('inviteSelectedUser');
    expect(src).toContain('inviteDisplayName');
    expect(src).toContain('inviteSearchError');
  });

  test('claimed person invite resolves to claimedByUserId', () => {
    expect(src).toContain('claimedByUserId');
    // The handler uses claimedByUserId for the actual invite
    expect(src).toContain('result.claimedByUserId');
  });
});

describe('Organization polls tab uses PollCard', () => {
  let src;

  beforeAll(() => {
    src = fs.readFileSync(ORG_PAGE_PATH, 'utf8');
  });

  test('imports PollCard', () => {
    expect(src).toContain("import PollCard from '@/components/polls/PollCard'");
  });

  test('renders PollCard in tab_polls section', () => {
    expect(src).toContain('<PollCard key={poll.id} poll={poll}');
  });

  test('does not use bespoke inline poll card rendering (old pattern removed)', () => {
    // Old pattern rendered deadline/visibility inline as text spans
    expect(src).not.toContain('isPollClosed');
    expect(src).not.toContain('formatShortDate');
  });

  test('includes search input for polls', () => {
    expect(src).toContain('pollSearch');
    expect(src).toContain('setPollSearch');
  });
});

describe('Organization suggestions tab uses SuggestionCard', () => {
  let src;

  beforeAll(() => {
    src = fs.readFileSync(ORG_PAGE_PATH, 'utf8');
  });

  test('imports SuggestionCard', () => {
    expect(src).toContain("import SuggestionCard from '@/components/SuggestionCard'");
  });

  test('renders SuggestionCard in tab_suggestions section', () => {
    expect(src).toContain('<SuggestionCard key={suggestion.id} suggestion={suggestion}');
  });

  test('does not use bespoke inline suggestion card rendering (old pattern removed)', () => {
    // Old bespoke pattern rendered suggestion.body directly in a <p> tag
    expect(src).not.toContain('suggestion.body && <p');
    // And no longer has the inline type badge hardcoded per-suggestion
    expect(src).not.toContain('bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700');
  });

  test('includes search input for suggestions', () => {
    expect(src).toContain('suggestionSearch');
    expect(src).toContain('setSuggestionSearch');
  });
});

describe('Translation keys for invite search', () => {
  let en;
  let el;

  beforeAll(() => {
    en = JSON.parse(fs.readFileSync(EN_JSON_PATH, 'utf8'));
    el = JSON.parse(fs.readFileSync(EL_JSON_PATH, 'utf8'));
  });

  test('en.json has invite_no_user_selected', () => {
    expect(en.organizations.invite_no_user_selected).toBeTruthy();
  });

  test('en.json has invite_not_a_user', () => {
    expect(en.organizations.invite_not_a_user).toBeTruthy();
  });

  test('en.json has updated invite_user_id_placeholder (search focused)', () => {
    // Should now be a search placeholder, not numeric id
    expect(en.organizations.invite_user_id_placeholder).not.toMatch(/user id/i);
  });

  test('el.json has invite_no_user_selected', () => {
    expect(el.organizations.invite_no_user_selected).toBeTruthy();
  });

  test('el.json has invite_not_a_user', () => {
    expect(el.organizations.invite_not_a_user).toBeTruthy();
  });

  test('el.json invite_user_id_placeholder is updated to search placeholder', () => {
    expect(el.organizations.invite_user_id_placeholder).not.toMatch(/user id/i);
  });
});
