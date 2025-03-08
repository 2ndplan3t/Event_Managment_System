import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import '@testing-library/jest-dom';
import VolunteerHistory from '../src/pages/Profile/User/VolunteerHistory'; // Adjust path as needed

// Mock the Navbar component
jest.mock('./Navigation', () => () => <div data-testid="mock-navbar">Navbar</div>);

// Enable fetch mocking
fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('VolunteerHistory', () => {
  test('renders loading state initially', () => {
    render(<VolunteerHistory />);
    expect(screen.getByText('Volunteer History')).toBeInTheDocument(); // Header should render immediately
    // Loading state is handled by setting data after fetch, so table might not show yet
  });

  test('renders volunteer history table with data', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      profileData: {
        volunteerHistory: [
          {
            event: 'Charity Run',
            eventdesc: 'Running event for charity',
            location: 'City Park',
            date: '2025-03-01',
            status: 'Completed',
          },
          {
            event: 'Food Drive',
            eventdesc: 'Collecting food donations',
            location: 'Community Center',
            date: '2025-02-15',
            status: 'Pending',
          },
        ],
      },
    }), { status: 200 });

    render(<VolunteerHistory />);

    await waitFor(() => {
      expect(screen.getByText('Volunteer History')).toBeInTheDocument();
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.getByText('Charity Run')).toBeInTheDocument();
      expect(screen.getByText('Running event for charity')).toBeInTheDocument();
      expect(screen.getByText('City Park')).toBeInTheDocument();
      expect(screen.getByText('2025-03-01')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();

      expect(screen.getByText('Food Drive')).toBeInTheDocument();
      expect(screen.getByText('Collecting food donations')).toBeInTheDocument();
      expect(screen.getByText('Community Center')).toBeInTheDocument();
      expect(screen.getByText('2025-02-15')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Event Name')).toBeInTheDocument();
    expect(screen.getByText('Event Description')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Participation Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('renders "No volunteer history available" when history is empty', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      profileData: {
        volunteerHistory: [],
      },
    }), { status: 200 });

    render(<VolunteerHistory />);

    await waitFor(() => {
      expect(screen.getByText('Volunteer History')).toBeInTheDocument();
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.getByText('No volunteer history available')).toBeInTheDocument();
    });
  });

  test('renders table with no history when volunteerHistory is undefined', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      profileData: {},
    }), { status: 200 });

    render(<VolunteerHistory />);

    await waitFor(() => {
      expect(screen.getByText('Volunteer History')).toBeInTheDocument();
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.getByText('No volunteer history available')).toBeInTheDocument();
    });
  });

  test('handles fetch error', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'));

    // Mock console.error to verify error logging
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<VolunteerHistory />);

    await waitFor(() => {
      expect(screen.getByText('Volunteer History')).toBeInTheDocument();
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.queryByText('No volunteer history available')).toBeInTheDocument(); // Since error doesn't render an error message
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching profile:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  test('handles non-OK response from fetch', async () => {
    fetchMock.mockResponseOnce('', { status: 500 });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<VolunteerHistory />);

    await waitFor(() => {
      expect(screen.getByText('Volunteer History')).toBeInTheDocument();
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.getByText('No volunteer history available')).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching profile:',
        expect.objectContaining({ message: 'Profile fetch failed: 500 Internal Server Error' })
      );
    });

    consoleErrorSpy.mockRestore();
  });
});