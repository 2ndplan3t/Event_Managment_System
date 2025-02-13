import React, { useState } from "react";
import UserProfile from "./UserProfile"; 
import Navbar from "./Navagation"; 
import './UserProfile.css';

function ProfilePage() {
    const [profileData, setProfileData] = useState(null);

    const handleFormSubmit = (data) => {
        setProfileData(data); // save submitted data in state
    };

    // hardcoded volunteer history data, this will be replaced with real data once backend and database are added
    const dummyVolunteerHistory = [
        { eventName: "Beach Cleanup", eventDesc: "To clean up trash off of the local beach", location: "6285 Seawall Blvd, Galveston, TX 77551", participationDate: "2024-06-15", status: "Completed" },
        { eventName: "Charity Run", eventDesc: "To raise awareness and money for lesser-known diseases", location: "18427 Southwest Fwy, Sugar Land, TX 77479", participationDate: "2024-07-01", status: "Pending" },
        { eventName: "Food Drive", eventDesc: "To gather non-perishable food for the less fortunate", location: "301 S Columbia Dr, West Columbia, TX 77486", participationDate: "2024-08-10", status: "Cancelled" },
    ];

    return (
        <div className="App">
            <Navbar />

            <h1>Profile Management Form</h1>
            {!profileData ? (
                <UserProfile onSubmit={handleFormSubmit} />
            ) : (
                <div>
                    <h2>Profile Information</h2>
                    <div className="profile-info">
                        <p><strong>Full Name:</strong> {profileData.fullName}</p>
                        <p><strong>Address 1:</strong> {profileData.address1}</p>
                        <p><strong>Address 2:</strong> {profileData.address2}</p>
                        <p><strong>City:</strong> {profileData.city}</p>
                        <p><strong>State:</strong> {profileData.state}</p>
                        <p><strong>Zip Code:</strong> {profileData.zipCode}</p>
                        <p><strong>Skills:</strong> {profileData.skills.join(", ")}</p>
                        <p><strong>Preferences:</strong> {profileData.preferences}</p>
                        <p><strong>Availability:</strong> {profileData.availability}</p>
                    </div>

                    {/* volunteer history section */}
                    <div>
                        <h2>Volunteer History</h2>
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
            )}
            
        </div>
    );
}

export default ProfilePage;
