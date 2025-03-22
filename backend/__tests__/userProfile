const request = require("supertest");
const { app, users } = require('../server');


app.put("/api/user/:id", (req, res) => {
    const user = users.find((u) => u.id === parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { fullName, address1, address2, city, state, zip, skills, preferences, availability } = req.body;
    
    if (!fullName || fullName.trim() === "") {
      return res.status(400).json({ message: "Full name is required" });
    }
  
    if (!address1 || address1.trim() === "") {
      return res.status(400).json({ message: "Address line 1 is required" });
    }
  
    if (!city || city.trim() === "") {
      return res.status(400).json({ message: "City is required" });
    }
  
    if (!state || state.trim() === "") {
      return res.status(400).json({ message: "State is required" });
    }
  
    if (!zip || zip.trim() === "") {
      return res.status(400).json({ message: "Zip code is required" });
    }
  
    if (!skills || skills.length === 0) {
      return res.status(400).json({ message: "At least one skill is required" });
    }
  
    user.fullName = fullName;
    user.address1 = address1;
    user.address2 = address2;
    user.city = city;
    user.state = state;
    user.zip = zip;
    user.skills = skills;
    user.preferences = preferences;
    user.availability = availability;
    res.json({ message: "Profile updated successfully", user });
  });

  describe("Test API Routes", () => {
  
    it("should update a user profile successfully", async () => {
      const response = await request(app)
        .put("/api/user/3")
        .send({
          fullName: "Peppermint Patty",
          address1: "New Address",
          address2: "Apt 123",
          city: "New City",
          state: "NY",
          zip: "12345",
          skills: ["First Aid", "Logistics"],
          preferences: "Updated preferences",
          availability: ["2024-07-15"],
        });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Profile updated successfully");
    });
  
    it("should return 404 for updating a non-existing user", async () => {
      const response = await request(app)
        .put("/api/user/999")
        .send({ fullName: "Non-existing User" });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });
  
  
    it("should return 400 error for missing profile fields", async () => {
      const response = await request(app)
        .put("/api/user/3")
        .send({
          fullName: "",
          address1: "123 Main St",
          city: "Long Island",
          state: "NY",
          zip: "10001",
          skills: ["first aid"]
        });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Full name is required");
    });
  
    it("should return 400 error for missing address1", async () => {
      const response = await request(app)
        .put("/api/user/3")
        .send({
          fullName: "Charlie Brown",
          address1: "",
          city: "Long Island",
          state: "NY",
          zip: "10001",
          skills: ["first aid"]
        });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Address line 1 is required");
    });
  
    it("should return 400 error for missing city", async () => {
      const response = await request(app)
        .put("/api/user/3")
        .send({
          fullName: "Charlie Brown",
          address1: "123 Main St",
          city: "",
          state: "NY",
          zip: "10001",
          skills: ["first aid"]
        });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("City is required");
    });
  });