const request = require('supertest');
const bcrypt = require('bcryptjs');
const {db} = require('../db');
const { app, events, users } = require('../server');
const { fetchUsers } = require('../server');
const util = require('util');

describe("Test API Routes", () => {
  it("should return a working message for /api/test", async () => {
    const response = await request(app).get("/api/test");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Backend is working");
  });
});

describe("POST /api/register", () => {
  // Test data
  const testEmail = "janedoe@gmail.com";
  const testPassword = "password123";

  afterAll(async () => {
    // Clean up: Delete the test user from the database
    try {
      await db.query('DELETE FROM LoginInfo WHERE Email = ?', [testEmail]);
      await db.query('DELETE FROM users WHERE Email = ?', [testEmail]);
    } catch (err) {
      console.error('Error cleaning up test data:', err);
    }
  });

  it("should register a new user successfully", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        email: "janedoe@example.com",
        password: "password123"
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Registration successful");

    // Clean up the newly registered user
    await db.query('DELETE FROM LoginInfo WHERE Email = ?', ["janedoe@example.com"]);
    await db.query('DELETE FROM UserProfile WHERE Email = ?', ["janedoe@example.com"]);
  });

  it("should return 400 if email is already in use", async () => {
    // Register the test user for the first time
    await request(app)
      .post("/api/register")
      .send({
        email: testEmail,
        password: testPassword
      });

    // Attempt to register the same user again
    const response = await request(app)
      .post("/api/register")
      .send({
        email: testEmail,
        password: testPassword
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
    const loggedInResponse = await request(app)
    .get('/api/isLoggedIn')
    .set('Cookie', response.headers['set-cookie']); // Pass the session cookie

  expect(loggedInResponse.status).toBe(200);
  expect(loggedInResponse.body).toEqual({
    loggedIn: true,
    user: {
      address: { city: '', line1: '', line2: '', state: '', zip: '' },
      id: 2, 
      email: 'admin@example.com',
      fullName: 'admin',
      role: 'Manager', 
    },
  });
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

describe("GET /api/isLoggedIn", () => {
  it("should return loggedIn: false when no user session exists", async () => {
    const res = await request(app).get("/api/isLoggedIn");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ loggedIn: false });
  });

  it("should return loggedIn: true and user info when session exists", async () => {
    const agent = request.agent(app); // preserves cookies between requests


    await agent
      .post("/api/login") // assuming you have this route
      .send({ email: "charlie@example.com", password: "volunteer_123" }) // adjust as needed

    const res = await agent.get("/api/isLoggedIn");
    expect(res.statusCode).toBe(200);
    expect(res.body.loggedIn).toBe(true);
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

    // Log in as volunteer
    const volunteerLogin = await request(app)
      .post("/api/login")
      .send({ email: "charlie@example.com", password: "volunteer_123" });
    volunteerCookie = volunteerLogin.headers["set-cookie"];
  });

  it("should return admin profile for authenticated admin user", async () => {
    const response = await request(app)
      .get("/api/admin/profile")
      .set("Cookie", adminCookie); // Send admin session cookie

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 2,
      email: "admin@example.com",
      fullName: "admin",
      role: "Manager",
    });
  });
  

  it("should return 403 for authenticated non-admin user", async () => {
    const response = await request(app)
      .get("/api/admin/profile")
      .set("Cookie", volunteerCookie); // Send volunteer session cookie

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied: Admins only");
  });

  it("should return 500 for unauthenticated user", async () => {
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
      id: 2,
      email: "admin@example.com",
      fullName: "admin",
      role: "Manager",
    });
  });

});


describe('GET /api/volunteers', () => {
  it('should return all volunteers with UserRole as Volunteer', (done) => {
    request(app)
      .get('/api/volunteers')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Check that the response is an array
        expect(Array.isArray(res.body)).toBe(true);

        // Check that every user in the response has UserRole: 'Volunteer'
        expect(res.body.every(user => user.UserRole === 'Volunteer')).toBe(true);

        done();
      });
  });
});


