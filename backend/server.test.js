const request = require("supertest");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Hardcoded admin and volunteer profiles
const users = [
  { id: 1, email: "admin@example.com", password: "admin_123", role: "admin", fullName: "Admin" },
  { id: 2, email: "johndoe@gmail.com", password: "admin_123", role: "admin", fullName: "John Doe" },
  { id: 3, email: "charlie@example.com", password: "volunteer_123", role: "volunteer", fullName: "Charlie", skills: ["First Aid", "Security"], volunteerHistory: [], notifications: [] },
  { id: 4, email: "alice@example.com", password: "volunteer_123", role: "volunteer", fullName: "Alice", skills: ["First Aid", "Logistics"], volunteerHistory: [{ event: "Charity Run", location: "18427 Southwest Fwy, Sugar Land, TX 77479", date: "2024-06-15", status: "Completed" }], notifications: [] }
];

// Endpoints
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working" });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    res.json({ message: "Login successful", id: user.id, fullName: user.fullName, email: user.email, role: user.role });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

app.get("/api/admin/:id", (req, res) => {
  const admin = users.find((user) => user.id === parseInt(req.params.id) && user.role === "admin");
  if (admin) {
    res.json(admin);
  } else {
    res.status(404).json({ message: "Admin not found" });
  }
});

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


app.get("/api/user/:id/volunteer-history", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id) && u.role === "volunteer");
  if (!user) {
    return res.status(404).json({ message: "User not found or not a volunteer" });
  }
  res.json(user.volunteerHistory);
});

describe("Test API Routes", () => {
  it("should return a working message for /api/test", async () => {
    const response = await request(app).get("/api/test");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Backend is working");
  });

  it("should login successfully with valid credentials", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: "admin@example.com", password: "admin_123" });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.role).toBe("admin");
  });

  it("should return an error for invalid login credentials", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: "wrong@example.com", password: "wrong_password" });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  it("should return an admin profile for valid admin id", async () => {
    const response = await request(app).get("/api/admin/1");
    expect(response.status).toBe(200);
    expect(response.body.fullName).toBe("Admin");
  });

  it("should return a 404 error for invalid admin id", async () => {
    const response = await request(app).get("/api/admin/999");
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Admin not found");
  });

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

  it("should return volunteer history for a user", async () => {
    const response = await request(app).get("/api/user/4/volunteer-history");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { event: "Charity Run", location: "18427 Southwest Fwy, Sugar Land, TX 77479", date: "2024-06-15", status: "Completed" },
    ]);
  });

  it("should return 404 if user is not a volunteer", async () => {
    const response = await request(app).get("/api/user/1/volunteer-history");
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found or not a volunteer");
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
