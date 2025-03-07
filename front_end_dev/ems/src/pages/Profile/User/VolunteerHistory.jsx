import Navbar from "./Navigation"; 
import './VolunteerHistory.css';
import React, { useState, useEffect  } from "react";

function VolunteerHistory() {
    const [user, setUser] = useState(null);
    const [volunteerHistory, setVolunteerHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchUserProfile = async () => {
          try {
            const response = await fetch("http://localhost:5000/api/profile", {
              credentials: "include",
            });
            if (!response.ok) {
              throw new Error(`Profile fetch failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log("Profile response:", data);
            setUser(data.profileData);
            setVolunteerHistory(data.profileData.volunteerHistory || []); // Set history from profile
          } catch (error) {
            console.error("Error fetching profile:", error);
            setError(error.message);
          } finally {
            setLoading(false);
          }
        };
        fetchUserProfile();
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
                                    <td className="volunteer-history-td">{history.event}</td>
                                    <td className="volunteer-history-td">{history.eventdesc}</td>
                                    <td className="volunteer-history-td">{history.location}</td>
                                    <td className="volunteer-history-td">{history.date}</td>
                                    <td className="volunteer-history-td">{history.status}</td>
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
