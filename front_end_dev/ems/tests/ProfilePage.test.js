import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import '@testing-library/jest-dom';
import ProfilePage from '../src/pages/Profile/User/ProfilePage'; // Adjust path as needed

// Mock the Navbar component
jest.mock('../src/pages/Profile/User/Navigation', () => () => <div data-testid="mock-navbar">Navbar</div>);

// Mock the UserProfile component
jest.mock('../src/pages/Profile/User/userProfile', () => ({ onSubmit }) => (
  <div data-testid="mock-user-profile">
    <button onClick={() => onSubmit({
      fullName: 'Jane Doe',
      address1: '123 Main St',
      address2: 'Apt 4B',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      skills: ['First Aid', 'Logistics'],
      preferences: 'Weekends',
      availability: 'Evenings',
    })}>
      Submit Profile
    </button>
  </div>
));

fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('ProfilePage', () => {
  test('renders loading state with UserProfile form when no profile data exists', () => {
    fetchMock.mockResponseOnce(JSON.stringify({}), { status: 404 });

    render(<ProfilePage />);

    expect(screen.getByText('Profile Management Form')).toBeInTheDocument();
    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-user-profile')).toBeInTheDocument();
  });

  test('renders profile data after successful fetch', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      fullName: 'John Doe',
      address1: '456 Oak Ave',
      address2: '',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      skills: ['Security', 'Social and Cultural'],
      preferences: 'Weekdays',
      availability: 'Mornings',
    }), { status: 200 });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Profile Management Form')).toBeInTheDocument();
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.getByText('Profile Information')).toBeInTheDocument();

      // Flexible text matchers
      expect(screen.getByText((content, element) => 
        element.tagName.toLowerCase() === 'p' && content.includes('Full Name: John Doe')
      )).toBeInTheDocument();

      expect(screen.getByText((content, element) => 
        element.tagName.toLowerCase() === 'p' && content.includes('Address 1: 456 Oak Ave')
      )).toBeInTheDocument();

      expect(screen.getByText((content, element) => 
        element.tagName.toLowerCase() === 'p' && content.includes('City: Chicago')
      )).toBeInTheDocument();

      expect(screen.getByText((content, element) => 
        element.tagName.toLowerCase() === 'p' && content.includes('Skills: Security, Social and Cultural')
      )).toBeInTheDocument();
    });
  });

  test('handles fetch error and renders UserProfile form', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Profile Management Form')).toBeInTheDocument();
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-user-profile')).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching profile data:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  test('updates profile data on form submission', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({}), { status: 404 });

    render(<ProfilePage />);

    const submitButton = screen.getByRole('button', { name: /Submit Profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Profile Management Form')).toBeInTheDocument();
      expect(screen.getByText('Profile Information')).toBeInTheDocument();

      // Flexible text matchers
      expect(screen.getByText((content, element) => 
        element.tagName.toLowerCase() === 'p' && content.includes('Full Name: Jane Doe')
      )).toBeInTheDocument();

      expect(screen.getByText((content, element) => 
        element.tagName.toLowerCase() === 'p' && content.includes('Address 1: 123 Main St')
      )).toBeInTheDocument();

      expect(screen.getByText((content, element) => 
        element.tagName.toLowerCase() === 'p' && content.includes('Skills: First Aid, Logistics')
      )).toBeInTheDocument();
    });
  });

  test('handles non-OK response and renders UserProfile form', async () => {
    fetchMock.mockResponseOnce('', { status: 500 });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Profile Management Form')).toBeInTheDocument();
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-user-profile')).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching profile data:',
        expect.objectContaining({ message: 'Profile data not found' })
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
