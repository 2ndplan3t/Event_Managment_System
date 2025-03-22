import Navbar from "./Navigation"; 
import './VolunteerHistory.css';
import React, { useState, useEffect } from "react";

function VolunteerHistory() {
    const [volunteerHistory, setVolunteerHistory] = useState([]);

    useEffect(() => {
        const fetchVolunteerHistory = async () => {
            try {
                const userId = 4; // replace with dynamic user id later
                const response = await fetch(`http://localhost:5000/api/volunteer-history/${userId}`);
                
                if (!response.ok) {
                    throw new Error("Failed to fetch volunteer history");
                }
                const data = await response.json();

                // Check if volunteerHistory exists and update state
                if (data.volunteerHistory && data.volunteerHistory.length > 0) {
                    setVolunteerHistory(data.volunteerHistory);
                } else {
                    setVolunteerHistory([]); // No events found
                }
            } catch (error) {
                console.error("Error fetching volunteer history:", error);
            }
        };

        fetchVolunteerHistory();
    }, []);

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
                    {volunteerHistory.length > 0 ? (
                        volunteerHistory.map((history, index) => (
                            <tr key={index}>
                                <td className="volunteer-history-td">{history.eventName}</td>
                                <td className="volunteer-history-td">{history.eventDesc}</td>
                                <td className="volunteer-history-td">{history.eventLocation}</td>
                                <td className="volunteer-history-td">{history.eventDate}</td>
                                <td className="volunteer-history-td">{history.eventStatus}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="volunteer-history-td">No volunteer history available</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default VolunteerHistory;
