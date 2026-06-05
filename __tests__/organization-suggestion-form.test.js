const fs = require('fs');
const path = require('path');

const ORG_PAGE_PATH = path.join(__dirname, '../app/organizations/[slug]/page.js');
const EN_JSON_PATH = path.join(__dirname, '../messages/en.json');
const EL_JSON_PATH = path.join(__dirname, '../messages/el.json');
const RO_JSON_PATH = path.join(__dirname, '../messages/ro.json');

describe('Organization suggestion form parity fields', () => {
  let src;

  beforeAll(() => {
    src = fs.readFileSync(ORG_PAGE_PATH, 'utf8');
  });

  test('imports category/location dependencies', () => {
    expect(src).toContain("import CascadingLocationSelector from '@/components/ui/CascadingLocationSelector'");
    expect(src).toContain("import articleCategories from '@/config/articleCategories.json'");
  });

  test('includes category and location in default suggestion form state', () => {
    expect(src).toContain("category: ''");
    expect(src).toContain('locationId: null');
  });

  test('renders category selector and location selector in suggestion form', () => {
    expect(src).toContain("t('suggestion_category')");
    expect(src).toContain("t('suggestion_category_placeholder')");
    expect(src).toContain("t('suggestion_location')");
    expect(src).toContain('<CascadingLocationSelector');
    expect(src).toContain('articleCategories.suggestionCategories');
  });

  test('normalizes category/location in suggestion payload and resets form', () => {
    expect(src).toContain('const suggestionPayload = {');
    expect(src).toContain("category: suggestionForm.category || ''");
    expect(src).toContain('locationId: suggestionForm.locationId || null');
    expect(src).toContain('setSuggestionForm(DEFAULT_SUGGESTION_FORM)');
  });
});

describe('Organization suggestion category/location translations', () => {
  let en;
  let el;
  let ro;

  beforeAll(() => {
    en = JSON.parse(fs.readFileSync(EN_JSON_PATH, 'utf8'));
    el = JSON.parse(fs.readFileSync(EL_JSON_PATH, 'utf8'));
    ro = JSON.parse(fs.readFileSync(RO_JSON_PATH, 'utf8'));
  });

  test('en has organization suggestion category/location labels', () => {
    expect(en.organizations.suggestion_category).toBeTruthy();
    expect(en.organizations.suggestion_category_placeholder).toBeTruthy();
    expect(en.organizations.suggestion_location).toBeTruthy();
  });

  test('el has organization suggestion category/location labels', () => {
    expect(el.organizations.suggestion_category).toBeTruthy();
    expect(el.organizations.suggestion_category_placeholder).toBeTruthy();
    expect(el.organizations.suggestion_location).toBeTruthy();
  });

  test('ro has organization suggestion category/location labels', () => {
    expect(ro.organizations.suggestion_category).toBeTruthy();
    expect(ro.organizations.suggestion_category_placeholder).toBeTruthy();
    expect(ro.organizations.suggestion_location).toBeTruthy();
  });
});
