import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
    return (
        <nav className="navbar">
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/user">Profile</Link></li>
                <li><Link to="/notifications">Notifications</Link></li>
                <li><Link to="/history">History</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;
