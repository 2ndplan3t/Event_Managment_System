const { db } = require("../db");
const request = require('supertest');
const { app } = require('../server');

describe('POST /api/volunteer-history/:id', () => {

  beforeAll(async () => {
    // Connect to the database and set data
    await db.query('INSERT INTO LoginInfo (UserPass, UserRole) VALUES ("TestPass123", "Volunteer")');
    await db.query('INSERT INTO UserProfile (UserID, FullName, AddressLine, City, State, ZipCode) VALUES (1, "Test User", "123 Test St", "Test City", "TS", "12345")');
  });

  afterAll(async () => {
    // Clean up after tests
    await db.query('DELETE FROM UserProfile');
    await db.query('DELETE FROM LoginInfo');
  });

  beforeEach(async () => {

    await db.query('DELETE FROM EventVolMatch');  // Clear volunteer event matches before each test
  });

  afterEach(async () => {

  });

  test('should add a volunteer event to an existing user\'s history', async () => {
    //add sample event
    await db.query('INSERT INTO EventList (EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventStatus) VALUES ("Test Event", "Test Description", "Test Location", "High", "2025-03-21", "In Progress")');


    const eventId = 1;
    const userId = 1; 

    const response = await request(app)
      .post(`/api/volunteer-history/${userId}`)
      .send({ eventId, status: "In Progress" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Volunteer event added successfully');
  });

  test('should return 404 if user ID does not exist', async () => {
    const invalidUserId = 9999; // User ID that doesn't exist

    const response = await request(app)
      .post(`/api/volunteer-history/${invalidUserId}`)
      .send({ eventId: 1, status: "In Progress" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  test('should return 400 if event ID is missing', async () => {
    const userId = 1;

    const response = await request(app)
      .post(`/api/volunteer-history/${userId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Event ID is required');
  });

  test('should append to an existing volunteer history', async () => {
    // Assume an event is already added
    const eventId = 1;
    const userId = 1;

    // Add a volunteer event to the user's history
    await db.query('INSERT INTO EventVolMatch (EventID, UserID) VALUES (?, ?)', [eventId, userId]);

    //verify the event was added to the history
    const response = await request(app).get(`/api/volunteer-history/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body.volunteerHistory.length).toBeGreaterThan(0); //at least one event in history
  });


});