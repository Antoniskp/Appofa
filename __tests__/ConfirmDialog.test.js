// Basic tests for ConfirmDialog component
// Tests the component by importing and verifying its structure

const ConfirmDialog = require('../components/ConfirmDialog');

describe('ConfirmDialog', () => {
  it('should export ConfirmDialog component', () => {
    expect(ConfirmDialog).toBeDefined();
  });

  it('should be a function or object (React component)', () => {
    const type = typeof ConfirmDialog.default || typeof ConfirmDialog;
    expect(['function', 'object']).toContain(type);
  });
});
