const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app, events, users } = require('../server');

describe("Test API Routes", () => {
  it("should return a working message for /api/test", async () => {
    const response = await request(app).get("/api/test");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Backend is working");
  });
});

describe("POST /api/register", () => {

  it("should register a new user successfully", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        fullName: "Jane Doe",
        email: "janedoe@example.com",
        password: "password123"
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Registration successful");
  });

  it("should return 400 if email is already in use", async () => {
    await request(app)
      .post("/api/register")
      .send({
        fullName: "John Doe",
        email: "johndoe@gmail.com",
        password: "password123"
      });

    const response = await request(app)
      .post("/api/register")
      .send({
        fullName: "John Doe",
        email: "johndoe@gmail.com",
        password: "password123"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email already in use.");
  });
});

describe('POST /api/login', () => {
  beforeEach(async () => {
    // Make sure we log out before running the test
    await request(app).post('/api/logout');
  });

  // Test successful login with valid credentials
  it('should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'admin@example.com', password: 'admin_123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful');
  });

  // Test invalid login with wrong password
  it('should return error for invalid password', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'admin@example.com', password: 'wrong_password' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  // Test login with missing credentials
  it('should return error for missing email or password', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ email: 'admin@example.com' }); 

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Password is required');
  });

  it('should return error for missing email', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ password: 'admin_123' });  // No email provided

    expect(response.status).toBe(400);  // Bad request
    expect(response.body.message).toBe('Email is required');
  });
});


describe("GET /api/isLoggedIn and PUT /api/profile", () => {
  let cookie;

  beforeEach(async () => {
    // Clear session before each test
    await request(app).post("/api/logout");

    // Log in and get session cookie
    const loginResponse = await request(app)
      .post("/api/login")
      .send({ email: "charlie@example.com", password: "volunteer_123" });

    //console.log("Login status:", loginResponse.status);
    //console.log("Login response body:", loginResponse.body);
    //console.log("Set-Cookie header:", loginResponse.headers["set-cookie"]);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.message).toBe("Login successful");

    cookie = loginResponse.headers["set-cookie"];
    if (!cookie) {
      throw new Error("No cookie returned from login");
    }
    //console.log("Captured cookie:", cookie);
  });

  it("should login and return true for loggedIn status", async () => {
    const sessionCheckResponse = await request(app)
      .get("/api/isLoggedIn")
      .set("Cookie", cookie);

    //console.log("isLoggedIn status:", sessionCheckResponse.status);
    //console.log("isLoggedIn body:", sessionCheckResponse.body);

    expect(sessionCheckResponse.status).toBe(200);
    expect(sessionCheckResponse.body.loggedIn).toBe(true);
  });

  it("should update profile successfully for authenticated user", async () => {
    const updatedProfile = {
      fullName: "Charlie Updated",
      address1: "456 Elm St",
      city: "New City",
      state: "TX",
      zipCode: "78901",
      skills: ["First Aid", "CPR"],
    };

    const response = await request(app)
      .put("/api/profile")
      .set("Cookie", cookie)
      .send(updatedProfile);

    //console.log("PUT status:", response.status);
    //console.log("PUT response body:", response.body);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Profile updated successfully");
    expect(response.body.profileData).toMatchObject({
      id: 3,
      email: "charlie@example.com",
      role: "volunteer",
      fullName: "Charlie Updated",
      address1: "456 Elm St",
      city: "New City",
      state: "TX",
      zip: "78901",
      skills: ["First Aid", "CPR"],
    });
    expect(response.body.profileData.address2).toBe("");
    expect(response.body.profileData.preferences).toBe("");
    expect(response.body.profileData.availability).toEqual([]);
  });
});

describe('POST /api/logout', () => {

  it('should log out the user and destroy the session', async () => {
    // First, simulate a login so that a session exists
    await request(app)
      .post('/api/login')
      .send({
        email: 'admin@example.com',  // Use a valid email from your test data
        password: 'admin_123',
      })
      .expect(200);

    // Now, test the logout
    const response = await request(app)
      .post('/api/logout')
      .expect(200);

    // Check that the session is destroyed and the correct message is returned
    expect(response.body.message).toBe('Logout successful');
  });

});

