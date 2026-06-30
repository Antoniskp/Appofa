const {
  getVisibleAdminNavItems,
  getVisibleAdminNavSections,
} = require('../components/admin/adminNav');

describe('admin navigation registry', () => {
  test('keeps admin-only destinations away from moderators', () => {
    const moderatorHrefs = getVisibleAdminNavItems('moderator').map((item) => item.href);

    expect(moderatorHrefs).toContain('/admin/reports');
    expect(moderatorHrefs).toContain('/admin/locations');
    expect(moderatorHrefs).not.toContain('/admin/homepage');
    expect(moderatorHrefs).not.toContain('/admin/hero');
    expect(moderatorHrefs).not.toContain('/admin/geo');
    expect(moderatorHrefs).not.toContain('/admin/ip-rules');
    expect(moderatorHrefs).not.toContain('/admin/status');
    expect(moderatorHrefs).not.toContain('/admin/worker-status');
  });

  test('exposes operational sections for admins', () => {
    const sectionLabels = getVisibleAdminNavSections('admin').map((section) => section.label);
    const adminHrefs = getVisibleAdminNavItems('admin').map((item) => item.href);

    expect(sectionLabels).toEqual([
      'Overview',
      'Queues',
      'People & Orgs',
      'Content',
      'Locations',
      'System',
    ]);
    expect(adminHrefs).toContain('/admin/geo');
    expect(adminHrefs).toContain('/admin/worker-status');
  });
});
