
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import './App.css'
import Home from './pages/FrontPage/home'
import Login from './pages/Login&Signup/Login';
import Donate from './pages/FrontPage/Donate/Donate';
import EventForm from './pages/Profile/Admin/AdminEventForm';
import ProfilePage from './pages/Profile/User/ProfilePage';
import VolunteerHistory from './pages/Profile/User/VolunteerHistory';
import Notifications from './pages/Notifications/Notifications';
import { useEffect } from 'react';

function App() {
    // test backend connection. use f12 in the browser to check if it works
    useEffect(() => {
      fetch('http://localhost:5000/api/test')
      .then(response => response.json())
      .then(data => console.log(data.message))
      .catch(error => console.error("Error connecting to backend:", error));
    }, []);
    
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/admin" element={<EventForm />} />
        <Route path="/user" element={<ProfilePage />} />
        <Route path="/history" element={<VolunteerHistory />} />
        <Route path="/notifications" element={<Notifications />} />
  
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
export default App