describe("GET /api/admin/profile", () => {
  let adminCookie;
  let volunteerCookie;
  afterAll(async () => {
    await request(app).post("/api/logout");
  });
  // Setup: Log in as admin and volunteer before tests
  beforeEach(async () => {
    // Clear session
    await request(app).post("/api/logout");

    // Log in as admin
    const adminLogin = await request(app)
      .post("/api/login")
      .send({ email: "admin@example.com", password: "admin_123" });
    adminCookie = adminLogin.headers["set-cookie"];
    //console.log("Admin Login Status:", adminLogin.status);
    //console.log("Admin Cookie:", adminCookie);

    // Log in as volunteer
    const volunteerLogin = await request(app)
      .post("/api/login")
      .send({ email: "alice@example.com", password: "volunteer_123" });
    volunteerCookie = volunteerLogin.headers["set-cookie"];
  });

  it("should return admin profile for authenticated admin user", async () => {
    const response = await request(app)
      .get("/api/admin/profile")
      .set("Cookie", adminCookie); // Send admin session cookie

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      email: "admin@example.com",
      fullName: "Admin",
      role: "admin",
    });
  });
  

  it("should return 403 for authenticated non-admin user", async () => {
    const response = await request(app)
      .get("/api/admin/profile")
      .set("Cookie", volunteerCookie); // Send volunteer session cookie

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied: Admins only");
  });

  it("should return 401 for unauthenticated user", async () => {
    const response = await request(app).get("/api/admin/profile"); // No cookie sent

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized: Please log in");
  });
});

describe("GET /api/profile", () => {
  let cookie;
  afterAll(async () => {
    await request(app).post("/api/logout");
  });
  beforeEach(async () => {
    // Clear session before each test
    await request(app).post("/api/logout");

    // Log in to get a session cookie
    const loginResponse = await request(app)
      .post("/api/login")
      .send({ email: "admin@example.com", password: "admin_123" });
    cookie = loginResponse.headers["set-cookie"];
  });

  it("should return profile data for authenticated user", async () => {
    const response = await request(app)
      .get("/api/profile")
      .set("Cookie", cookie); // Send session cookie

    expect(response.status).toBe(200);
    expect(response.body.profileData).toMatchObject({
      id: 1,
      email: "admin@example.com",
      fullName: "Admin",
      role: "admin",
    });
  });

  it("should return 401 for unauthenticated user", async () => {
    const response = await request(app).get("/api/profile"); // No cookie sent

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Not authenticated");
  });
});


