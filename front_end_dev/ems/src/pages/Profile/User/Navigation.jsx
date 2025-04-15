import React, {useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
    return (
        <nav className="navbar">
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/user">Profile</Link></li>
                <li><Link to="/notifications">Notifications</Link></li>
                <li><Link to="/history">History</Link></li>
                <li><span className="logout-text" onClick={handleLogout}>Logout</span></li>
            </ul>
        </nav>
    );
}

export default Navbar;
