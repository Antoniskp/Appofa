/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/dynamic', () => () => {
  const React = require('react');
  return function DynamicMapStub(props) {
    return React.createElement(
      'button',
      {
        type: 'button',
        'data-testid': 'webcam-map-stub',
        onClick: () => props.onChange({ lat: 37.9838123456, lng: 23.7275987654 }),
      },
      `Map stub ${props.lat ?? ''},${props.lng ?? ''}`
    );
  };
});

jest.mock('@/components/ui/CascadingLocationSelector', () => {
  const React = require('react');
  return function CascadingLocationSelectorMock({ value, onChange }) {
    return React.createElement(
      'select',
      {
        'data-testid': 'location-selector',
        value: value ?? '',
        onChange: (event) => onChange(event.target.value ? Number(event.target.value) : null),
      },
      [
        React.createElement('option', { key: 'empty', value: '' }, 'No location'),
        React.createElement('option', { key: '12', value: '12' }, 'Camera square'),
      ]
    );
  };
});

jest.mock('@/lib/api', () => ({ locationSectionAPI: {} }));
jest.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ error: jest.fn(), success: jest.fn() }),
}));

const { WebcamsEditor } = require('../components/LocationSectionManager');

describe('WebcamsEditor', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('updates exact pin coordinates from the map picker while preserving locationId', async () => {
    const onChange = jest.fn();

    await act(async () => {
      root.render(React.createElement(WebcamsEditor, {
        content: {
          webcams: [{ label: 'Harbour cam', url: 'https://cam.example.com/live', locationId: 12, lat: '', lng: '' }],
        },
        onChange,
      }));
    });

    expect(container.textContent).toContain('Exact map pin');
    expect(container.textContent).toContain('Optional associated location');

    await act(async () => {
      container.querySelector('[data-testid="webcam-map-stub"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith({
      webcams: [{
        label: 'Harbour cam',
        url: 'https://cam.example.com/live',
        locationId: 12,
        lat: 37.983812,
        lng: 23.727599,
      }],
    });
  });

  test('clears the exact pin without removing the associated location', async () => {
    const onChange = jest.fn();

    await act(async () => {
      root.render(React.createElement(WebcamsEditor, {
        content: {
          webcams: [{ label: 'Square cam', url: 'https://cam.example.com/live', locationId: 12, lat: 37.9, lng: 23.7 }],
        },
        onChange,
      }));
    });

    await act(async () => {
      const clearButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Clear pin');
      clearButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith({
      webcams: [{
        label: 'Square cam',
        url: 'https://cam.example.com/live',
        locationId: 12,
        lat: '',
        lng: '',
      }],
    });
  });
});
