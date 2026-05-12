jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

const { redirect } = require('next/navigation');
const PagesRoute = require('../app/(statics)/pages/page').default;

describe('/pages route deprecation', () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  test('redirects legacy /pages visits to /platform', () => {
    PagesRoute();
    expect(redirect).toHaveBeenCalledWith('/platform');
  });
});
