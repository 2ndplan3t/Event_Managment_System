import React from 'react';
import '../index.css';
import { BrowserRouter as Router } from 'react-router-dom';  // Ensure Router is imported and wrapped around your app
import AdminProfile from './AdminProfile';
import EventManagement from './EventManagement';

const EventForm = () => {
  return (
    <Router> {/* Wrap your components inside Router */}
      <div className="app-container">
        <AdminProfile/>
        <EventManagement />
      </div>
    </Router>
  );
};

export default EventForm ;