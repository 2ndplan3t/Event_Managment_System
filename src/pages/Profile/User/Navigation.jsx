import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
    return (
        <nav className="navbar">
            <ul>
                <li><a href="#home">Home</a></li>
                <li><Link to="/user">Profile</Link></li>
                <li><a href="#notifications">Notifications</a></li>
                <li><Link to="/history">History</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;