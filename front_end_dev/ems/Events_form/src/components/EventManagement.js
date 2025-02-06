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
    requiredSkill: '',
    urgencyLevel: '',
    date: new Date(),
  });

  const [volunteers] = useState([
    { id: 1, name: 'Alice', skill: 'First Aid', available: true },
    { id: 2, name: 'Bob', skill: 'Logistics', available: true },
    { id: 3, name: 'Charlie', skill: 'Security', available: true },
  ]);
  const [assignedVolunteers, setAssignedVolunteers] = useState([]);

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
      requiredSkill: '',
      urgencyLevel: '',
      date: new Date(),
    });
  };

  const handleAddVolunteer = (volunteerId, eventId) => {
    // Check if the volunteer is already assigned to the event
    const isAlreadyAssigned = assignedVolunteers.some(
      (volunteer) => volunteer.eventId === eventId && volunteer.volunteerId === volunteerId
    );
  
    if (!isAlreadyAssigned) {
      // Add volunteer to event by updating the volunteers state
      setAssignedVolunteers([
        ...volunteers,
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
    setAssignedVolunteers(assignedVolunteers.filter((volunteer) => volunteer.eventId !== eventId)); // Remove volunteers
    setManagers(managers.filter((manager) => manager.eventId !== eventId)); // Remove managers
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

      <select
        name="requiredSkill"
        value={eventDetails.requiredSkill}
        onChange={handleEventChange}
        placeholder="Required Skill"
      >
        <option value="">Select Required Skill</option>
        <option value="First Aid">First Aid</option>
        <option value="Logistics">Logistics</option>
        <option value="Security">Security</option>
      </select>

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
          <p><strong>Required Skill:</strong> {event.requiredSkill}</p>
          <p><strong>Urgency Level:</strong> {event.urgencyLevel}</p>
          <p><strong>Date:</strong> {event.date.toDateString()}</p>

          <div className="volunteer-matching">
            <h4>Match Volunteers</h4>
            {volunteers.filter((volunteer) => volunteer.skill === event.requiredSkill).map((volunteer) => (
              <div key={volunteer.id} className="volunteer-card">
                <p><strong>{volunteer.name}</strong></p>
                <button 
                  onClick={() => handleAddVolunteer(volunteer.id, event.id)} 
                  className="button">
                  Add Volunteer
                </button>
                <button onClick={() => handleRemoveVolunteer(volunteer.id)}>Remove Volunteer</button>
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

