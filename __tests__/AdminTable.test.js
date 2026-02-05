// Basic tests for AdminTable component
// Tests the component by importing and verifying its structure

const AdminTable = require('../components/admin/AdminTable');

describe('AdminTable', () => {
  it('should export AdminTable component', () => {
    expect(AdminTable).toBeDefined();
  });

  it('should be a function or object (React component)', () => {
    const type = typeof AdminTable.default || typeof AdminTable;
    expect(['function', 'object']).toContain(type);
  });
});
