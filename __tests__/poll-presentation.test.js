/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let mockChartProps;
jest.mock('react-chartjs-2', () => {
  const Chart = require('react').forwardRef((props, _ref) => { mockChartProps = props; return null; });
  return { Bar: Chart, Pie: Chart, Doughnut: Chart };
});
jest.mock('@/lib/api', () => ({ pollAPI: {} }));
const Results = require('../components/polls/PollResults').default;
const Ballot = require('../components/polls/PartyBallot').default;

const poll = { id: 44, type: 'simple', purpose: 'voting_intention', options: [
  { id: 1, text: 'ΠΑΣΟΚ', voteCount: 1 },
  { id: 2, text: 'Νέα Δημοκρατία', voteCount: 3 },
  { id: 3, text: 'Δεν έχω αποφασίσει', voteCount: 0 },
] };
describe('Poll presentation', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  test('party selection is separate from submission and neutral choices have their own fieldset', async () => {
    const onSelect = jest.fn();
    await act(async () => root.render(<Ballot poll={poll} selectedOptionId={2} onSelect={onSelect} />));
    const groups = container.querySelectorAll('fieldset');
    expect(groups).toHaveLength(2);
    expect(groups[0].querySelectorAll('input')).toHaveLength(2);
    expect(groups[1].textContent).toContain('Δεν έχω αποφασίσει');
    expect(container.querySelector('input[value="2"]').checked).toBe(true);
    await act(async () => container.querySelector('input[value="1"]').click());
    expect(onSelect).toHaveBeenCalledWith(1);
    expect(container.querySelector('button')).toBeNull();
  });
  test('chart interactions highlight the correct legend entry, retaining colors when sorted', async () => {
    await act(async () => root.render(<Results poll={poll} />));
    const originalColors = [...mockChartProps.data.datasets[0].backgroundColor];
    await act(async () => mockChartProps.options.onClick(null, [{ index: 1 }]));
    expect(container.querySelector('button[aria-label^="Νέα Δημοκρατία:"]').getAttribute('aria-pressed')).toBe('true');
    await act(async () => container.querySelector('button[aria-label="Εναλλαγή σειράς ταξινόμησης"]').click());
    expect(mockChartProps.data.labels[0]).toBe('Νέα Δημοκρατία');
    expect(mockChartProps.data.datasets[0].backgroundColor[0]).toBe(originalColors[1]);
    await act(async () => mockChartProps.options.onHover(null, [{ index: 1 }]));
    expect(container.querySelector('button[aria-label^="ΠΑΣΟΚ:"]').getAttribute('aria-pressed')).toBe('true');
  });
});
