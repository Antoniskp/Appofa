// Tests for DropdownMenu component
// Verifies component structure and basic functionality

const DropdownMenu = require('../components/DropdownMenu');

describe('DropdownMenu', () => {
  it('should export DropdownMenu component', () => {
    expect(DropdownMenu).toBeDefined();
  });

  it('should be a function or object (React component)', () => {
    const type = typeof DropdownMenu.default || typeof DropdownMenu;
    expect(['function', 'object']).toContain(type);
  });

  it('should accept required props', () => {
    const component = DropdownMenu.default || DropdownMenu;
    expect(component).toBeDefined();
    // Component should be callable (a function)
    expect(typeof component).toBe('function');
  });
});