describe("GET /api/events", () => {
  beforeEach(() => {
    // Reset events array before each test
    events.length = 0; // Clear any existing events
    events.push({
      id: 1,
      name: "Test Event 1",
      location: "123 Main St",
      envoy: "Red Cross",
      requiredSkills: ["First Aid"],
      urgencyLevel: "High",
      date: "2025-03-15",
      manager: "John Doe",
      selectedVolunteers: [],
    });
  });

  it("should return all events", async () => {
    const response = await request(app).get("/api/events");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: 1,
      name: "Test Event 1",
      location: "123 Main St",
      envoy: "Red Cross",
      requiredSkills: ["First Aid"],
      urgencyLevel: "High",
      date: "2025-03-15",
      manager: "John Doe",
      selectedVolunteers: [],
    });
  });

  it("should return an empty array if no events exist", async () => {
    events.length = 0; // Clear events
    const response = await request(app).get("/api/events");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe("DELETE /api/events/:id", () => {
  beforeEach(() => {
    // Set up mock event data
    events.length = 0; // Clear events array before each test
    events.push({
      id: 1,
      name: "Test Event 1",
      location: "123 Main St",
      envoy: "Red Cross",
      requiredSkills: ["First Aid"],
      urgencyLevel: "High",
      date: "2025-03-15",
      manager: "John Doe",
      selectedVolunteers: [],
    });
    events.push({
      id: 2,
      name: "Test Event 2",
      location: "456 Elm St",
      envoy: "Fire Department",
      requiredSkills: ["Fire Safety"],
      urgencyLevel: "Medium",
      date: "2025-03-20",
      manager: "Jane Doe",
      selectedVolunteers: [],
    });
  });

  it("should delete the event and return a success message", async () => {
    const response = await request(app).delete("/api/events/1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Event deleted successfully.");

    // Check if the event with ID 1 was removed
    expect(events).toHaveLength(1); // Only one event should remain
    expect(events[0].id).toBe(2); // The remaining event should have ID 2
  });

  it("should return a 404 if the event does not exist", async () => {
    const response = await request(app).delete("/api/events/999");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Event not found.");
  });
});

describe("GET /api/volunteers", () => {
  beforeEach(() => {
    // Clear the users array before each test to ensure no leftover data
    users.length = 0;
  });

  it("should return all volunteers", async () => {
    // Add some sample users with different roles
    users.push({
      id: 1,
      name: "John Doe",
      role: "volunteer",
      skills: ["First Aid"]
    });
    users.push({
      id: 2,
      name: "Jane Doe",
      role: "admin",
      skills: ["Leadership"]
    });

    // Send GET request to fetch volunteers
    const response = await request(app).get("/api/volunteers");

    // Check the response status and content
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1); // Only 1 volunteer should be returned
    expect(response.body[0]).toMatchObject({
      name: "John Doe",
      role: "volunteer",
      skills: ["First Aid"]
    });
  });

  it("should return an empty array if no volunteers exist", async () => {
    // Ensure there are no users in the users array
    users.length = 0;

    // Send GET request to fetch volunteers
    const response = await request(app).get("/api/volunteers");

    // Check the response status and content
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]); // Empty array should be returned
  });
});

describe("POST /api/events/match-volunteers/:eventId", () => {
  beforeEach(() => {
    // Clear events and users array before each test to ensure no leftover data
    events.length = 0;
    users.length = 0;
  });

  it("should return matched volunteers for an event", async () => {
    // Add sample volunteers with skills
    users.push({
      id: 1,
      name: "John Doe",
      role: "volunteer",
      skills: ["First Aid"]
    });
    users.push({
      id: 2,
      name: "Jane Smith",
      role: "volunteer",
      skills: ["CPR"]
    });
    users.push({
      id: 3,
      name: "Alice Brown",
      role: "volunteer",
      skills: ["First Aid", "CPR"]
    });

    // Add a sample event that requires "First Aid"
    events.push({
      id: 1,
      name: "Emergency Response",
      requiredSkills: ["First Aid"],
      location: "123 Main St",
      date: "2025-03-15"
    });

    // Send POST request to match volunteers for event with ID 1
    const response = await request(app).post('/api/events/match-volunteers/1');

    // Check the response status and matched volunteers
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2); // 2 volunteers should be matched with "First Aid" skills
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "John Doe", skills: expect.arrayContaining(["First Aid"]) }),
        expect.objectContaining({ name: "Alice Brown", skills: expect.arrayContaining(["First Aid", "CPR"]) })
      ])
    );
  });

  it("should return 404 if event does not exist", async () => {
    // Send POST request with an invalid event ID
    const response = await request(app).post('/api/events/match-volunteers/999');

    // Check if a 404 status is returned
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Event not found.");
  });
});

describe("GET /api/profile/:id", () => {
  beforeEach(() => {
    // Clear the users array before each test to ensure a clean state
    users.length = 0;
  });

  it("should return user profile for a valid user id", async () => {
    // Adding test users
    users.push({ id: 1, name: "John Doe", email: "john@example.com" });
    users.push({ id: 2, name: "Jane Smith", email: "jane@example.com" });

    // Send GET request for user with id = 1
    const response = await request(app).get('/api/profile/1');

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      name: "John Doe",
      email: "john@example.com"
    });
  });

  it("should return 404 if user not found", async () => {
    // Send GET request with a non-existent user id
    const response = await request(app).get('/api/profile/999');

    // Assertions
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });
});


