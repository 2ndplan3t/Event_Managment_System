import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from '../Profile/User/Navigation';
import './Notifications.css'

function Notifications() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null); // Define the user state
  const [notifs, setNotifs] = useState([]); // get the notification array

  // logout command
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include", 
      });
      localStorage.removeItem("user");
      localStorage.removeItem("adminId"); 
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const fetchUserNotifs = async(uid) => {
    const response = await fetch(`http://localhost:5000/api/users/${uid}`);
    if (response.ok) {
      // get notifications for this user from the backend
      const userNotifs = await response.json();
      // proceed to set notifications to that. yippee!
      if(userNotifs.notifications.length > 0){
        setNotifs(userNotifs.notifications);
      }
      else{
        setNotifs([]) 
      }
    } 
    else {
      console.error("Failed to fetch user's notifications");
    }
  };

  const handleClearNotif = async(notifID) => {
    try{
      const updatedNotifs = notifs.filter((notif) => notif.notifID !== notifID);
      setNotifs(updatedNotifs);

      // should let you edit suer
      const response = await fetch(`http://localhost:5000/api/users/${user.profileData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          new_notifs: updatedNotifs
        }),
      });

      if (response.ok) {
        console.log("Notification cleared");
      } else {
        console.error('Failed to clear notification');
      }
    }
    catch (error){
      console.error('Error clearing notification:', error);
    }
  };

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
        fetchUserNotifs(data.profileData.id);
      })
      .catch((error) => {
        console.error('Error fetching user notifications:', error);
        setUser(null); 
      });

  }, []);


  return (
    <div className="no-global-reset">
    <div className="root">
      <header className="notif_page">
        <div className="nav_buttons"> 
         <Link to="/"> <button type="button">Home</button> </Link>
         <Link to="/user"> <button type="button">Profile</button> </Link>
         <Link to="/notifications"><button type="button">Notifications</button></Link>
         <Link to="/history"><button type="button">History</button></Link>
         <button onClick={handleLogout}>Logout</button>
        </div>
        <h1>Notifications</h1>
      </header>
      <div className="notif_area">
        {notifs.length > 0 ? (
          notifs.map((notif) => (
          <div key={notif.notifID} className="notification">
            <h3>{notif.type}</h3>
            <span><strong>ALERT:</strong> {notif.text}</span><br></br>
            <span><strong>Event Name:</strong> {notif.eventName} </span>
            <button className="clear" onClick={() => handleClearNotif(notif.notifID)}>×</button>
          </div>
          ))
        ) : (
          <p><strong>No Notifications</strong></p>  // if there are no notifications, tell the user such
        )}
      </div>
      
      <footer>
        <p><a href= "https://github.com/2ndplan3t/Event_Managment_System/tree/main"><img src="src/assets/GitHub-logo.png" alt="Github Link" width="80px" height="40px"></img></a> &copy; Copyright Group 9</p>
      </footer>
    </div>
    </div>
  )
}

export default Notifications