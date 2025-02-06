/*import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserAstronaut } from '@fortawesome/free-solid-svg-icons';
import './profile.css';

const Profile = () => {
  const [manager, setManager] = useState({
    fullName: 'John Doe',
    address: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    skills: 'Leadership, Communication, Project Management',
    preferences: 'Remote work, Flexible hours',
    availability: 'Full-time, 9 AM - 5 PM',
    email: 'johndoe@gmail.com',
    workHistory: [
      {
        jobTitle: 'Event Coordinator',
        company: 'Event Co.',
        year: '2022',
        description: 'Coordinated events from start to finish, managed teams of volunteers.'
      },
      {
        jobTitle: 'Project Manager',
        company: 'Tech Innovators',
        year: '2021',
        description: 'Led a team of engineers in building tech products and services.'
      }
    ]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setManager({ ...manager, [name]: value });
  };

  const handleCreateEvent = () => {
    alert("Create Event button clicked!");
  };

  const handleLogout = () => {
    alert("Logged out!");
  };

  return (
    <div className="profile-container">
      <div className="header">
        <h2>Admin Profile {<FontAwesomeIcon icon={faUserAstronaut} />}</h2>
        <div className="button-group">
          <button onClick={handleCreateEvent} className="create-event-btn">Create Events</button>
          <button onClick={handleLogout} className="logout-btn">Log Out</button>
        </div>
      </div>

      <div className="profile-field">
        <p><strong>Full Name:</strong> {manager.fullName}</p>
        <input
          type="text"
          name="fullName"
          value={manager.fullName}
          onChange={handleChange}
          placeholder="Full Name"
        />
      </div>

      <div className="profile-field">
        <p><strong>Address:</strong> {manager.address}</p>
        <input
          type="text"
          name="address"
          value={manager.address}
          onChange={handleChange}
          placeholder="Address"
        />
      </div>

      <div className="profile-field">
        <p><strong>City:</strong> {manager.city}</p>
        <input
          type="text"
          name="city"
          value={manager.city}
          onChange={handleChange}
          placeholder="City"
        />
      </div>

      <div className="profile-field">
        <p><strong>State:</strong> {manager.state}</p>
        <input
          type="text"
          name="state"
          value={manager.state}
          onChange={handleChange}
          placeholder="State"
        />
      </div>

      <div className="profile-field">
        <p><strong>Zip Code:</strong> {manager.zip}</p>
        <input
          type="text"
          name="zip"
          value={manager.zip}
          onChange={handleChange}
          placeholder="Zip Code"
        />
      </div>

      <div className="profile-field">
        <p><strong>Skills:</strong> {manager.skills}</p>
        <textarea
          name="skills"
          value={manager.skills}
          onChange={handleChange}
          placeholder="Skills"
        />
      </div>

      <div className="profile-field">
        <p><strong>Preferences:</strong> {manager.preferences}</p>
        <textarea
          name="preferences"
          value={manager.preferences}
          onChange={handleChange}
          placeholder="Preferences"
        />
      </div>

      <div className="profile-field">
        <p><strong>Availability:</strong> {manager.availability}</p>
        <textarea
          name="availability"
          value={manager.availability}
          onChange={handleChange}
          placeholder="Availability"
        />
      </div>

      <div className="profile-field">
        <p><strong>Work History:</strong></p>
        {manager.workHistory.map((job, index) => (
          <div key={index} className="work-history">
            <p><strong>{job.jobTitle} ({job.year})</strong></p>
            <p>{job.company}</p>
            <p>{job.description}</p>
          </div>
        ))}
      </div>

      <div className="profile-field">
        <p><strong>Email:</strong> {manager.email}</p>
        <input
          type="email"
          name="email"
          value={manager.email}
          onChange={handleChange}
          placeholder="Email"
        />
      </div>
    </div>
  );
};

export default Profile;
*/
