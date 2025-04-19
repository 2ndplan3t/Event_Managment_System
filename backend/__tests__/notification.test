const request = require('supertest');
const { app, events, users } = require('../server');

// Test the `GET /api/users/:id` endpoint for fetching user notifications
describe('GET /api/users/:id', () => {
  it('should fetch notifications for user 3', async () => {
    const response = await request(app).get('/api/users/3'); // User ID 3

    expect(response.status).toBe(200);
    expect(response.body.notifications).toHaveLength(1); // Expect 1 notification for user 3
    expect(response.body.notifications[0]).toHaveProperty('notifID', 0);
    expect(response.body.notifications[0]).toHaveProperty('eventName', 'Cleaning the Beach');
    expect(response.body.notifications[0]).toHaveProperty('type', 'Assignment');
    expect(response.body.notifications[0]).toHaveProperty('text', "You've been assigned to an event! What follows is the event details:");
    expect(response.body.notifications[0]).toHaveProperty('isCleared', false);
    expect(response.body.notifications[0]).toHaveProperty('isVisible', true);
  });

  it('should return a 404 if user is not found', async () => {
    const response = await request(app).get('/api/users/999'); // Non-existent user

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });
});

// Test the `POST /api/logout` endpoint for logging out
describe('POST /api/logout', () => {
  it('should log the user out successfully', async () => {
    const response = await request(app)
      .post('/api/logout')
      .set('Cookie', 'userSession=validSession'); // Assuming cookie-based authentication

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logout successful');
  });
});
