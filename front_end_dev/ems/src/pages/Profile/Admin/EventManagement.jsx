import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import Select from 'react-select';
import 'react-calendar/dist/Calendar.css';
//import './event.css';

const skillOptions = [
  { value: 'First Aid', label: 'First Aid' },
  { value: 'Animal Handling', label: 'Animal Handling'},
  { value: 'Cooking', label: 'Cooking'},
  { value: 'Sewing', label: 'Sewing' },
  { value: 'Communication', label: 'Communication' },
  { value: 'Fundraising', label: 'Fundraising' }
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
    
    // For each event, find the matched volunteers
    const eventsWithVolunteers = await Promise.all(data.map(async (event) => {
    const matchedVolunteers = await volunteerMatch(event.EventID); // Fetch matched volunteers for the specific event
    const selectedVolunteers = await getAssignedVols(event.EventID);
    return { 
        ...event, 
        matchedVolunteers, 
        selectedVolunteers  // Initialize empty selected volunteers for each event
      };
    }));

    // Now update the events state with the events that include matched volunteers
    setEvents(eventsWithVolunteers);
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

  const handleVolunteerChange = (selectedOptions) => {
    setEventDetails({ ...eventDetails, selectedVolunteers: selectedOptions || [] });
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

    let dateFormatted = eventDetails.date.getFullYear() + "-" + (eventDetails.date.getMonth()+1) + "-" + eventDetails.date.getDate();

    const newEvent = { 
      ...eventDetails, 
      date: dateFormatted,
      matchedVolunteers: await volunteerMatch(eventDetails.id)
    };
    
    // Send POST request to create the event
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
  
      if (response.ok) {
        fetchEvents();

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
  
  const volunteerMatch = async (eventID) => {
    try {
      const response = await fetch(`http://localhost:5000/api/eventmatch/${eventID}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();

      // map the volunteers
      const matchedVolunteers = data.map(vol => ({
        value: vol.UserID,
        label: vol.FullName
      }));

      return matchedVolunteers;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  };

  const matchAllVolunteers = async(eventid) => {
    try{
      // get the event so we can read the matched volunteers & selected volunteers
      const event = events.find(e => e.EventID === eventid);
      // get the selected volunteer IDs 
      const selected = event.selectedVolunteers || [];
      const selectedIds = new Set(selected.map(v => v.value));
      // filter so it's just the new volunteers
      const newVolunteers = event.matchedVolunteers.filter(v => !selectedIds.has(v.value));
      if(newVolunteers.length > 0){
        // if any new volunteers were found, do what we do for singular matching but make it happen multiple times
        await Promise.all(newVolunteers.map(vol =>
          fetch(`http://localhost:5000/api/events/${eventid}/volunteers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              volunteerId: vol.value,
              action: 'add'
            })
          })
        ));
      }
    
      // update the display on our side
      const updatedSelected = [...selected, ...newVolunteers];

      setEvents(prev =>
        prev.map(e =>
          e.EventID === eventid
            ? { ...e, selectedVolunteers: updatedSelected }
            : e
        )
      );

    } catch(error){
      console.error("Error matching all volunteers:", error);
    }
  }

  const getAssignedVols = async(EventID) => {
    try {
      const response = await fetch(`http://localhost:5000/api/events/${EventID}/selectedUsers`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();

      // map the volunteers
      const selectedVols = data.map(vol => ({
        value: vol.UserID,
        label: vol.FullName
      }));

      return selectedVols;
    } catch (error) {
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
      fetchEvents();
      setTimeout(() => {
        // After event deletion, reload page
        window.location.reload();
    }, 500);
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
      <Select options={skillOptions} isMulti value={eventDetails.requiredSkills} onChange={handleSkillChange} classNamePrefix="custom-select" />

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
        <div key={event.EventID} className="event-item">
          <h3>{event.EventName}</h3>
          <p><strong>Location:</strong> {event.EventLocation}</p>
          <p><strong>Envoy:</strong> {event.EventDesc}</p>
          <p><strong>Urgency:</strong> {event.EventUrgency}</p>
          <p><strong>Manager:</strong> {event.manager}</p>
          <p><strong>Date:</strong> {new Date(event.EventDate).toLocaleDateString()}</p>
          <button onClick={() => handleDeleteEvent(event.EventID)}>Delete</button>
          
          <h4>Matched Volunteers</h4>
          <button onClick={() => matchAllVolunteers(event.EventID)}>
            Match All Volunteers
          </button>
          
          <Select
            // Show all the matched volunteers as options (as long as they're not selected)
            options={event.matchedVolunteers || []} 
            isMulti
            value={event.selectedVolunteers || []}
            onChange={async (selectedOptions) => {
              const prevSelected = event.selectedVolunteers || [];
              const currentSelected = selectedOptions || [];
            
              const prevIds = new Set(prevSelected.map(v => v.value));
              const currentIds = new Set(currentSelected.map(v => v.value));
            
              const added = currentSelected.filter(v => !prevIds.has(v.value));
              const removed = prevSelected.filter(v => !currentIds.has(v.value));
            
              setEvents(prev =>
                prev.map(e =>
                  e.EventID === event.EventID
                    ? { ...e, selectedVolunteers: currentSelected }
                    : e
                )
              );

              try {
                // Handle added volunteers
                for (const vol of added) {
                  await fetch(`http://localhost:5000/api/events/${event.EventID}/volunteers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      volunteerId: vol.value,
                      action: 'add',
                    }),
                  });
                }
            
                // Handle removed volunteers
                for (const vol of removed) {
                  await fetch(`http://localhost:5000/api/events/${event.EventID}/volunteers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      volunteerId: vol.value,
                      action: 'remove',
                    }),
                  });
                }

              } catch (error) {
                console.error("Error updating volunteer assignments:", error);
              }
            }}
            
  classNamePrefix="custom-select"
/>


        </div>
      ))}
    </div>
  );
};

export default EventManagement;



