import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EventManagement from '../src/pages/Profile/Admin/EventManagement'; // Adjust path

fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('EventManagement', () => {
  test('renders EventManagement component', () => {
    render(<EventManagement />);
    // Use more specific queries to avoid ambiguity
    expect(screen.getByRole('heading', { name: /Create Event/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Event Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Event Location/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Envoy Description/i)).toBeInTheDocument();
  });

  test('fetches events on load', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([{
      id: 1,
      name: 'Event 1',
      location: 'Location 1',
      envoy: 'Envoy 1',
      requiredSkills: [{ value: 'First Aid', label: 'First Aid' }],
      urgencyLevel: 'High',
      date: '2025-05-01',
      manager: 'Manager 1',
      selectedVolunteers: [],
    }]), { status: 200 });

    render(<EventManagement />);
    await waitFor(() => expect(screen.getByText(/Event 1/i)).toBeInTheDocument());
  });

  test('creates a new event', async () => {
    fetchMock.mockResponses(
      [JSON.stringify([]), { status: 200 }], // Initial fetchEvents
      [JSON.stringify({
        id: 2,
        name: 'New Event',
        location: 'New Location',
        envoy: 'New Envoy',
        requiredSkills: [{ value: 'Logistics', label: 'Logistics' }],
        urgencyLevel: 'Medium',
        date: '2025-06-01',
        manager: 'New Manager',
        selectedVolunteers: [],
      }), { status: 200 }]
    );

    render(<EventManagement />);

    await userEvent.type(screen.getByPlaceholderText(/Event Name/i), 'New Event');
    await userEvent.type(screen.getByPlaceholderText(/Event Location/i), 'New Location');
    await userEvent.type(screen.getByPlaceholderText(/Envoy Description/i), 'New Envoy');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /Urgency Level/i }), 'Medium');
    await userEvent.type(screen.getByPlaceholderText(/Manager Name/i), 'New Manager');
    await userEvent.click(screen.getByRole('button', { name: /Create Event/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5000/api/events',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"name":"New Event"'),
        })
      );
      expect(screen.getByText(/New Event/i)).toBeInTheDocument();
    });
  });

  test('handles delete event', async () => {
    fetchMock.mockResponses(
      [JSON.stringify([{
        id: 1,
        name: 'Event 1',
        location: 'Location 1',
        envoy: 'Envoy 1',
        requiredSkills: [{ value: 'First Aid', label: 'First Aid' }],
        urgencyLevel: 'High',
        date: '2025-05-01',
        manager: 'Manager 1',
        selectedVolunteers: [],
      }]), { status: 200 }],
      [JSON.stringify({ message: 'Event deleted successfully.' }), { status: 200 }]
    );

    render(<EventManagement />);
    await waitFor(() => expect(screen.getByText(/Event 1/i)).toBeInTheDocument());

    const deleteButton = screen.getAllByRole('button', { name: /Delete/i })[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5000/api/events/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(screen.queryByText(/Event 1/i)).not.toBeInTheDocument();
    });
  });

  test('matches volunteers to event', async () => {
    fetchMock.mockResponses(
      [JSON.stringify([{
        id: 1,
        name: 'Event 1',
        location: 'Location 1',
        envoy: 'Envoy 1',
        requiredSkills: [{ value: 'First Aid', label: 'First Aid' }],
        urgencyLevel: 'High',
        date: '2025-05-01',
        manager: 'Manager 1',
        selectedVolunteers: [],
      }]), { status: 200 }],
      [JSON.stringify([
        { id: 1, role: 'volunteer', fullName: 'John Doe', skills: ['First Aid'] },
      ]), { status: 200 }]
    );

    render(<EventManagement />);
    await waitFor(() => expect(screen.getByText(/Event 1/i)).toBeInTheDocument());

    const matchButton = screen.getAllByRole('button', { name: /Match Volunteers/i })[0];
    fireEvent.click(matchButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5000/api/users',
        expect.objectContaining({ method: 'GET' })
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});