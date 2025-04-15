import React, { useState, useEffect } from "react";
import UserProfile from "./userProfile";
import Navbar from "./Navigation";
import './UserProfile.css';

function ProfilePage() {
    const [profileData, setProfileData] = useState(null);
    const [mode, setMode] = useState("view"); // 'view' or 'edit'
    const userId = JSON.parse(localStorage.getItem("user")).id;

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
                if (!response.ok) {
                    throw new Error("Profile data not found");
                }
                const data = await response.json();
                console.log(data);
                if (
                    data.userProfile[0].AddressLine == null ||
                    data.userProfile[0].City == null ||
                    data.userProfile[0].State == null ||
                    data.userProfile[0].ZipCode == null
                ) {
                    throw new Error("Profile data missing!");
                }
                setProfileData(data);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };

        fetchProfileData();
    }, [userId]);

    const handleFormSubmit = (data) => {
        setProfileData(data);
        setMode("view");
        setTimeout(() => {
            window.location.reload(); // Optional: Refresh to ensure backend sync
        }, 500);
    };

    const handleEditClick = () => {
        setMode("edit");
    };

    return (
        <div className="profilepage">
            <Navbar />
            <h1>Profile Management</h1>

            {mode === "edit" || !profileData ? (
                <UserProfile onSubmit={handleFormSubmit} existingData={profileData} />
            ) : (
                <div>
                    <h2>Profile Information</h2>
                    <div className="profile-info-section">
                        <p><strong>Full Name:</strong> {profileData.userProfile[0].FullName}</p>
                        <p><strong>Address 1:</strong> {profileData.userProfile[0].AddressLine}</p>
                        <p><strong>Address 2:</strong> {profileData.userProfile[0].AddressLine2}</p>
                        <p><strong>City:</strong> {profileData.userProfile[0].City}</p>
                        <p><strong>State:</strong> {profileData.userProfile[0].State}</p>
                        <p><strong>Zip Code:</strong> {profileData.userProfile[0].ZipCode}</p>
                        <p><strong>Preferences:</strong> {profileData.userProfile[0].Preferences}</p>
                        <p><strong>Skills:</strong> {profileData.skills.join(", ")}</p>
                        <p><strong>Availability:</strong> {profileData.availability.join(", ")}</p>
                    </div>

                    <button className="edit-profile-button" onClick={handleEditClick}>
                        Edit Profile
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProfilePage;
