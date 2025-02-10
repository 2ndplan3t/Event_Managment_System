import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../event.css';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState({
    name: '',
    location: '',
    envoy: '',
    requiredSkills: [], // Store selected skills in an array
    urgencyLevel: '',
    date: new Date(),
  });

  const [volunteers] = useState([
    { id: 1, name: 'Alice', skill: 'First - Aid', available: true },
    { id: 2, name: 'Bob', skill: 'Logistics', available: true },
    { id: 3, name: 'Charlie', skill: 'Security', available: true },
    { id: 4, name: 'Danial', skill: 'Social and Cultural', available: true },
  ]);
  const [assignedVolunteers, setAssignedVolunteers] = useState([]);
  const [managers, setManagers] = useState([]);

  // Handle input changes for other fields
  const handleEventChange = (e) => {
    const { name, value } = e.target;
    if (name === 'requiredSkills') {
      // Toggle the selected skill
      const newSkills = [...eventDetails.requiredSkills];
      if (newSkills.includes(value)) {
        // If already selected, remove it
        const index = newSkills.indexOf(value);
        newSkills.splice(index, 1);
      } else {
        // Otherwise, add it
        newSkills.push(value);
      }
      setEventDetails({ ...eventDetails, requiredSkills: newSkills });
    } else {
      setEventDetails({ ...eventDetails, [name]: value });
    }
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
      requiredSkills: [],
      urgencyLevel: '',
      date: new Date(),
    });
  };

  const handleAddVolunteer = (volunteerId, eventId) => {
    const isAlreadyAssigned = assignedVolunteers.some(
      (volunteer) => volunteer.eventId === eventId && volunteer.volunteerId === volunteerId
    );
    if (!isAlreadyAssigned) {
      setAssignedVolunteers([
        ...assignedVolunteers,
        { volunteerId, eventId }
      ]);
    } else {
      alert('Volunteer is already assigned to this event.');
    }
  };

  const handleAddManager = (eventId) => {
    const newManager = { id: Date.now(), eventId, name: `Manager ${managers.length + 1}` };
    setManagers([...managers, newManager]);
  };

  const handleRemoveVolunteer = (volunteerId, eventId) => {
    setAssignedVolunteers(assignedVolunteers.filter(
      (volunteer) => !(volunteer.volunteerId === volunteerId && volunteer.eventId === eventId)
    ));
  };

  const handleRemoveManager = (managerId) => {
    setManagers(managers.filter((manager) => manager.id !== managerId));
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter((event) => event.id !== eventId));
    setAssignedVolunteers(assignedVolunteers.filter((volunteer) => volunteer.eventId !== eventId)); 
    setManagers(managers.filter((manager) => manager.eventId !== eventId)); 
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

      <h4>Required Skills</h4>
      {/* Render checkboxes for each skill */}
      <div className="skills-checkboxes">
        <label>
          <input
            type="checkbox" 
            name="requiredSkills"
            value="First - Aid"
            checked={eventDetails.requiredSkills.includes('First - Aid')}
            onChange={handleEventChange}
          />First - Aid
        </label>
        <label>
          <input
            type="checkbox"
            name="requiredSkills"
            value="Logistics"
            checked={eventDetails.requiredSkills.includes('Logistics')}
            onChange={handleEventChange}
          />
          Logistics
        </label>
        <label>
          <input
            type="checkbox"
            name="requiredSkills"
            value="Security"
            checked={eventDetails.requiredSkills.includes('Security')}
            onChange={handleEventChange}
          />
          Security
        </label>
        <label>
          <input
            type="checkbox"
            name="requiredSkills"
            value="Social and Cultural"
            checked={eventDetails.requiredSkills.includes('Social and Cultural')}
            onChange={handleEventChange}
          />
          Social and Cultural
        </label>
      </div>

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
          <p><strong>Required Skills:</strong> {event.requiredSkills.join(', ')}</p>
          <p><strong>Urgency Level:</strong> {event.urgencyLevel}</p>
          <p><strong>Date:</strong> {event.date.toDateString()}</p>

          <div className="volunteer-matching">
            <h4>Match Volunteers</h4>
            {volunteers.filter((volunteer) =>
              event.requiredSkills.includes(volunteer.skill) // Check if volunteer skill matches
            ).map((volunteer) => (
              <div key={volunteer.id} className="volunteer-card">
                <p><strong>{volunteer.name}</strong></p>
                <button 
                  onClick={() => handleAddVolunteer(volunteer.id, event.id)} 
                  className="button">
                  Add Volunteer
                </button>
                <button onClick={() => handleRemoveVolunteer(volunteer.id, event.id)}>Remove Volunteer</button>
              </div>
            ))}
          </div>

          <div>
            <strong>Managers:</strong>
            {managers.filter((m) => m.eventId === event.id).map((manager) => (
              <div key={manager.id}>
                <span>{manager.name}</span>
                <button onClick={() => handleRemoveManager(manager.id)}>Remove Manager</button>
              </div>
            ))}
            <button onClick={() => handleAddManager(event.id)}>Add Manager</button>
          </div>

          <button onClick={() => handleDeleteEvent(event.id)}>Delete Event</button>
        </div>
      ))}
    </div>
  );
};

export default EventManagement;


