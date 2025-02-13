import Navbar from "./Navigation"; 
import './VolunteerHistory.css';
import React, { useState } from "react";


function volunteerhistory() {
    // Hardcoded volunteer history data, will be replaced with real data once backend and database are added
    const dummyVolunteerHistory = [
        { eventName: "Beach Cleanup", eventDesc: "To clean up trash off of the local beach", location: "6285 Seawall Blvd, Galveston, TX 77551", participationDate: "2024-06-15", status: "Completed" },
        { eventName: "Charity Run", eventDesc: "To raise awareness and money for lesser-known diseases", location: "18427 Southwest Fwy, Sugar Land, TX 77479", participationDate: "2024-07-01", status: "Pending" },
        { eventName: "Food Drive", eventDesc: "To gather non-perishable food for the less fortunate", location: "301 S Columbia Dr, West Columbia, TX 77486", participationDate: "2024-08-10", status: "Cancelled" },
    ];

    return (
        <div className="App">
            <Navbar />

            <h1>Volunteer History</h1>

            <div>

                <table>
                    <thead>
                        <tr>
                            <th>Event Name</th>
                            <th>Event Description</th>
                            <th>Location</th>
                            <th>Participation Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyVolunteerHistory.map((history, index) => (
                            <tr key={index}>
                                <td>{history.eventName}</td>
                                <td>{history.eventDesc}</td>
                                <td>{history.location}</td>
                                <td>{history.participationDate}</td>
                                <td>{history.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default volunteerhistory;
