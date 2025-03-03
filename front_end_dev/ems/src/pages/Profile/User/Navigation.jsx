import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
        const [user, setUser] = useState(null);
        const navigate = useNavigate();
      
        useEffect(() => {
          // Check if user is logged in via localStorage
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }, []);
      
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
                <li><Link to="/" onClick={handleLogout}>Logout</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;
