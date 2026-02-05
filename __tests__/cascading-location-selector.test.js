/**
 * Test for CascadingLocationSelector component
 * This test validates the cascading dropdown functionality
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CascadingLocationSelector from '../components/CascadingLocationSelector';
import { locationAPI } from '../lib/api';

// Mock the locationAPI
jest.mock('../lib/api', () => ({
  locationAPI: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}));

describe('CascadingLocationSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render country dropdown on mount', async () => {
    locationAPI.getAll.mockResolvedValue({
      success: true,
      locations: [
        { id: 1, name: 'Greece', name_local: 'Ελλάδα', type: 'country' },
      ],
    });

    render(<CascadingLocationSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Country *')).toBeInTheDocument();
    });
  });

  it('should show prefecture dropdown after country selection', async () => {
    const mockCountries = [
      { id: 1, name: 'Greece', name_local: 'Ελλάδα', type: 'country' },
    ];
    const mockPrefectures = [
      { id: 2, name: 'Attica', name_local: 'Αττική', type: 'prefecture', parent_id: 1 },
    ];

    locationAPI.getAll
      .mockResolvedValueOnce({ success: true, locations: mockCountries })
      .mockResolvedValueOnce({ success: true, locations: mockPrefectures });

    const { container } = render(
      <CascadingLocationSelector value={null} onChange={mockOnChange} />
    );

    await waitFor(() => {
      expect(screen.getByText('Country *')).toBeInTheDocument();
    });

    // Select Greece
    const countrySelect = container.querySelector('select');
    fireEvent.change(countrySelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Prefecture')).toBeInTheDocument();
    });
  });

  it('should not show prefecture dropdown for International selection', async () => {
    const mockCountries = [
      { id: 1, name: 'Greece', name_local: 'Ελλάδα', type: 'country' },
    ];

    locationAPI.getAll.mockResolvedValueOnce({ success: true, locations: mockCountries });

    const { container } = render(
      <CascadingLocationSelector value={null} onChange={mockOnChange} />
    );

    await waitFor(() => {
      expect(screen.getByText('Country *')).toBeInTheDocument();
    });

    // Select International
    const countrySelect = container.querySelector('select');
    fireEvent.change(countrySelect, { target: { value: 'international' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('international');
    });

    // Prefecture dropdown should not appear
    expect(screen.queryByText('Prefecture')).not.toBeInTheDocument();
  });

  it('should show municipality dropdown after prefecture selection', async () => {
    const mockCountries = [
      { id: 1, name: 'Greece', name_local: 'Ελλάδα', type: 'country' },
    ];
    const mockPrefectures = [
      { id: 2, name: 'Attica', name_local: 'Αττική', type: 'prefecture', parent_id: 1 },
    ];
    const mockMunicipalities = [
      { id: 3, name: 'Athens', name_local: 'Αθήνα', type: 'municipality', parent_id: 2 },
    ];

    locationAPI.getAll
      .mockResolvedValueOnce({ success: true, locations: mockCountries })
      .mockResolvedValueOnce({ success: true, locations: mockPrefectures })
      .mockResolvedValueOnce({ success: true, locations: mockMunicipalities });

    const { container } = render(
      <CascadingLocationSelector value={null} onChange={mockOnChange} />
    );

    await waitFor(() => {
      expect(screen.getByText('Country *')).toBeInTheDocument();
    });

    // Select Greece
    const selects = container.querySelectorAll('select');
    fireEvent.change(selects[0], { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Prefecture')).toBeInTheDocument();
    });

    // Select Attica
    const prefectureSelect = container.querySelectorAll('select')[1];
    fireEvent.change(prefectureSelect, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText('City/Municipality')).toBeInTheDocument();
    });
  });

  it('should call onChange with correct location id', async () => {
    const mockCountries = [
      { id: 1, name: 'Greece', name_local: 'Ελλάδα', type: 'country' },
    ];

    locationAPI.getAll.mockResolvedValueOnce({ success: true, locations: mockCountries });

    const { container } = render(
      <CascadingLocationSelector value={null} onChange={mockOnChange} />
    );

    await waitFor(() => {
      expect(screen.getByText('Country *')).toBeInTheDocument();
    });

    // Select Greece
    const countrySelect = container.querySelector('select');
    fireEvent.change(countrySelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(1);
    });
  });

  it('should clear selection when clear button is clicked', async () => {
    const mockCountries = [
      { id: 1, name: 'Greece', name_local: 'Ελλάδα', type: 'country' },
    ];

    locationAPI.getAll.mockResolvedValueOnce({ success: true, locations: mockCountries });

    const { container } = render(
      <CascadingLocationSelector value={null} onChange={mockOnChange} allowClear={true} />
    );

    await waitFor(() => {
      expect(screen.getByText('Country *')).toBeInTheDocument();
    });

    // Select Greece
    const countrySelect = container.querySelector('select');
    fireEvent.change(countrySelect, { target: { value: '1' } });

    await waitFor(() => {
      const clearButton = screen.getByLabelText('Clear selection');
      expect(clearButton).toBeInTheDocument();
    });

    // Click clear button
    const clearButton = screen.getByLabelText('Clear selection');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });
});
