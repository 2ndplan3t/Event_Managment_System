import Navbar from "./Navigation"; 
import './VolunteerHistory.css';
import React, { useState } from "react";

function VolunteerHistory() {
    // Hardcoded volunteer history data, will be replaced with real data once backend and database are added
    const dummyVolunteerHistory = [
        { eventName: "Beach Cleanup", eventDesc: "To clean up trash off of the local beach", location: "6285 Seawall Blvd, Galveston, TX 77551", participationDate: "2024-06-15", status: "Completed" },
        { eventName: "Charity Run", eventDesc: "To raise awareness and money for lesser-known diseases", location: "18427 Southwest Fwy, Sugar Land, TX 77479", participationDate: "2024-07-01", status: "Pending" },
        { eventName: "Food Drive", eventDesc: "To gather non-perishable food for the less fortunate", location: "301 S Columbia Dr, West Columbia, TX 77486", participationDate: "2024-08-10", status: "Cancelled" },
    ];

    return (
        <div className="volunteer-history-container">
            <Navbar />

            <h1>Volunteer History</h1>

            <div>
                <table className="volunteer-history-table">
                    <thead>
                        <tr>
                            <th className="volunteer-history-th">Event Name</th>
                            <th className="volunteer-history-th">Event Description</th>
                            <th className="volunteer-history-th">Location</th>
                            <th className="volunteer-history-th">Participation Date</th>
                            <th className="volunteer-history-th">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyVolunteerHistory.map((history, index) => (
                            <tr key={index}>
                                <td className="volunteer-history-td">{history.eventName}</td>
                                <td className="volunteer-history-td">{history.eventDesc}</td>
                                <td className="volunteer-history-td">{history.location}</td>
                                <td className="volunteer-history-td">{history.participationDate}</td>
                                <td className="volunteer-history-td">{history.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default VolunteerHistory;
