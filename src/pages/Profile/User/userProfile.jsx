import React, { useState } from "react";

function userprofile({ onSubmit }) {
    const [formData, setFormData] = useState({
        fullName: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        skills: [],
        preferences: "",
        availability: "",
    });

    const [dropdownOpen, setDropdownOpen] = useState(false);

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
        onSubmit(formData); // pass data to parent component
    };

    const toggleDropdown = () => {
        setDropdownOpen(prevState => !prevState);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Full Name:</label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    maxLength={50}
                    required
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
                />
            </div>

            <div>
                <label>State:</label>
                <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
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
                />
            </div>

            <div>
                <label>Skills:</label>
                <div className="custom-dropdown">
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
                />
            </div>

            <div>
                <label>Availability:</label>
                <input
                    type="date"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    required
                />
            </div>

            <button type="submit">Submit</button>
        </form>
    );
}

export default userprofile;