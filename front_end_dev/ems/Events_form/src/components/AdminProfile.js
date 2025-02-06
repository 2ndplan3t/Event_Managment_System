import React from 'react';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import '../event.css';

const AdminProfile = () => {
  const admin = {
    fullName: "John Doe",
    id: "MGR12345",
    email: "johndoe@gmai.com",
  };

  return (
    <div className="profile-container">
      <h2>
       Admin Profile <FontAwesomeIcon icon={faEnvelope} />
      </h2>
      <p><strong>Full Name:</strong> {admin.fullName}</p>
      <p><strong>ID:</strong> {admin.id}</p>
      <p><strong>Email:</strong> {admin.email}</p>

      {/* Button Container with Links */}
      <div className="button-container">
        <Link to="./components/profile">
          <button className="btn">View Profile</button>
        </Link>
      </div>
    </div>
  );
};

export default AdminProfile;