describe("POST /api/volunteer-history/:id", () => {
  const initialUsers = [
    {
      id: 1,
      email: "admin@example.com",
      password: "$2b$10$...", // Replace with actual hash if needed
      role: "admin",
      fullName: "Admin",
    },
    {
      id: 2,
      email: "johndoe@gmail.com",
      password: "$2b$10$...",
      role: "admin",
      fullName: "John Doe",
    },
    {
      id: 3,
      email: "charlie@example.com",
      password: "$2b$10$...",
      role: "volunteer",
      fullName: "Charlie",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      skills: ["First Aid", "Security"],
      volunteerHistory: [],
      notifications: [],
    },
    {
      id: 4,
      email: "alice@example.com",
      password: "$2b$10$...",
      role: "volunteer",
      fullName: "Alice",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      skills: ["First Aid", "Logistics"],
      volunteerHistory: [
        {
          event: "Charity Run",
          eventdesc: "To raise awareness and money for lesser-known diseases",
          location: "18427 Southwest Fwy, Sugar Land, TX 77479",
          date: "2024-06-15",
          status: "Completed",
        },
      ],
      notifications: [],
    },
  ];

  beforeEach(() => {
    // Reset users to initial state
    users.length = 0;
    initialUsers.forEach(user => users.push({ ...user }));
    //console.log("Users reset:", users.map(u => ({ id: u.id, email: u.email })));
  });

  it("should add a volunteer event to an existing user's history", async () => {
    const newEvent = {
      event: "Food Drive",
      eventdesc: "Collected food for the needy",
      location: "123 Elm St",
      date: "2024-07-01",
      status: "Completed",
      fullName: "Charlie",
      address1: "456 Oak St",
      city: "Houston",
      state: "TX",
      zipCode: "77001",
      skills: ["First Aid", "Security"],
    };

    const response = await request(app)
      .post("/api/volunteer-history/3")
      .send(newEvent);

    //console.log("Response:", response.status, response.body);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Volunteer history updated successfully");
    expect(response.body.volunteerHistory).toEqual([newEvent]);

    const charlie = users.find((u) => u.id === 3);
    expect(charlie.volunteerHistory).toEqual([newEvent]);
  });

  it("should append to an existing volunteer history", async () => {
    const newEvent = {
      event: "Cleanup Day",
      eventdesc: "Cleaned up local park",
      location: "789 Pine St",
      date: "2024-08-01",
      status: "Completed",
      fullName: "Alice",
      address1: "101 Maple St",
      city: "Sugar Land",
      state: "TX",
      zipCode: "77479",
      skills: ["First Aid", "Logistics"],
    };

    const response = await request(app)
      .post("/api/volunteer-history/4")
      .send(newEvent);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Volunteer history updated successfully");
    expect(response.body.volunteerHistory).toHaveLength(2);
    expect(response.body.volunteerHistory[1]).toEqual(newEvent);
  });

  it("should return 404 if user ID does not exist", async () => {
    const newEvent = {
      event: "Test Event",
      eventdesc: "Test description",
      location: "Test location",
      date: "2024-09-01",
      status: "Pending",
      fullName: "Unknown",
      address1: "123 Test St",
      city: "Test City",
      state: "TS",
      zipCode: "12345",
      skills: ["Test Skill"],
    };

    const response = await request(app)
      .post("/api/volunteer-history/999")
      .send(newEvent);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  // Add your other tests for missing fields here...
});

describe("DELETE /api/volunteer-history/:id/:eventIndex", () => {
  const initialUsers = [
    {
      id: 1,
      email: "admin@example.com",
      password: "$2b$10$...", // Placeholder hash
      role: "admin",
      fullName: "Admin",
    },
    {
      id: 2,
      email: "johndoe@gmail.com",
      password: "$2b$10$...",
      role: "admin",
      fullName: "John Doe",
    },
    {
      id: 3,
      email: "charlie@example.com",
      password: "$2b$10$...",
      role: "volunteer",
      fullName: "Charlie",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      skills: ["First Aid", "Security"],
      volunteerHistory: [
        {
          event: "Food Drive",
          eventdesc: "Collected food for the needy",
          location: "123 Elm St",
          date: "2024-07-01",
          status: "Completed",
        },
      ],
      notifications: [],
    },
    {
      id: 4,
      email: "alice@example.com",
      password: "$2b$10$...",
      role: "volunteer",
      fullName: "Alice",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      skills: ["First Aid", "Logistics"],
      volunteerHistory: [
        {
          event: "Charity Run",
          eventdesc: "To raise awareness and money for lesser-known diseases",
          location: "18427 Southwest Fwy, Sugar Land, TX 77479",
          date: "2024-06-15",
          status: "Completed",
        },
        {
          event: "Cleanup Day",
          eventdesc: "Cleaned up local park",
          location: "789 Pine St",
          date: "2024-08-01",
          status: "Completed",
        },
      ],
      notifications: [],
    },
  ];

  beforeEach(() => {
    // Reset users to initial state
    users.length = 0;
    initialUsers.forEach(user => users.push({ ...user }));
    //console.log("Users reset for DELETE tests:", users.map(u => ({ id: u.id, email: u.email, volunteerHistoryLength: u.volunteerHistory.length })));
  });

  it("should remove a volunteer event from a user's history", async () => {
    const userId = 3; // Charlie
    const eventIndex = 0; // First event (Food Drive)

    const response = await request(app).delete(`/api/volunteer-history/${userId}/${eventIndex}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Volunteer event removed successfully");
    expect(response.body.volunteerHistory).toEqual([]); // Charlie's history should now be empty

    const charlie = users.find((u) => u.id === userId);
    expect(charlie.volunteerHistory).toEqual([]); // Verify in-memory update
  });

  it("should remove a specific event from a multi-event history", async () => {
    const userId = 4; // Alice
    const eventIndex = 1; // Second event (Cleanup Day)

    const response = await request(app).delete(`/api/volunteer-history/${userId}/${eventIndex}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Volunteer event removed successfully");
    expect(response.body.volunteerHistory).toHaveLength(1);
    expect(response.body.volunteerHistory[0]).toMatchObject({
      event: "Charity Run",
      eventdesc: "To raise awareness and money for lesser-known diseases",
      location: "18427 Southwest Fwy, Sugar Land, TX 77479",
      date: "2024-06-15",
      status: "Completed",
    });

    const alice = users.find((u) => u.id === userId);
    expect(alice.volunteerHistory).toHaveLength(1);
    expect(alice.volunteerHistory[0]).toMatchObject({
      event: "Charity Run",
      eventdesc: "To raise awareness and money for lesser-known diseases",
    });
  });

  it("should return 404 if user ID does not exist", async () => {
    const userId = 999; // Non-existent user
    const eventIndex = 0;

    const response = await request(app).delete(`/api/volunteer-history/${userId}/${eventIndex}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  it("should return 400 if event index is negative", async () => {
    const userId = 3; // Charlie
    const eventIndex = -1; // Invalid index

    const response = await request(app).delete(`/api/volunteer-history/${userId}/${eventIndex}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid event index");
  });

  it("should return 400 if event index is out of bounds", async () => {
    const userId = 3; // Charlie
    const eventIndex = 1; // Beyond current length (1 event)

    const response = await request(app).delete(`/api/volunteer-history/${userId}/${eventIndex}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid event index");
  });

  it("should return 400 if volunteerHistory is empty", async () => {
    // Clear Charlie's volunteerHistory
    const charlie = users.find((u) => u.id === 3);
    charlie.volunteerHistory = [];
    
    const userId = 3;
    const eventIndex = 0;

    const response = await request(app).delete(`/api/volunteer-history/${userId}/${eventIndex}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid event index");
  });
});