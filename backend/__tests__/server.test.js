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

// Test GET /api/users/:id to fetch notifications
describe('GET /api/users/:id', () => {
  it('should return the user object when a valid user id is provided', async () => {
    // Assuming you have some sample users array with IDs
    const response = await request(app).get('/api/users/3'); // Example with user ID 1

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 3);
    expect(response.body).toHaveProperty('notifications');
  });

  it('should return a 404 error when user is not found', async () => {
    const response = await request(app).get('/api/users/999'); // Example with a non-existent user ID

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
});

// Test PUT /api/users/:id to edit user notifications
describe('PUT /api/users/:id', () => {
  it('should update user notifications successfully when a valid user id is provided', async () => {
    const newNotifs = ['new_notification_1', 'new_notification_2'];

    const response = await request(app)
      .put('/api/users/1') // Example with user ID 1
      .send(newNotifs); // Sending new notifications array

    expect(response.status).toBe(200);
    expect(response.body.notifications).toEqual(newNotifs);
  });

  it('should return a 404 error when user is not found', async () => {
    const newNotifs = ['new_notification_1', 'new_notification_2'];

    const response = await request(app)
      .put('/api/users/999') // Example with a non-existent user ID
      .send(newNotifs);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
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

  it('should return loggedIn false if user is not logged in', async () => {
    // Simulate an empty session (logged-out state)
    const response = await request(app).get('/api/isLoggedIn');
    
    expect(response.status).toBe(200); // Ensure a successful request
    expect(response.body.loggedIn).toBe(false); // Ensure loggedIn is false
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
beforeEach(() => {
  events.length = 0;
});

describe('POST /api/events', () => {
  
  it('should create a new event successfully', async () => {
    // Test data
    const newEventData = {
      name: 'Test Event',
      location: 'Test Location',
      envoy: 'Test Envoy',
      requiredSkills: ['First Aid'],
      urgencyLevel: 'High',
      date: '2025-03-15',
      manager: 'Test Manager',
    };

    // Send POST request
    const response = await request(app)
      .post('/api/events')
      .send(newEventData);

    // Check the response status and body
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),  // ID should be a number, and it should be assigned properly
      name: 'Test Event',
      location: 'Test Location',
      envoy: 'Test Envoy',
      requiredSkills: ['First Aid'],
      urgencyLevel: 'High',
      date: '2025-03-15',
      manager: 'Test Manager',
      selectedVolunteers: [],  // Default selectedVolunteers should be an empty array
    });

    // Also check if the event was added to the events array
    expect(events.length).toBe(1);
    expect(events[0].name).toBe('Test Event');
  });

  it('should return a 400 error if required fields are missing', async () => {
    // Send POST request with missing required fields
    const response = await request(app)
      .post('/api/events')
      .send({
        name: 'Test Event', // Missing other required fields like location, envoy, etc.
      });

    // Check the response status and message
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Required fields are missing');
    
    // Ensure no events are created when there is a validation error
    expect(events.length).toBe(0);
  });
});

beforeEach(() => {
  events.splice(0, events.length); // Reset the events array before each test
});

describe('DELETE /api/events/:id', () => {
  it('should delete the event and return a success message', async () => {
    // Create an event first
    const newEventData = {
      name: 'Test Event',
      location: 'Test Location',
      envoy: 'Test Envoy',
      requiredSkills: ['First Aid'],
      urgencyLevel: 'High',
      date: '2025-03-15',
      manager: 'Test Manager',
    };

    const createResponse = await request(app)
      .post('/api/events')
      .send(newEventData);

    const createdEvent = createResponse.body;
    expect(events.length).toBe(1); // Confirm the event was added

    // Send DELETE request
    const deleteResponse = await request(app)
      .delete(`/api/events/${createdEvent.id}`);

    // Check delete response status and message
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe('Event deleted successfully.');


    expect(events.length).toBe(1);
  });

  it('should return a 404 error if event does not exist', async () => {
    const invalidEventId = 999;

    // Send DELETE request for a non-existent event
    const response = await request(app)
      .delete(`/api/events/${invalidEventId}`);

    // Check the response status and message
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Event not found');
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

  it("should return an empty array if no events exist", async () => {
    events.length = 0; // Clear events
    const response = await request(app).get("/api/events");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
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

  it("should return 400 if fullName is missing", async () => {
    const newEvent = {
      event: "Food Drive",
      eventdesc: "Collected food for the needy",
      location: "123 Elm St",
      date: "2024-07-01",
      status: "Completed",
      address1: "456 Oak St",
      city: "Houston",
      state: "TX",
      zipCode: "77001",
      skills: ["First Aid", "Security"],
    };
  
    const response = await request(app)
      .post("/api/volunteer-history/3")
      .send(newEvent);
  
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Full name is required");
  });
  
  it("should return 400 if address1 is missing", async () => {
    const newEvent = {
      event: "Food Drive",
      eventdesc: "Collected food for the needy",
      location: "123 Elm St",
      date: "2024-07-01",
      status: "Completed",
      fullName: "Charlie",
      city: "Houston",
      state: "TX",
      zipCode: "77001",
      skills: ["First Aid", "Security"],
    };
  
    const response = await request(app)
      .post("/api/volunteer-history/3")
      .send(newEvent);
  
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Address is required");
  });
  
  it("should return 400 if city is missing", async () => {
    const newEvent = {
      event: "Food Drive",
      eventdesc: "Collected food for the needy",
      location: "123 Elm St",
      date: "2024-07-01",
      status: "Completed",
      fullName: "Charlie",
      address1: "456 Oak St",
      state: "TX",
      zipCode: "77001",
      skills: ["First Aid", "Security"],
    };
  
    const response = await request(app)
      .post("/api/volunteer-history/3")
      .send(newEvent);
  
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("City is required");
  });
  
  it("should return 400 if state is missing", async () => {
    const newEvent = {
      event: "Food Drive",
      eventdesc: "Collected food for the needy",
      location: "123 Elm St",
      date: "2024-07-01",
      status: "Completed",
      fullName: "Charlie",
      address1: "456 Oak St",
      city: "Houston",
      zipCode: "77001",
      skills: ["First Aid", "Security"],
    };
  
    const response = await request(app)
      .post("/api/volunteer-history/3")
      .send(newEvent);
  
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("State is required");
  });
  
  it("should return 400 if zipCode is missing", async () => {
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
      skills: ["First Aid", "Security"],
    };
  
    const response = await request(app)
      .post("/api/volunteer-history/3")
      .send(newEvent);
  
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Zipcode is required");
  });
  
  it("should return 400 if skills are missing", async () => {
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
    };
  
    const response = await request(app)
      .post("/api/volunteer-history/3")
      .send(newEvent);
  
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Skills are required");
  });
  
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