/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mockCreate = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('next-intl', () => ({ useTranslations: () => (key) => key }));
jest.mock('next/dynamic', () => () => function MapStub() { return null; });
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, role: 'viewer' }, loading: false }),
}));
jest.mock('@/lib/api', () => ({
  organizationAPI: { create: (...args) => mockCreate(...args) },
}));
jest.mock('@/components/ui/AlertMessage', () => () => null);
jest.mock('@/components/ui/SkeletonLoader', () => () => null);

const NewOrganizationPage = require('../app/organizations/new/page').default;
const { types } = require('../config/organizationTypes.json');

test('offers every organization type and submits the selection with contextual help', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mockCreate.mockResolvedValue({ data: { organization: { slug: 'new-entity' } } });
  try {
    await act(async () => root.render(React.createElement(NewOrganizationPage)));
    const select = container.querySelector('select');
    expect(Array.from(select.options, option => option.value)).toEqual(types);
    expect(select.value).toBe('organization');
    expect(container.textContent).toContain('create_intro');
    for (const type of types) {
      await act(async () => {
        select.value = type;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      expect(container.textContent).toContain(`type_hint_${type}`);
      expect(container.textContent).toContain(type === 'block' ? 'create_block_intro' : 'create_intro');
      await act(async () => {
        container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      expect(mockCreate).toHaveBeenLastCalledWith(expect.objectContaining({ type, isPublic: false }));
      expect(mockPush).toHaveBeenLastCalledWith('/organizations/new-entity');
    }
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
