import React, { useState } from "react";
import './UserProfile.css';

function UserProfile({ userId,onSubmit }) {
    const [formData, setFormData] = useState({
        fullName: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        skills: [],
        preferences: "",
        availability: [],
    });

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [newAvailability, setNewAvailability] = useState("");

    const states = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];

    const skills = [
        "First-Aid", "Animal Handling", "Cooking", "Sewing", "Communication", "Fundraising"
    ];

    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => {
            if (type === "checkbox") {
                const newSkills = checked
                    ? [...prevState.skills, value]
                    : prevState.skills.filter(skill => skill !== value);
                return { ...prevState, [name]: newSkills };
            }
            return { ...prevState, [name]: value };
        });
    };

    

    const handleSubmit = (e) => {
        e.preventDefault();
        const requiredFields = ["fullName", "address1", "city", "state", "zipCode", "skills"];
        const missingFields = requiredFields.filter(field => 
            !formData[field] || 
            formData[field] === "" || 
            (field === "skills" && formData[field].length === 0)
        );
        if (missingFields.length > 0) {
            console.error("Missing or empty required fields:", missingFields);
            return;
        }
        console.log("Sending formData:", formData);
        fetch("http://localhost:5000/api/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
            credentials: "include",
        })
        .then((response) => {
            console.log("Response status:", response.status, "OK:", response.ok);
            if (!response.ok) {
                return response.json().then((err) => {
                    console.log("Error response:", err);
                    throw new Error(err.message || response.status);
                });
            }
            return response.json();
        })
        .then((data) => {
            console.log("Success response:", data);
            onSubmit(data.profileData); // Pass updated profile back to ProfilePage
        })
        .catch((error) => console.error("Error saving user profile:", error));
    };


    const toggleDropdown = () => {
        setDropdownOpen(prevState => !prevState);
    };

    const handleAddAvailability = () => {
        if (newAvailability && !formData.availability.includes(newAvailability)) {
            setFormData(prevState => ({
                ...prevState,
                availability: [...prevState.availability, newAvailability]
            }));
            setNewAvailability("");
        }
    };

    const handleRemoveAvailability = (date) => {
        setFormData(prevState => ({
            ...prevState,
            availability: prevState.availability.filter(d => d !== date)
        }));
    };

    return (
        <div className="profile-info-section">
            <form onSubmit={handleSubmit} className="userprofile-form">
                <div>
                    <label>Full Name:</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        maxLength={50}
                        required
                        className="userprofile-input"
                    />
                </div>

                <div>
                    <label>Address 1:</label>
                    <input
                        type="text"
                        name="address1"
                        value={formData.address1}
                        onChange={handleChange}
                        maxLength={100}
                        required
                        className="userprofile-input"
                    />
                </div>

                <div>
                    <label>Address 2:</label>
                    <input
                        type="text"
                        name="address2"
                        value={formData.address2}
                        onChange={handleChange}
                        maxLength={100}
                        className="userprofile-input"
                    />
                </div>

                <div>
                    <label>City:</label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        maxLength={100}
                        required
                        className="userprofile-input"
                    />
                </div>

                <div>
                    <label>State:</label>
                    <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="userprofile-select"
                    >
                        <option value="">Select State</option>
                        {states.map((stateCode) => (
                            <option key={stateCode} value={stateCode}>
                                {stateCode}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Zip Code:</label>
                    <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) { //only numbers
                                setFormData({ ...formData, zipCode: value });
                            }
                        }}
                        maxLength={9}
                        required
                        className="userprofile-input"
                    />
                </div>

                <div>
                    <label>Skills:</label>
                    <div className="custom-dropdown-container">
                        <button type="button" className="dropdown-button" onClick={toggleDropdown}>
                            {formData.skills.length === 0
                                ? "Select Skills"
                                : formData.skills.join(", ")}
                        </button>
                        {dropdownOpen && (
                            <div className="dropdown-content">
                                {skills.map((skill) => (
                                    <label key={skill} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            id={skill}
                                            name="skills"
                                            value={skill}
                                            checked={formData.skills.includes(skill)}
                                            onChange={handleChange}
                                        />
                                        {skill}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label>Preferences:</label>
                    <textarea
                        name="preferences"
                        value={formData.preferences}
                        onChange={handleChange}
                        rows="4"
                        cols="50"
                        className="userprofile-textarea"
                    />
                </div>

                <div>
                    <label>Availability:</label>
                    <div>
                        <input
                            type="date"
                            value={newAvailability}
                            onChange={(e) => setNewAvailability(e.target.value)}
                            className="userprofile-input"
                        />
                        <button type="button" onClick={handleAddAvailability} className="add-button">
                            Add Date
                        </button>
                    </div>
                    <ul className="availability-list">
                        {formData.availability.map((date, index) => (
                            <li key={index} className="availability-item">
                                {date}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAvailability(date)}
                                    className="remove-button"
                                >
                                    X
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <button type="submit" className="submit-button">Submit</button>
            </form>
        </div>
    );
}

export default UserProfile;
