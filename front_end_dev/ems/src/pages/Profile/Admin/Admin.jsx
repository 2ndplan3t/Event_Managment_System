import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import EventManagement from './EventManagement';
//import './event.css';


const AdminProfile = () => {
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include", 
      });
      localStorage.removeItem("user");
      localStorage.removeItem("adminId"); 
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin/profile", {
          method: "GET",
          credentials: "include", 
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expired. Redirecting to login...");
            setTimeout(() => navigate("/login"), 2000);
            return;
          } else if (response.status === 403) {
            setError("Access denied: Admins only. Redirecting to home...");
            setTimeout(() => navigate("/"), 2000);
            return;
          } else {
            throw new Error("Failed to fetch admin data");
          }
        }

        const data = await response.json();
        setAdmin(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [navigate]);

  if (error) {
    return <p className="error">Error: {error}</p>;
  }

  if (!admin) {
    return <p>Loading...</p>;
  }
  if (!admin) {
    return null; 
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
        <Link to="/">
          <button className="btn">Home</button>
        </Link>
        <button className = "btn" onClick={handleLogout}>Logout</button>

        
      </div>
    </div>
    
  );
};

export default AdminProfile;
