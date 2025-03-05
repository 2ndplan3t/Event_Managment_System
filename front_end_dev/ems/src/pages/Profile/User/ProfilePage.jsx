import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserProfile from "./userProfile";
import Navbar from "./Navigation";
import './UserProfile.css';

function ProfilePage() {
    const [profileData, setProfileData] = useState(null);
    const [originalProfileData, setOriginalProfileData] = useState(null); // Store original data
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false); // Track editing state
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/profile", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.status === 401) {
                    setIsAuthenticated(false);
                    navigate('/login');
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setProfileData(data.profileData);
                setOriginalProfileData(data.profileData); // Store original data
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error fetching profile:', error);
                setError(error.message);
                setIsAuthenticated(false);
                navigate('/login');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate]);

    const handleFormSubmit = async (data) => {
        try {
            const response = await fetch("http://localhost:5000/api/profile", {
                method: "PUT", // Assuming you'll add a PUT endpoint in backend
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const updatedData = await response.json();
                setProfileData(updatedData.profileData);
                setOriginalProfileData(updatedData.profileData);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleCancelEdit = () => {
        setProfileData(originalProfileData); // Restore original data
        setIsEditing(false);
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    if (isLoading) {
        return (
            <div className="profilepage">
                <Navbar />
                <h2>Loading profile...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profilepage">
                <Navbar />
                <h2>Error: {error}</h2>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="profilepage">
                <Navbar />
                <h2>You are not authenticated. Please log in.</h2>
            </div>
        );
    }

    return (
        <div className="profilepage">
            <Navbar />
            <h1>Profile Management</h1>
            
            {isEditing || !profileData ? (
                <div>
                    <UserProfile 
                        initialData={profileData} 
                        onSubmit={handleFormSubmit}
                    />
                    {profileData && (
                        <button 
                            onClick={handleCancelEdit}
                            className="btn"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            ) : (
                <div>
                    <h2>Profile Information</h2>
                    <div className="profile-info-section">
                        <p><strong>Full Name:</strong> {profileData.fullName || 'Not set'}</p>
                        <p><strong>Email:</strong> {profileData.email || 'Not set'}</p>
                        <p><strong>Address 1:</strong> {profileData.address1 || 'Not set'}</p>
                        <p><strong>Address 2:</strong> {profileData.address2 || 'Not set'}</p>
                        <p><strong>City:</strong> {profileData.city || 'Not set'}</p>
                        <p><strong>State:</strong> {profileData.state || 'Not set'}</p>
                        <p><strong>Zip Code:</strong> {profileData.zip || 'Not set'}</p>
                        <p><strong>Skills:</strong> {profileData.skills?.length ? profileData.skills.join(", ") : 'None'}</p>
                        <p><strong>Role:</strong> {profileData.role || 'Not set'}</p>
                    </div>
                    <button 
                        onClick={handleEditClick}
                        className="btn"
                    >
                        Edit Profile
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProfilePage;