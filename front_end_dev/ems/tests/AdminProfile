import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; // For testing Link and navigation
import fetchMock from 'jest-fetch-mock';
import '@testing-library/jest-dom';
import AdminProfile from '../src/pages/Profile/Admin/Admin'; // Adjust path as needed

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="mock-icon" />,
}));

// Enable fetch mocking
fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();
  localStorage.clear(); // Clear localStorage before each test
});

describe('AdminProfile', () => {
  const mockNavigate = jest.fn();

  // Mock useNavigate
  beforeAll(() => {
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    render(
      <MemoryRouter>
        <AdminProfile />
      </MemoryRouter>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders admin profile data successfully', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      fullName: 'John Doe',
      id: '123',
      email: 'john.doe@example.com',
    }), { status: 200 });

    render(
      <MemoryRouter>
        <AdminProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Admin Profile/i)).toBeInTheDocument();
      expect(screen.getByText('Full Name: John Doe')).toBeInTheDocument();
      expect(screen.getByText('ID: 123')).toBeInTheDocument();
      expect(screen.getByText('Email: john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });
  });

  test('displays error for unauthorized access (401)', async () => {
    fetchMock.mockResponseOnce('', { status: 401 });

    render(
      <MemoryRouter>
        <AdminProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Session expired. Redirecting to login...')).toBeInTheDocument();
    });

    // Check if navigate was called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 3000 }); // Match the 2000ms timeout + buffer
  });

  test('displays error for forbidden access (403)', async () => {
    fetchMock.mockResponseOnce('', { status: 403 });

    render(
      <MemoryRouter>
        <AdminProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Access denied: Admins only. Redirecting to home...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    }, { timeout: 3000 });
  });

  test('displays generic error on fetch failure', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <AdminProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch admin data')).toBeInTheDocument();
    });
  });

  test('handles logout successfully', async () => {
    fetchMock.mockResponses(
      [JSON.stringify({
        fullName: 'John Doe',
        id: '123',
        email: 'john.doe@example.com',
      }), { status: 200 }],
      ['', { status: 200 }] // Logout response
    );

    render(
      <MemoryRouter>
        <AdminProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Full Name: John Doe')).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5000/api/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('adminId')).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles logout failure', async () => {
    fetchMock.mockResponses(
      [JSON.stringify({
        fullName: 'John Doe',
        id: '123',
        email: 'john.doe@example.com',
      }), { status: 200 }],
      ['', { status: 500 }] // Failed logout
    );

    // Mock console.error to verify error logging
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <AdminProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Full Name: John Doe')).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      expect(localStorage.getItem('user')).toBeNull(); // Still removes items despite failure
      expect(localStorage.getItem('adminId')).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    consoleErrorSpy.mockRestore();
  });
});