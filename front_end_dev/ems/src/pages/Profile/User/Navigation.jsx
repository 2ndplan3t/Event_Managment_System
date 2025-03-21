import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";


function Navbar() {
    const navigate = useNavigate();
    const handleLogout = async () => {
        await fetch("/api/logout", {
            method: "POST",
            credentials: "include", 
        });

        localStorage.clear();
        navigate("/"); //back to homepage
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
