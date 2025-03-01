
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css'
import Home from './pages/FrontPage/home'
import Login from './pages/Login&Signup/Login';
import Donate from './pages/FrontPage/Donate/Donate';
import EventForm from './pages/Profile/Admin/AdminEventForm';
import ProfilePage from './pages/Profile/User/ProfilePage';
import VolunteerHistory from './pages/Profile/User/VolunteerHistory';
import Notifications from './pages/Notifications/Notifications';
import axios from 'axios';
import { useEffect } from 'react';



function App() {
    // Test backend connection
    useEffect(() => {
      axios.get('http://localhost:5000/api/test')
        .then(response => console.log(response.data.message))
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
      </Routes>
    </Router>
  );
}
export default App
