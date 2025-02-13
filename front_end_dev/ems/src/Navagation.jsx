import React from "react";
import "./Navbar.css";

function Navbar() {
    return (
        <nav className="navbar">
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#profile">Profile</a></li>
                <li><a href="#notifications">Notifications</a></li>
                <li><a href="#history">History</a></li>
            </ul>
        </nav>
    );
}

export default Navbar;