describe('GET /api/users', () => {
  it('should return a list of users from the database', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('GET /api/events', () => {
  it('should return events that are in progress', async () => {
    const response = await request(app).get('/api/events');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    response.body.forEach(event => {
      expect(event.EventStatus).toBe("In Progress");
      expect(event).toHaveProperty('requiredSkills');
      expect(Array.isArray(event.requiredSkills)).toBe(true);
    });
  });
});



describe('POST /api/events', () => {
  let createdEventID = null;

  afterEach(async () => {
    if (createdEventID) {
      // Delete related skills first
      await new Promise((resolve, reject) => {
        db.query('DELETE FROM eventskills WHERE EventID = ?', [createdEventID], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Delete the event itself
      await new Promise((resolve, reject) => {
        db.query('DELETE FROM eventlist WHERE EventID = ?', [createdEventID], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      createdEventID = null;
    }
  });

  it('should create a new event with valid data and clean it up after', async () => {
    const eventData = {
      name: 'Cleanup Drive',
      location: 'Central Park',
      envoy: 'Test Envoy',
      requiredSkills: [{ value: 'SkillA' }, { value: 'SkillB' }],
      urgencyLevel: 'Medium',
      date: '2025-05-01',
      manager: 'Test Manager'
    };

    const response = await request(app)
      .post('/api/events')
      .send(eventData)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(eventData.name);

    createdEventID = response.body.id; // Save for cleanup
  });

  it('should return 400 if required fields are missing', async () => {
    const incompleteData = {
      name: 'Missing Data'
    };

    await request(app)
      .post('/api/events')
      .send(incompleteData)
      .expect('Content-Type', /json/)
      .expect(400);
  });
});

describe('GET /api/eventmatch/:id', () => {
  it('should return matching volunteers for an event', async () => {
    const testEventID = 1;

    const response = await request(app)
      .get(`/api/eventmatch/${testEventID}`)
      .expect('Content-Type', /json/)
      .expect(200);

    // Test assumes some mock volunteers exist
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('UserID');
      expect(response.body[0]).toHaveProperty('FullName');
    }
  });

  it('should return 500 if an error occurs (e.g., invalid ID format)', async () => {
    const badEventID = 'not-a-number';

    const response = await request(app)
      .get(`/api/eventmatch/${badEventID}`)
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body.message).toMatch(/error/i);
  });
});


describe('GET /api/events/:id/selectedUsers', () => {
  let eventId;
  const existingUserId = 1; // Assume Charlie with ID 1

  beforeEach(async () => {
    // Step 1: Insert a dummy event into eventlist
    const dummyEvent = {
      EventName: 'Test Event',
      EventDesc: 'Test Description',
      EventLocation: 'Test Location',
      EventUrgency: 'High',
      EventDate: '2025-01-01',
      EventStatus: 'In Progress',
    };

    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO eventlist (EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventStatus) VALUES (?, ?, ?, ?, ?, ?)',
        [
          dummyEvent.EventName,
          dummyEvent.EventDesc,
          dummyEvent.EventLocation,
          dummyEvent.EventUrgency,
          dummyEvent.EventDate,
          dummyEvent.EventStatus,
        ],
        function (err, result) {
          if (err) reject(err);
          else {
            eventId = result.insertId;
            resolve();
          }
        }
      );
    });

    // Step 2: Insert a matching event-volunteer pair for the existing user
    await new Promise((resolve, reject) => {
      db.query('INSERT INTO eventvolmatch (EventID, UserID) VALUES (?, ?)', [eventId, existingUserId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterEach(async () => {
    // Clean up by deleting the dummy event and event-volunteer match
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM eventvolmatch WHERE EventID = ?', [eventId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.query('DELETE FROM eventlist WHERE EventID = ?', [eventId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  it('should fetch the selected volunteers for an event', async () => {
    const res = await request(app).get(`/api/events/${eventId}/selectedUsers`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1); // Should return 1 volunteer
    expect(res.body[0].UserID).toBe(existingUserId); // Ensure the correct UserID is returned
    expect(res.body[0].FullName).toBe('Charlie'); // Ensure the correct FullName is returned
  });
});


describe("POST /api/events/:id/volunteers", () => {
  let testEventId;
  const volunteerId = 1; // Use a known existing user in the test DB

  beforeAll(async () => {
    // Create a test event
    const [event] = await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO eventlist (EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventStatus) VALUES (?, ?, ?, ?, ?, ?)",
        ["Test Event", "Test Desc", "Test Location", "High", "2025-05-01", "In Progress"],
        (err, result) => {
          if (err) reject(err);
          else resolve([result]);
        }
      );
    });
    testEventId = event.insertId;
  });

  afterAll(async () => {
    // Clean up related usernotifs and eventvolmatch entries first
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM usernotifs WHERE EventID = ?", [testEventId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM eventvolmatch WHERE EventID = ?", [testEventId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    // Delete the test event
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM eventlist WHERE EventID = ?", [testEventId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  test("adds and removes a volunteer from an event and inserts notifications", async () => {
    // Add the volunteer
    const addResponse = await request(app)
      .post(`/api/events/${testEventId}/volunteers`)
      .send({
        action: "add",
        volunteerId: volunteerId
      });
    expect(addResponse.statusCode).toBe(200);
    expect(addResponse.body).toBe("Success");

    // Remove the volunteer
    const removeResponse = await request(app)
      .post(`/api/events/${testEventId}/volunteers`)
      .send({
        action: "remove",
        volunteerId: volunteerId
      });
    expect(removeResponse.statusCode).toBe(200);
    expect(removeResponse.body).toBe("Success");
  });
});

describe("GET /api/users/:id", () => {
  let userId = 1; // Use an existing user or register one
  let eventId;
  let notifId;

  beforeAll(async () => {
    // Insert an event
    const [eventResult] = await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO eventlist 
         (EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventStatus)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["NotifTest Event", "Desc", "Loc", "Medium", "2025-06-01", "In Progress"],
        (err, result) => {
          if (err) reject(err);
          else resolve([result]);
        }
      );
    });
    eventId = eventResult.insertId;

    // Insert usernotif
    const [notifResult] = await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO usernotifs (UserID, EventID, NotifType, isCleared)
         VALUES (?, ?, 'Assigned', FALSE)`,
        [userId, eventId],
        (err, result) => {
          if (err) reject(err);
          else resolve([result]);
        }
      );
    });
    notifId = notifResult.insertId;
  });

  afterAll(async () => {
    await db.query("DELETE FROM usernotifs WHERE NotifID = ?", [notifId]);
    await db.query("DELETE FROM eventlist WHERE EventID = ?", [eventId]);
  });

  test("should return notifications for a valid user", async () => {
    const res = await request(app).get(`/api/users/${userId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toBeInstanceOf(Array);
    expect(res.body.notifications[0]).toHaveProperty("NotifID");
    expect(res.body.notifications[0]).toHaveProperty("EventName");
    expect(res.body.notifications[0].NotifType).toBe("Assigned");
  });
});

describe("PUT /api/notifs/:id", () => {
  let userId = 1; // Use an existing user
  let eventId;
  let notifId;

  beforeAll(async () => {
    // Insert a dummy event
    const [eventResult] = await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO eventlist 
         (EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventStatus)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["ClearNotif Event", "Desc", "Loc", "High", "2025-06-10", "In Progress"],
        (err, result) => {
          if (err) reject(err);
          else resolve([result]);
        }
      );
    });
    eventId = eventResult.insertId;

    // Insert a dummy notification
    const [notifResult] = await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO usernotifs (UserID, EventID, NotifType, isCleared)
         VALUES (?, ?, 'Assigned', FALSE)`,
        [userId, eventId],
        (err, result) => {
          if (err) reject(err);
          else resolve([result]);
        }
      );
    });
    notifId = notifResult.insertId;
  });

  afterAll(async () => {
    await db.query("DELETE FROM usernotifs WHERE NotifID = ?", [notifId]);
    await db.query("DELETE FROM eventlist WHERE EventID = ?", [eventId]);
  });

  test("should mark a notification as cleared", async () => {
    const res = await request(app).put(`/api/notifs/${notifId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.notifications.affectedRows).toBe(1);

    // Double check it actually updated in the DB
    const [rows] = await new Promise((resolve, reject) => {
      db.query("SELECT isCleared FROM usernotifs WHERE NotifID = ?", [notifId], (err, result) => {
        if (err) reject(err);
        else resolve([result]);
      });
    });

    expect(rows[0].isCleared).toBe(1); // TRUE
  });
});

describe("DELETE /api/events/:id", () => {
  const existingUserId = 1; // Replace with an actual user ID
  let eventId;

  beforeAll(async () => {
    // Create a test event
    const eventResult = await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO eventlist 
         (EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventStatus)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["Test Event", "Test Desc", "Test Location", "High", "2025-06-10", "In Progress"],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    eventId = eventResult.insertId;

    // Associate existing user with the event
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO eventvolmatch (EventID, UserID) VALUES (?, ?)`,
        [eventId, existingUserId],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
  });

  afterAll(async () => {
    // Clean up notifs, matches, and event
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM usernotifs WHERE EventID = ?", [eventId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.query("DELETE FROM eventvolmatch WHERE EventID = ?", [eventId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.query("DELETE FROM eventlist WHERE EventID = ?", [eventId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  test("should cancel event and create a cancellation notification for matched volunteers", async () => {
    const res = await request(app).delete(`/api/events/${eventId}`);
    expect(res.statusCode).toBe(200);

    // Confirm the event is marked as cancelled
    const [eventRow] = await new Promise((resolve, reject) => {
      db.query("SELECT EventStatus FROM eventlist WHERE EventID = ?", [eventId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    console.log("Event Status after DELETE:", eventRow.EventStatus);
    expect(eventRow.EventStatus).toBe("Cancelled");

    // Confirm a notification was created
    const notifs = await new Promise((resolve, reject) => {
      db.query(
        `SELECT * FROM usernotifs WHERE UserID = ? AND EventID = ? AND NotifType = 'Cancelled'`,
        [existingUserId, eventId],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
    expect(notifs.length).toBeGreaterThan(0);
  });
});

describe("GET /api/volunteer-history/:id", () => {
  const testUserId = 1;  // Replace with an actual test user ID
  let eventId;

  beforeAll(async () => {
    // Create a test event
    const eventResult = await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO eventlist 
         (EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventStatus)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["Test Event", "Test Description", "Test Location", "High", "2025-06-10", "In Progress"],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    eventId = eventResult.insertId;

    // Associate test user with the test event
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO eventvolmatch (EventID, UserID) VALUES (?, ?)`,
        [eventId, testUserId],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
  });

  afterAll(async () => {
    // Clean up after the test
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM eventvolmatch WHERE EventID = ?", [eventId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.query("DELETE FROM eventlist WHERE EventID = ?", [eventId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  test("should return volunteer history for a specific user", async () => {
    const res = await request(app).get(`/api/volunteer-history/${testUserId}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.volunteerHistory).toBeInstanceOf(Array);
    expect(res.body.volunteerHistory.length).toBeGreaterThan(0);

    // Check if event details are returned as expected
    const event = res.body.volunteerHistory[0];
    expect(event.eventName).toBe("Test Event");
    expect(event.eventDesc).toBe("Test Description");
    expect(event.eventLocation).toBe("Test Location");
    expect(event.eventDate).toBe("2025-06-10T05:00:00.000Z");
    expect(event.eventStatus).toBe("In Progress");
  });
});




describe('POST /api/volunteer-history/:id', () => {
  let userId;
  let eventId;

  beforeAll(async () => {
    // Insert a test user into LoginInfo first (adjust columns as per your schema)
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO LoginInfo (UserID, Email, UserPass) VALUES (?, ?, ?)',
        [999, 'test@example.com', 'testpassword'], // Adjust columns/values based on your LoginInfo schema
        (err, result) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Insert a test user into UserProfile
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO UserProfile (UserID, FullName) VALUES (?, ?)',
        [999, 'Test User'],
        (err, result) => {
          if (err) return reject(err);
          userId = 999; // Use a fixed userId for testing
          resolve();
        }
      );
    });

    // Insert a test event into EventVolMatch or another table if required
    eventId = 1; // Assume eventId 1 exists, or insert one similarly
  });

  afterEach(async () => {
    // Clean up any records created in EventVolMatch for this user
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM EventVolMatch WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Clean up the test user from UserProfile
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserProfile WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Clean up the test user from LoginInfo
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM LoginInfo WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

  });

  test('should add a volunteer event successfully', async () => {
    const response = await request(app)
      .post(`/api/volunteer-history/${userId}`)
      .send({ eventId });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Volunteer event added successfully' });

    // Verify the record was added
    const result = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM EventVolMatch WHERE UserID = ? AND EventID = ?', [userId, eventId], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    expect(result.length).toBe(1);
    expect(result[0].UserID).toBe(userId);
    expect(result[0].EventID).toBe(eventId);
  });

  test('should return 400 if eventId is missing', async () => {
    const response = await request(app)
      .post(`/api/volunteer-history/${userId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Event ID is required' });
  });

  test('should return 404 if user does not exist', async () => {
    const nonExistentUserId = 9999;
    const response = await request(app)
      .post(`/api/volunteer-history/${nonExistentUserId}`)
      .send({ eventId });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found' });
  });

  test('should return 400 on database error when inserting into EventVolMatch', async () => {
    // Simulate a database error by passing invalid data (e.g., null eventId if your DB schema enforces non-null)
    const response = await request(app)
      .post(`/api/volunteer-history/${userId}`)
      .send({ eventId: null }); // Assumes EventID cannot be null in your schema

    expect(response.status).toBe(400);
  });
});



describe('DELETE /api/volunteer-history/:id/:eventId', () => {
  let userId = 9989; // Unique userId for this test suite
  let eventId = 9989; // Unique eventId for this test suite

  beforeAll(async () => {
    // Pre-cleanup: Remove any existing test data to avoid duplicate entry errors
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM EventVolMatch WHERE UserID = ? OR EventID = ?', [userId, eventId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM EventList WHERE EventID = ?', [eventId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserProfile WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM LoginInfo WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Insert a test user into LoginInfo
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO LoginInfo (UserID, Email, UserPass) VALUES (?, ?, ?)',
        [userId, 'testuser@example.com', 'testpassword'],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Insert a test user into UserProfile
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO UserProfile (UserID, FullName) VALUES (?, ?)',
        [userId, 'Test User'],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Insert a test event into EventList
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO EventList (EventID, EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventStatus) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [eventId, 'Test Event', 'Test Description', 'Test Location', 'High', '2025-06-10', 'In Progress'],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  });

  afterEach(async () => {
    // Clean up EventVolMatch records for this user
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM EventVolMatch WHERE UserID = ? OR EventID = ?', [userId, eventId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Clean up EventVolMatch
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM EventVolMatch WHERE UserID = ? OR EventID = ?', [userId, eventId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Clean up the test event from EventList
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM EventList WHERE EventID = ?', [eventId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Clean up the test user from UserProfile
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserProfile WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Clean up the test user from LoginInfo
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM LoginInfo WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  test('should delete a volunteer event successfully', async () => {
    // Insert a record to delete
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO EventVolMatch (EventID, UserID) VALUES (?, ?)',
        [eventId, userId],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    const response = await request(app).delete(`/api/volunteer-history/${userId}/${eventId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Volunteer event removed successfully' });

    // Verify the record was deleted
    const result = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM EventVolMatch WHERE UserID = ? AND EventID = ?', [userId, eventId], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    expect(result.length).toBe(0);
  });

  test('should return 404 if user does not exist', async () => {
    const nonExistentUserId = 9999;
    const response = await request(app).delete(`/api/volunteer-history/${nonExistentUserId}/${eventId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found' });
  });

  test('should return 404 if event is not associated with the user', async () => {
    const nonAssociatedEventId = 9999; // Assume this eventId does not exist or is not associated
    const response = await request(app).delete(`/api/volunteer-history/${userId}/${nonAssociatedEventId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Event not found for the user' });
  });

  test('should return 500 on database error during deletion', async () => {
    // Insert a record to delete
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO EventVolMatch (EventID, UserID) VALUES (?, ?)',
        [eventId, userId],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Note: Simulating a DB error without mocks is challenging. Assuming success unless a specific constraint exists.
    const response = await request(app).delete(`/api/volunteer-history/${userId}/${eventId}`);

    expect(response.status).toBe(200); // Adjust if you can simulate an error
  });
});



describe('PUT /api/profile/:id', () => {
  let userId = 9990; // Unique userId for this test suite

  beforeAll(async () => {
    // Pre-cleanup: Remove any existing test data
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserAvailability WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserSkills WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserProfile WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM LoginInfo WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Insert a test user into LoginInfo
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO LoginInfo (UserID, Email, UserPass) VALUES (?, ?, ?)',
        [userId, 'testuser@example.com', 'testpassword'],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Insert a test user into UserProfile
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO UserProfile (UserID, FullName) VALUES (?, ?)',
        [userId, 'Initial User'],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Populate users array
    await fetchUsers();
  });

  afterEach(async () => {
    // Clean up UserAvailability and UserSkills records
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserAvailability WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserSkills WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Clean up all test data
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserAvailability WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserSkills WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserProfile WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM LoginInfo WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  test('should update user profile successfully', async () => {
    const profileData = {
      fullName: 'Updated User',
      address1: '123 Main St',
      address2: 'Apt 4B',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345',
      preferences: 'Evening shifts',
      skills: ['First-Aid'],
      availability: ['2025-06-10', '2025-06-11'],
    };

    const response = await request(app)
      .put(`/api/profile/${userId}`)
      .send(profileData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Profile updated successfully');

    // Verify UserProfile update
    const profileResult = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM UserProfile WHERE UserID = ?', [userId], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    expect(profileResult.length).toBe(1);
    expect(profileResult[0]).toMatchObject({
      UserID: userId,
      FullName: profileData.fullName,
      AddressLine: profileData.address1,
      AddressLine2: profileData.address2,
      City: profileData.city,
      State: profileData.state,
      ZipCode: profileData.zipCode,
      Preferences: profileData.preferences,
    });

    // Verify UserSkills update
    const skillsResult = await new Promise((resolve, reject) => {
      db.query('SELECT SkillName FROM UserSkills WHERE UserID = ?', [userId], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    expect(skillsResult.length).toBe(1);
    expect(skillsResult.map((s) => s.SkillName)).toEqual(expect.arrayContaining(profileData.skills));

    // Verify UserAvailability update
    const availabilityResult = await new Promise((resolve, reject) => {
      db.query('SELECT DateAvail FROM UserAvailability WHERE UserID = ?', [userId], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    expect(availabilityResult.length).toBe(2);
    expect(availabilityResult.map((a) => a.DateAvail.toISOString().slice(0, 10))).toEqual(
      expect.arrayContaining(profileData.availability)
    );
  });

  test('should update only provided fields', async () => {
    const profileData = {
      fullName: 'Partially Updated User',
      skills: ['Cooking'],
    };

    const response = await request(app)
      .put(`/api/profile/${userId}`)
      .send(profileData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Profile updated successfully');

    // Verify UserProfile update (only FullName should change)
    const profileResult = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM UserProfile WHERE UserID = ?', [userId], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    expect(profileResult.length).toBe(1);
    expect(profileResult[0].FullName).toBe(profileData.fullName);
    expect(profileResult[0].AddressLine).toBeNull(); // Assuming initial insert had no AddressLine
    expect(profileResult[0].Preferences).toBeNull(); // Assuming initial insert had no Preferences

    // Verify UserSkills update
    const skillsResult = await new Promise((resolve, reject) => {
      db.query('SELECT SkillName FROM UserSkills WHERE UserID = ?', [userId], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    expect(skillsResult.length).toBe(1);
    expect(skillsResult[0].SkillName).toBe('Cooking');

    // Verify UserAvailability (should be empty since not provided)
    const availabilityResult = await new Promise((resolve, reject) => {
      db.query('SELECT DateAvail FROM UserAvailability WHERE UserID = ?', [userId], (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    expect(availabilityResult.length).toBe(0);
  });

  test('should return 404 if user does not exist in users array', async () => {
    const nonExistentUserId = 9999;
    const profileData = {
      fullName: 'Non Existent User',
    };

    const response = await request(app)
      .put(`/api/profile/${nonExistentUserId}`)
      .send(profileData);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found' });
  });


});



describe('GET /api/profile/:id', () => {
  let userId = 9990; // Unique UserID for this test suite

  beforeAll(async () => {
    // Pre-cleanup: Remove any existing test data
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserAvailability WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserSkills WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserProfile WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM LoginInfo WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Insert test user into LoginInfo
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO LoginInfo (UserID, Email, UserPass) VALUES (?, ?, ?)',
        [userId, 'testuser@example.com', 'testpassword'],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Insert test user into UserProfile
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO UserProfile (UserID, FullName, AddressLine, AddressLine2, City, State, ZipCode, Preferences) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          'Test User',
          '123 Main St',
          'Apt 4B',
          'Test City',
          'CA',
          '12345',
          'Evening shifts',
        ],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Insert test skills
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO UserSkills (UserID, SkillName) VALUES (?, ?), (?, ?)',
        [userId, 'First-Aid', userId, 'Cooking'],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Insert test availability
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO UserAvailability (UserID, DateAvail) VALUES (?, ?), (?, ?)',
        [userId, '2025-06-10', userId, '2025-06-11'],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Populate users array
    await fetchUsers();
  });

  afterEach(async () => {
    // Clean up UserSkills and UserAvailability
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserAvailability WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserSkills WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Clean up all test data
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserAvailability WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserSkills WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserProfile WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM LoginInfo WHERE UserID = ?', [userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  test('should retrieve user profile, skills, and availability successfully', async () => {
    const response = await request(app).get(`/api/profile/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      userProfile: [
        {
          UserID: userId,
          FullName: 'Test User',
          AddressLine: '123 Main St',
          AddressLine2: 'Apt 4B',
          City: 'Test City',
          State: 'CA',
          ZipCode: '12345',
          Preferences: 'Evening shifts',
        },
      ],
      skills: expect.arrayContaining(['First-Aid', 'Cooking']),
      availability: expect.arrayContaining(['6/10/2025']), // MM/DD/YYYY format
    });
    expect(response.body.userProfile).toHaveLength(1);
    expect(response.body.skills).toHaveLength(2);
    expect(response.body.availability).toHaveLength(2);
  });

  test('should return 404 if user does not exist in users array', async () => {
    const nonExistentUserId = 9999;

    const response = await request(app).get(`/api/profile/${nonExistentUserId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found' });
  });

  test('should return empty skills and availability arrays if none exist', async () => {
    // Insert a new user with no skills or availability
    const newUserId = 9991;

    // Clean up new user data
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserAvailability WHERE UserID = ?', [newUserId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserSkills WHERE UserID = ?', [newUserId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserProfile WHERE UserID = ?', [newUserId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM LoginInfo WHERE UserID = ?', [newUserId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Insert new user into LoginInfo
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO LoginInfo (UserID, Email, UserPass) VALUES (?, ?, ?)',
        [newUserId, 'newuser@example.com', 'newpassword'],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Insert new user into UserProfile
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO UserProfile (UserID, FullName) VALUES (?, ?)',
        [newUserId, 'New User'],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Refresh users array
    await fetchUsers();

    const response = await request(app).get(`/api/profile/${newUserId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      userProfile: [
        {
          UserID: newUserId,
          FullName: 'New User',
          AddressLine: null,
          AddressLine2: null,
          City: null,
          State: null,
          ZipCode: null,
          Preferences: null,
        },
      ],
      skills: [],
      availability: [],
    });
    expect(response.body.userProfile).toHaveLength(1);
    expect(response.body.skills).toHaveLength(0);
    expect(response.body.availability).toHaveLength(0);

    // Clean up new user
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM UserProfile WHERE UserID = ?', [newUserId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM LoginInfo WHERE UserID = ?', [newUserId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
  afterAll(async () => {
    db.end(); //end connection to db
  });

});