import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import Select from 'react-select';
import 'react-calendar/dist/Calendar.css';
//import './event.css';

const skillOptions = [
  { value: 'First Aid', label: 'First Aid' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'Security', label: 'Security' },
  { value: 'Social and Cultural', label: 'Social and Cultural' }
];

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState({
    name: '',
    location: '',
    envoy: '',
    requiredSkills: [],
    urgencyLevel: '',
    date: new Date(),
    manager: '',
    matchedVolunteers: [],
    selectedVolunteers: []
  });
  
  // Fetch all events from the backend when component mounts
  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch all events
  const fetchEvents = async () => {
    const response = await fetch('http://localhost:5000/api/events');
    if (response.ok) {
      const data = await response.json();
      setEvents(data);
    } else {
      console.error('Failed to fetch events');
    }
  };
  
  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventDetails({ ...eventDetails, [name]: value });
  };

  const handleSkillChange = (selectedOptions) => {
    setEventDetails({ ...eventDetails, requiredSkills: selectedOptions || [] });
  };

  const handleDateChange = (date) => {
    setEventDetails({ ...eventDetails, date });
  };

  // Create event
  const handleCreateEvent = async () => {
    if (!eventDetails.name.trim()) {
      alert("Event name is required.");
      return;
    }
  
    if (!eventDetails.location.trim()) {
      alert("Event location is required.");
      return;
    }
  
    if (eventDetails.requiredSkills.length === 0) {
      alert("Please select at least one required skill.");
      return;
    }
    if (!eventDetails.manager.trim()) {
      alert("Please select a manager for the event.");
      return;
    }
    if (!eventDetails.urgencyLevel.trim()) {
      alert("Please select an urgency level.");
      return;
    }
  
    const newEvent = { 
      ...eventDetails, 
      date: eventDetails.date.toISOString(),
      matchedVolunteers: await findMatchedVols(eventDetails.requiredSkills),
    };
    
    // Send POST request to create the event
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
  
      if (response.ok) {
        const createdEvent = await response.json();

        // Get the volunteers for the dropdown menu
        const getVols = await volunteerMatch(createdEvent);

        setEvents([...events, { ...createdEvent, matchedVolunteers: getVols, selectedVolunteers: []}]);

        
        // Reset event form
        setEventDetails({
          name: '',
          location: '',
          envoy: '',
          requiredSkills: [],
          urgencyLevel: '',
          date: new Date(),
          manager: '',
          matchedVolunteers: [],
          selectedVolunteers: []
        });
      } else {
        console.error('Failed to create event');
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };
  
  const findMatchedVols = async(skillList) =>{
    try {
      const response = await fetch('http://localhost:5000/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const users = await response.json();
      const reqSkills = skillList.map(skill => skill.value);
      const matchedVolunteers = users
      .filter(user => 
        user.role === 'volunteer' && 
        user.skills.some(skill => reqSkills.includes(skill))
      )
      .map(volunteer => ({
        value: volunteer.id,
        label: volunteer.fullName,
      }));

      return matchedVolunteers;
    }
    // else, error
      catch (error){
        console.error(error.message);
        return [];
      }
  }

  // Volunteer match on creation
  const volunteerMatch = async (event) => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
  
      const users = await response.json();
      const requiredSkills = event.requiredSkills.map(skill => skill.value);

      const matchedVolunteers = users
      .filter(user => 
        user.role === 'volunteer' && 
        user.skills.some(skill => requiredSkills.includes(skill))
      )
      .map(volunteer => ({
        value: volunteer.id,
        label: volunteer.fullName,
      }));

      return matchedVolunteers; // send back the list
    }

    // else, error
    catch (error){
      console.error(error.message);
      return [];
    }
  }

  // Delete event
  const handleDeleteEvent = async (id) => {
    const response = await fetch(`http://localhost:5000/api/events/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setEvents(events.filter((event) => event.id !== id));
    } else {
      console.error('Failed to delete event');
    }
  };
  
  return (
    <div className="event-management-container">
      <h2>Create Event</h2>
      <input type="text" name="name" value={eventDetails.name} onChange={handleEventChange} placeholder="Event Name" />
      <input type="text" name="location" value={eventDetails.location} onChange={handleEventChange} placeholder="Event Location" />
      <textarea name="envoy" value={eventDetails.envoy} onChange={handleEventChange} placeholder="Envoy Description"></textarea>
      
      <h4>Required Skills</h4>
      <Select options={skillOptions} isMulti 
value={eventDetails.requiredSkills} onChange={handleSkillChange} classNamePrefix="custom-select" />
      <h4>Urgency Level</h4>
      <select name="urgencyLevel" value={eventDetails.urgencyLevel} onChange={handleEventChange}>
        <option value="">Select Urgency Level</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      <h4>Event Managers</h4>
      <input type="text" name="manager" value={eventDetails.manager} onChange={handleEventChange} placeholder="Manager Name" />

      <h4>Select Event Date:</h4>
      <Calendar onChange={handleDateChange} value={eventDetails.date} />

      <button onClick={handleCreateEvent}>Create Event</button>

      <h2>Events List</h2>
      {events.map((event) => (
        <div key={event.id} className="event-item">
          <h3>{event.name}</h3>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Envoy:</strong> {event.envoy}</p>
          <p><strong>Urgency:</strong> {event.urgencyLevel}</p>
          <p><strong>Manager:</strong> {event.manager}</p>
          <p><strong>Date:</strong> {new Date(event.date).toDateString()}</p>
          <button onClick={() => handleDeleteEvent(event.id)}>Delete</button>
          
          <h4>Matched Volunteers</h4>
          <button onClick={() => {event.matchedVolunteers}}>
            Match Volunteers
          </button>
          
          <Select
            options={event.matchedVolunteers || []} 
            isMulti
            value={event.selectedVolunteers || []} // Auto-select matched ones
            onChange={(selectedOptions) => {
              const updatedEvents = events.map(e => 
                e.id === event.id 
                  ? { ...e, selectedVolunteers: selectedOptions } 
                  : e
              );

              // Send the updated selected volunteers to the API
              const response = fetch(`http://localhost:5000/api/events/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                ...event,
                selectedVolunteers: selectedOptions, // Send selected volunteers here
                }),
              })
              .then(response => {
                if (!response.ok) {
                  console.error('Failed to update selected volunteers');
                }
              })
              .catch(error => console.error(error.message));
              // and now update the local array and - yippee!
              setEvents(updatedEvents);
            }}
          classNamePrefix="custom-select"
        />
        </div>
      ))}
    </div>
  );
};

export default EventManagement;
