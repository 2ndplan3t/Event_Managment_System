import React from 'react';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import EventManagement from './EventManagement';
//import './event.css';

const AdminProfile = () => {
  const admin = {
    fullName: "John Doe",
    id: "MGR12345",
    email: "johndoe@gmail.com",
  };

  return (
    <div className="profile-container">
      <h2>
       Admin Profile <FontAwesomeIcon icon={faEnvelope} />
      </h2>
      <p><strong>Full Name:</strong> {admin.fullName}</p>
      <p><strong>ID:</strong> {admin.id}</p>
      <p><strong>Email:</strong> {admin.email}</p>

      
      <div className="button-container">
          <button className="btn">View Profile</button>
        <Link to="/">
          <button className="btn">Home</button>
        </Link>
        
      </div>
    </div>
    
  );
};

export default AdminProfile;
