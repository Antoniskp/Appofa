// Tests for the ReportButton component

describe('ReportButton component', () => {
  it('should export ReportButton as default', () => {
    const ReportButton = require('../../components/ReportButton');
    expect(ReportButton).toBeDefined();
    const type = typeof ReportButton.default || typeof ReportButton;
    expect(['function', 'object']).toContain(type);
  });

  it('should be a valid React component (function)', () => {
    const ReportButton = require('../../components/ReportButton');
    const component = ReportButton.default || ReportButton;
    expect(typeof component).toBe('function');
  });
});

// Tests for the reportAPI client module
describe('reportAPI client', () => {
  it('should export reportAPI', () => {
    const { reportAPI } = require('../../lib/api');
    expect(reportAPI).toBeDefined();
  });

  it('should have submit method', () => {
    const { reportAPI } = require('../../lib/api');
    expect(typeof reportAPI.submit).toBe('function');
  });

  it('should have getAll method', () => {
    const { reportAPI } = require('../../lib/api');
    expect(typeof reportAPI.getAll).toBe('function');
  });

  it('should have getById method', () => {
    const { reportAPI } = require('../../lib/api');
    expect(typeof reportAPI.getById).toBe('function');
  });

  it('should have getByContent method', () => {
    const { reportAPI } = require('../../lib/api');
    expect(typeof reportAPI.getByContent).toBe('function');
  });

  it('should have review method', () => {
    const { reportAPI } = require('../../lib/api');
    expect(typeof reportAPI.review).toBe('function');
  });
});

// Tests for the personRemovalRequestAPI client module
describe('personRemovalRequestAPI client', () => {
  it('should export personRemovalRequestAPI', () => {
    const { personRemovalRequestAPI } = require('../../lib/api');
    expect(personRemovalRequestAPI).toBeDefined();
  });

  it('should have submit method', () => {
    const { personRemovalRequestAPI } = require('../../lib/api');
    expect(typeof personRemovalRequestAPI.submit).toBe('function');
  });

  it('should have getAll method', () => {
    const { personRemovalRequestAPI } = require('../../lib/api');
    expect(typeof personRemovalRequestAPI.getAll).toBe('function');
  });

  it('should have getById method', () => {
    const { personRemovalRequestAPI } = require('../../lib/api');
    expect(typeof personRemovalRequestAPI.getById).toBe('function');
  });

  it('should have review method', () => {
    const { personRemovalRequestAPI } = require('../../lib/api');
    expect(typeof personRemovalRequestAPI.review).toBe('function');
  });
});
