import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Profile/User/Navigation';
import './Notifications.css'

function Notifications() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null); // Define the user state

  useEffect(() => {
    // Fetch user session 
    fetch('http://localhost:5000/api/profile', {
      method: 'GET',
      credentials: 'include', 
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Not authorized');
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch((error) => {
        console.error('Error fetching user profile:', error);
        setUser(null); 
      });
  }, []);
  return (
    <div className="no-global-reset">
    <div className="root">
      <header class="notif_page">
        <Navbar/>
        <h1>Notifications</h1>
      </header>
      <div class="notif_area">
        <p class="notification">This is a test notification</p>
        <p class="notification">This is a test notification</p>
        <p class="notification">This is a test notification</p>
      </div>
      <footer>
        <p><a href= "https://github.com/2ndplan3t/Event_Managment_System/tree/main"><img src="src/assets/GitHub-logo.png" alt="Github Link" width="80px" height="40px"></img></a> &copy; Copyright Group 9</p>
      </footer>
    </div>
    </div>
  )
}

export default Notifications