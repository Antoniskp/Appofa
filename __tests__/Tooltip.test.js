// Basic tests for Tooltip component
// Tests the component by importing and verifying its structure

const Tooltip = require('../components/Tooltip');

describe('Tooltip', () => {
  it('should export Tooltip component', () => {
    expect(Tooltip).toBeDefined();
  });

  it('should be a function or object (React component)', () => {
    const type = typeof Tooltip.default || typeof Tooltip;
    expect(['function', 'object']).toContain(type);
  });

  it('should export TruncatedTextTooltip helper', () => {
    expect(Tooltip.TruncatedTextTooltip).toBeDefined();
  });

  it('should export TooltipIconButton helper', () => {
    expect(Tooltip.TooltipIconButton).toBeDefined();
  });
});
