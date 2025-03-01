import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import EventManagement from './EventManagement';
//import './event.css';


const AdminProfile = () => {
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdmin = async () => {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        setError("No admin logged in");
        return;
      }
  
      try {
        const response = await fetch(`http://localhost:5000/api/admin/${adminId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch admin data");
        }
        const data = await response.json();
        setAdmin(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchAdmin();
}, []);

  if (error) {
    return <p className="error">Error: {error}</p>;
  }

  if (!admin) {
    return <p>Loading...</p>;
  }
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
