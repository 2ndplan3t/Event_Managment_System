const request = require('supertest');
const bcrypt = require('bcryptjs');
const {db} = require('../db');
const { app, events, users } = require('../server');
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
      id: 100, 
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
      .send({ email: "alice@example.com", password: "volunteer_123" });
    volunteerCookie = volunteerLogin.headers["set-cookie"];
  });

  it("should return admin profile for authenticated admin user", async () => {
    const response = await request(app)
      .get("/api/admin/profile")
      .set("Cookie", adminCookie); // Send admin session cookie

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 100,
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
      id: 100,
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



