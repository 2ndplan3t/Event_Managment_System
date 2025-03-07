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

app.get("/api/user/:id/volunteer-history", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id) && u.role === "volunteer");
  if (!user) {
    return res.status(404).json({ message: "User not found or not a volunteer" });
  }
  res.json(user.volunteerHistory);
});

app.post("/api/volunteer-history/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const { event, location, date, status } = req.body;

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!user.volunteerHistory) {
    user.volunteerHistory = [];
  }

  const newEvent = { event, location, date, status };
  user.volunteerHistory.push(newEvent);

  res.json({ message: "Volunteer history updated successfully", volunteerHistory: user.volunteerHistory });
});

app.delete("/api/volunteer-history/:id/:eventIndex", (req, res) => {
  const userId = parseInt(req.params.id);
  const eventIndex = parseInt(req.params.eventIndex);
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!user.volunteerHistory || eventIndex < 0 || eventIndex >= user.volunteerHistory.length) {
    return res.status(400).json({ message: "Invalid event index" });
  }

  user.volunteerHistory.splice(eventIndex, 1);
  res.json({ message: "Volunteer event removed successfully", volunteerHistory: user.volunteerHistory });
});

describe("Volunteer History API Tests", () => {
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

  it("should return an empty array for a user with no volunteer history", async () => {
    const response = await request(app).get("/api/user/3/volunteer-history");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("should return 404 for a non-existent user", async () => {
    const response = await request(app).get("/api/user/999/volunteer-history");
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found or not a volunteer");
  });

  it("should add a volunteer event to a user’s history", async () => {
    const newEvent = {
      event: "Food Drive",
      location: "Community Center",
      date: "2024-07-01",
      status: "Completed"
    };
    const response = await request(app).post("/api/volunteer-history/3").send(newEvent);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Volunteer history updated successfully");
    expect(response.body.volunteerHistory).toContainEqual(newEvent);
  });

  it("should return 404 when adding an event to a non-existent user", async () => {
    const response = await request(app).post("/api/volunteer-history/999").send({
      event: "Food Drive",
      location: "Community Center",
      date: "2024-07-01",
      status: "Completed"
    });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  it("should delete a volunteer event from a user’s history", async () => {
    const response = await request(app).delete("/api/volunteer-history/4/0");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Volunteer event removed successfully");
    expect(response.body.volunteerHistory).toEqual([]);
  });

  it("should return 400 when trying to delete a non-existent event", async () => {
    const response = await request(app).delete("/api/volunteer-history/4/99");
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid event index");
  });
});