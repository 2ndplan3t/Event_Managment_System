import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css'
import Home from './pages/FrontPage/home'
import Login from './pages/Login&Signup/Login';
import Donate from './pages/FrontPage/Donate/Donate';
import EventForm from './pages/Profile/Admin/AdminEventForm';
import ProfilePage from './pages/Profile/User/ProfilePage';
import VolunteerHistory from './pages/Profile/User/VolunteerHistory';


function App() {
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
      </Routes>
    </Router>
  );
}


export default App
