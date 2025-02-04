import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState({
    name: '',
    location: '',
    envoy: '',
    volunteers: 0,
    date: new Date(),
  });

  const [volunteers, setVolunteers] = useState([]);
  const [managers, setManagers] = useState([]);

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventDetails({ ...eventDetails, [name]: value });
  };

  const handleDateChange = (date) => {
    setEventDetails({ ...eventDetails, date });
  };

  const handleCreateEvent = () => {
    setEvents([...events, { ...eventDetails, id: events.length + 1 }]);
    setEventDetails({
      name: '',
      location: '',
      envoy: '',
      volunteers: 0,
      date: new Date()
    });
  };

  const handleAddVolunteer = (eventId) => {
    const newVolunteers = [...volunteers, { eventId, name: `Volunteer ${volunteers.length + 1}` }];
    setVolunteers(newVolunteers);
  };

  const handleAddManager = (eventId) => {
    const newManager = [...managers, { eventId, name: `Manager ${managers.length + 1}` }];
    setManagers(newManager);
  };

  const handleRemoveVolunteer = (volunteerName) => {
    setVolunteers(volunteers.filter((volunteer) => volunteer.name !== volunteerName));
  };

  const handleRemoveManager = (managerName) => {
    setManagers(managers.filter((manager) => manager.name !== managerName));
  };

  // Function to delete event by id
  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter((event) => event.id !== eventId));
    setVolunteers(volunteers.filter((volunteer) => volunteer.eventId !== eventId)); // Optional: remove volunteers associated with the event
  };

  return (
    <div className="event-management-container">
      <h2>Create Event</h2>
      <input
        type="text"
        name="name"
        value={eventDetails.name}
        onChange={handleEventChange}
        placeholder="Event Name"
      />
      <input
        type="text"
        name="location"
        value={eventDetails.location}
        onChange={handleEventChange}
        placeholder="Event Location"
      />
      <textarea
        name="envoy"
        value={eventDetails.envoy}
        onChange={handleEventChange}
        placeholder="Envoy Description"
      ></textarea>
      <input
        type="text"
        name="requiredSkill"
        value={eventDetails.requiredSkill}
        onChange={handleEventChange}
        placeholder="Required Skill"
      />

      <select
        name="urgencyLevel"
        value={eventDetails.urgencyLevel}
        onChange={handleEventChange}
      >
        <option value="">Select Urgency Level</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      {/* React Calendar for selecting date */}
      <div className="calendar-container">
        <h4>Select Event Date:</h4>
        <Calendar
          onChange={handleDateChange}
          value={eventDetails.date}
        />
      </div>

      <button onClick={handleCreateEvent}>Create Event</button>

      <h3>Upcoming Events</h3>
      {events.map((event) => (
        <div key={event.id} className="event-item">
          <h4>{event.name}</h4>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Envoy:</strong> {event.envoy}</p>
          <p><strong>Required Skill:</strong> {event.requiredSkill}</p>
          <p><strong>Urgency Level:</strong> {event.urgencyLevel}</p>
          <p><strong>Date:</strong> {event.date.toDateString()}</p>
          <p><strong>Volunteers:</strong> {volunteers.filter((v) => v.eventId === event.id).length}</p>
          <p><strong>Managers:</strong> {managers.filter((v) => v.eventId === event.id).length}</p>
          <button onClick={() => handleAddVolunteer(event.id)}>Add Volunteer</button>
          <button onClick={() => handleAddManager(event.id)}>Add Manager</button>
          <button onClick={() => handleRemoveVolunteer(`Volunteer ${volunteers.length}`)}>Remove Volunteer</button>
          <button onClick={() => handleRemoveManager(`Manager ${managers.length}`)}>Remove Manager</button>
          {/* Add Delete Event button */}
          <button onClick={() => handleDeleteEvent(event.id)}>Delete Event</button>
        </div>
      ))}
    </div>
  );
};

export default EventManagement; // Make sure this is a default export

