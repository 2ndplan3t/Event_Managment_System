const request = require("supertest");
const { app, users, events } = require("../server.js");
const bcrypt = require("bcrypt");

describe("Express App", () => {
  let server;
  let testUser;
  let sessionCookie;

  beforeAll(async () => {
    // Starting the app
    server = app.listen(3000);
    
    //existing user in database
    testUser = { email: "alice@example.com", password: "volunteer_123" };
    

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
        role: "Volunteer",
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

