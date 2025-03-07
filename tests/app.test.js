const request = require("supertest");
const { app, users, events } = require("../backend/server.js");
const bcrypt = require("bcrypt");

describe("Express App", () => {
  let server;
  let testUser;
  let sessionCookie;

  beforeAll(async () => {
    // Starting the app
    server = app.listen(3000);
    
    // Create a user for testing purposes
    testUser = { email: "testuser@example.com", password: "testpass123", role: "volunteer" };
    
    // Hash password for testUser
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    users.push({ id: users.length + 1, email: testUser.email, password: hashedPassword, role: testUser.role, fullName: "Test User" });
  });

  afterAll(() => {
    // Close the server after tests are done
    server.close();
  });

  // Test case for user registration
  it("should register a new user", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        fullName: "New User",
        email: "newuser@example.com",
        password: "newpass123",
        role: "volunteer",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Registration successful");
  });

  // Test case for login
  it("should log in an existing user", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user.email).toBe(testUser.email);

    // Capture the session cookie from login response
    sessionCookie = response.headers["set-cookie"][0];
  });

  // Test case for getting the logged-in user's profile
  it("should get the logged-in user's profile", async () => {
    const profileResponse = await request(app)
      .get("/api/profile")
      .set("Cookie", sessionCookie); // Send the session cookie here

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.profileData).toHaveProperty("fullName");
    expect(profileResponse.body.profileData.email).toBe(testUser.email);
  });

  // Test case for creating an event
  it("should create a new event", async () => {
    const response = await request(app)
      .post("/api/events")
      .send({
        name: "Volunteer Event",
        location: "123 Main St",
        envoy: "Envoy Name",
        requiredSkills: ["First Aid"],
        urgencyLevel: "High",
        date: "2025-03-15",
        manager: "Manager Name",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Volunteer Event");
  });

  // Test case for fetching all events
  it("should get all events", async () => {
    const response = await request(app).get("/api/events");

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  // Test case for deleting an event
  it("should delete an event", async () => {
    const newEventResponse = await request(app)
      .post("/api/events")
      .send({
        name: "Event to Delete",
        location: "123 Delete St",
        envoy: "Envoy Name",
        requiredSkills: ["First Aid"],
        urgencyLevel: "High",
        date: "2025-03-20",
        manager: "Manager Name",
      });

    const eventId = newEventResponse.body.id;

    const deleteResponse = await request(app)
      .delete(`/api/events/${eventId}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe("Event deleted successfully.");
  });

  // Test case for updating user profile
  it("should update the user's profile", async () => {
    const updatedProfileResponse = await request(app)
      .put("/api/profile")
      .set("Cookie", sessionCookie) // Send the session cookie here
      .send({
        fullName: "Updated User",
        address1: "123 Updated St",
        city: "Updated City",
        state: "UT",
        zipCode: "12345",
        skills: ["First Aid", "Logistics"],
      });

    expect(updatedProfileResponse.status).toBe(200);
    expect(updatedProfileResponse.body.message).toBe("Profile updated successfully");
    expect(updatedProfileResponse.body.profileData.fullName).toBe("Updated User");
  });
});

/*const request = require("supertest");
const bcrypt = require("bcrypt");
const { app, users, events } = require("../backend/server.js"); // Import your server

describe("Express App", () => {
  let server;
  let testUser;
  let sessionCookie;

  beforeAll(async () => {
    // Create a user for testing purposes
    testUser = { email: "testuser@example.com", password: "testpass123", role: "volunteer" };
    
    // Hash password for testUser
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    users.push({ id: users.length + 1, email: testUser.email, password: hashedPassword, role: testUser.role, fullName: "Test User" });

    // Start the server here to ensure it's up during testing
    server = app.listen(3000);
  });

  afterAll(() => {
    // Close the server after tests are done
    server.close();
  });

  // Test case for user registration
  it("should register a new user", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        fullName: "New User",
        email: "newuser@example.com",
        password: "newpass123",
        role: "volunteer",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Registration successful");
  });

  // Test case for login
  it("should log in an existing user", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user.email).toBe(testUser.email);

    // Capture the session cookie from login response
    sessionCookie = response.headers["set-cookie"][0];
  });

  // Test case for getting the logged-in user's profile
  it("should get the logged-in user's profile", async () => {
    const profileResponse = await request(app)
      .get("/api/profile")
      .set("Cookie", sessionCookie); // Send the session cookie here

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.profileData).toHaveProperty("fullName");
    expect(profileResponse.body.profileData.email).toBe(testUser.email);
  });

  // Test case for creating an event
  it("should create a new event", async () => {
    const response = await request(app)
      .post("/api/events")
      .send({
        name: "Volunteer Event",
        location: "123 Main St",
        envoy: "Envoy Name",
        requiredSkills: ["First Aid"],
        urgencyLevel: "High",
        date: "2025-03-15",
        manager: "Manager Name",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Volunteer Event");
  });

  // Test case for fetching all events
  it("should get all events", async () => {
    const response = await request(app).get("/api/events");

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  // Test case for deleting an event
  it("should delete an event", async () => {
    const newEventResponse = await request(app)
      .post("/api/events")
      .send({
        name: "Event to Delete",
        location: "123 Delete St",
        envoy: "Envoy Name",
        requiredSkills: ["First Aid"],
        urgencyLevel: "High",
        date: "2025-03-20",
        manager: "Manager Name",
      });

    const eventId = newEventResponse.body.id;

    const deleteResponse = await request(app)
      .delete(`/api/events/${eventId}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe("Event deleted successfully.");
  });

  // Test case for updating user profile
  it("should update the user's profile", async () => {
    const updatedProfileResponse = await request(app)
      .put("/api/profile")
      .set("Cookie", sessionCookie) // Send the session cookie here
      .send({
        fullName: "Updated User",
        address1: "123 Updated St",
        city: "Updated City",
        state: "UT",
        zipCode: "12345",
        skills: ["First Aid", "Logistics"],
      });

    expect(updatedProfileResponse.status).toBe(200);
    expect(updatedProfileResponse.body.message).toBe("Profile updated successfully");
    expect(updatedProfileResponse.body.profileData.fullName).toBe("Updated User");
  });
});*/

/*
const request = require("supertest");
const bcrypt = require("bcrypt");
const { app, users, events } = require("../backend/server.js"); // Import your server

 describe("Express App", () => {
  let server;
  let testUser;
  let sessionCookie;

  beforeAll(async () => {
    // Create a user for testing purposes
    testUser = { email: "testuser@example.com", password: "testpass123", role: "volunteer" };
    
    // Hash password for testUser
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    users.push({ id: users.length + 1, email: testUser.email, password: hashedPassword, role: testUser.role, fullName: "Test User" });

    // Start the server here to ensure it's up during testing
    //server = app.listen(3000);
    server = app.listen(0, () => {
        console.log(`Test server running on port ${server.address().port}`);
      });
  });

  afterAll(() => {
    // Close the server after tests are done
    server.close();
  });

  // Test case for user registration
  it("should register a new user", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        fullName: "New User",
        email: "newuser@example.com",
        password: "newpass123",
        role: "volunteer",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Registration successful");
  });

  // Test case for registration with missing fields
  it("should return an error for registration with missing fields", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        fullName: "Incomplete User",
        email: "", // Missing email
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email already in use."); // This might change based on validation
  });

  // Test case for login
  it("should log in an existing user", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user.email).toBe(testUser.email);

    // Capture the session cookie from login response
    sessionCookie = response.headers["set-cookie"][0];
  });

  // Test case for invalid login (wrong password)
  it("should return an error for invalid login (wrong password)", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: testUser.email, password: "wrongpassword" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  // Test case for accessing profile without login
  it("should return an error for accessing profile without login", async () => {
    const response = await request(app)
      .get("/api/profile");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Not authenticated");
  });

  // Test case for logging out
  it("should log out the user and clear the session", async () => {
    const loginResponse = await request(app)
      .post("/api/login")
      .send({ email: testUser.email, password: testUser.password });

    const logoutResponse = await request(app)
      .post("/api/logout")
      .set("Cookie", loginResponse.headers["set-cookie"][0]);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.message).toBe("Logout successful");

    const profileResponse = await request(app)
      .get("/api/profile")
      .set("Cookie", loginResponse.headers["set-cookie"][0]);

    expect(profileResponse.status).toBe(401);
    expect(profileResponse.body.message).toBe("Not authenticated");
  });

  // Test case for updating user profile without authentication
  it("should return an error for updating profile without login", async () => {
    const updatedProfileResponse = await request(app)
      .put("/api/profile")
      .send({
        fullName: "Updated User",
        address1: "123 Updated St",
        city: "Updated City",
        state: "UT",
        zipCode: "12345",
        skills: ["First Aid", "Logistics"],
      });

    expect(updatedProfileResponse.status).toBe(401);
    expect(updatedProfileResponse.body.message).toBe("Unauthorized: Please log in");
  });

  // Test case for getting logged-in user's profile
  it("should get the logged-in user's profile", async () => {
    const profileResponse = await request(app)
      .get("/api/profile")
      .set("Cookie", sessionCookie); // Send the session cookie here

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.profileData).toHaveProperty("fullName");
    expect(profileResponse.body.profileData.email).toBe(testUser.email);
  });

  // Test case for creating an event
  it("should create a new event", async () => {
    const response = await request(app)
      .post("/api/events")
      .send({
        name: "Volunteer Event",
        location: "123 Main St",
        envoy: "Envoy Name",
        requiredSkills: ["First Aid"],
        urgencyLevel: "High",
        date: "2025-03-15",
        manager: "Manager Name",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Volunteer Event");
  });

  // Test case for fetching all events
  it("should get all events", async () => {
    const response = await request(app).get("/api/events");

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  // Test case for deleting an event
  it("should delete an event", async () => {
    const newEventResponse = await request(app)
      .post("/api/events")
      .send({
        name: "Event to Delete",
        location: "123 Delete St",
        envoy: "Envoy Name",
        requiredSkills: ["First Aid"],
        urgencyLevel: "High",
        date: "2025-03-20",
        manager: "Manager Name",
      });

    const eventId = newEventResponse.body.id;

    const deleteResponse = await request(app)
      .delete(`/api/events/${eventId}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe("Event deleted successfully.");
  });

  // Test case for deleting a non-existent event
  it("should return an error when trying to delete a non-existent event", async () => {
    const deleteResponse = await request(app)
      .delete(`/api/events/99999`);

    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body.message).toBe("Event not found.");
  });

  // Test case for matching volunteers with an event
  it("should match volunteers based on required skills", async () => {
    const newEventResponse = await request(app)
      .post("/api/events")
      .send({
        name: "First Aid Event",
        location: "123 Skill St",
        envoy: "Envoy Name",
        requiredSkills: ["First Aid"],
        urgencyLevel: "High",
        date: "2025-03-25",
        manager: "Manager Name",
      });

    const eventId = newEventResponse.body.id;

    const matchResponse = await request(app)
      .post(`/api/events/match-volunteers/${eventId}`);

    expect(matchResponse.status).toBe(200);
    expect(matchResponse.body.length).toBeGreaterThan(0);
    expect(matchResponse.body[0].skills).toContain("First Aid");
  });
});
*/
