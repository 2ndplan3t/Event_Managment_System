import React, { useState } from "react";
import UserProfile from "./userProfile"; 
import Navbar from "./Navigation"; 
import './UserProfile.css';

function ProfilePage() {
    const [profileData, setProfileData] = useState(null);

    const handleFormSubmit = (data) => {
        setProfileData(data); // Save submitted data in state
    };

    return (
        <div className="profilepage">
            <Navbar />

            <h1>Profile Management Form</h1>
            {!profileData ? (
                <UserProfile onSubmit={handleFormSubmit} />
            ) : (
                <div>
                    <h2>Profile Information</h2>
                    <div className="profile-info-section">
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

                </div>
            )}
            
        </div>
    );
}

export default ProfilePage;