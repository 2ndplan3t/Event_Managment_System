import React from 'react';
import './event.css';
import Admin from './Admin';
import EventManagement from './EventManagement';

const EventForm = () => {
  return (
      <div className="app-container">
        <Admin/>
        <EventManagement/>
      </div>
  );
};

export default EventForm ;
